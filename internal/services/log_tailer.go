package services

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// LogTailer discovers and monitors Telepresence log files (connector.log, daemon.log, cli.log)
// and streams new log lines to the frontend via Wails events.
type LogTailer struct {
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup
	mu       sync.Mutex
	watching map[string]bool
	onLog    func(string)
}

func NewLogTailer() *LogTailer {
	return &LogTailer{
		watching: make(map[string]bool),
	}
}

// SetOnLog allows configuring a custom log sink callback (useful for testing or external piping).
func (t *LogTailer) SetOnLog(onLog func(string)) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.onLog = onLog
}

// Start begins tailing Telepresence log files in the background.
func (t *LogTailer) Start(parentCtx context.Context) {
	t.mu.Lock()
	if t.cancel != nil {
		t.mu.Unlock()
		return
	}
	t.ctx, t.cancel = context.WithCancel(parentCtx)
	t.mu.Unlock()

	t.wg.Add(1)
	go t.discoveryLoop()
}

// Stop stops all active file tailers.
func (t *LogTailer) Stop() {
	t.mu.Lock()
	if t.cancel != nil {
		t.cancel()
		t.cancel = nil
	}
	t.mu.Unlock()
	t.wg.Wait()
}

// discoveryLoop periodically discovers candidate log files and starts tailing any newly found files.
func (t *LogTailer) discoveryLoop() {
	defer t.wg.Done()

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	// Initial scan
	t.scanAndWatch()

	for {
		select {
		case <-t.ctx.Done():
			return
		case <-ticker.C:
			t.scanAndWatch()
		}
	}
}

func (t *LogTailer) scanAndWatch() {
	dirs := getTelepresenceLogDirs()
	for _, dir := range dirs {
		if info, err := os.Stat(dir); err == nil && info.IsDir() {
			// Check standard telepresence log files
			logFileNames := []string{"connector.log", "daemon.log", "cli.log"}
			for _, name := range logFileNames {
				fullPath := filepath.Join(dir, name)
				if fileInfo, err := os.Stat(fullPath); err == nil && !fileInfo.IsDir() {
					t.mu.Lock()
					isWatched := t.watching[fullPath]
					if !isWatched {
						t.watching[fullPath] = true
						t.mu.Unlock()
						t.wg.Add(1)
						go t.tailFile(fullPath, name)
					} else {
						t.mu.Unlock()
					}
				}
			}
		}
	}
}

func (t *LogTailer) tailFile(filePath, fileName string) {
	defer func() {
		t.mu.Lock()
		delete(t.watching, filePath)
		t.mu.Unlock()
		t.wg.Done()
	}()

	file, err := os.Open(filePath)
	if err != nil {
		return
	}
	defer file.Close()

	// Read initial tail (last ~4KB) to capture recent context
	stat, err := file.Stat()
	if err == nil && stat.Size() > 0 {
		var seekPos int64
		if stat.Size() > 8192 {
			seekPos = stat.Size() - 8192
		}
		_, _ = file.Seek(seekPos, io.SeekStart)
		reader := bufio.NewReader(file)
		// If we skipped into the middle of a line, discard the partial line
		if seekPos > 0 {
			_, _ = reader.ReadString('\n')
		}
		for {
			line, err := reader.ReadString('\n')
			if line != "" {
				trimmed := strings.TrimRight(line, "\r\n")
				if trimmed != "" {
					t.emitLog(fileName, trimmed)
				}
			}
			if err != nil {
				break
			}
		}
	}

	// Now continuously tail new appended lines
	reader := bufio.NewReader(file)
	offset, _ := file.Seek(0, io.SeekCurrent)

	ticker := time.NewTicker(400 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-t.ctx.Done():
			return
		case <-ticker.C:
			currentStat, err := os.Stat(filePath)
			if err != nil {
				// File may have been removed or rotated
				continue
			}

			// If file was truncated/recreated
			if currentStat.Size() < offset {
				file.Close()
				newFile, err := os.Open(filePath)
				if err != nil {
					continue
				}
				file = newFile
				offset = 0
				reader = bufio.NewReader(file)
			}

			for {
				line, err := reader.ReadString('\n')
				if line != "" {
					trimmed := strings.TrimRight(line, "\r\n")
					if trimmed != "" {
						t.emitLog(fileName, trimmed)
					}
					offset, _ = file.Seek(0, io.SeekCurrent)
				}
				if err != nil {
					break
				}
			}
		}
	}
}

func (t *LogTailer) emitLog(fileName, line string) {
	tag := strings.TrimSuffix(fileName, ".log")
	if len(line) > 4096 {
		line = line[:4096] + "... [truncated]"
	}
	formatted := fmt.Sprintf("[%s] %s", tag, line)

	t.mu.Lock()
	cb := t.onLog
	t.mu.Unlock()

	if cb != nil {
		cb(formatted)
	} else if t.ctx != nil {
		wailsRuntime.EventsEmit(t.ctx, "daemon-log", formatted)
	}
}

func getTelepresenceLogDirs() []string {
	dirs := []string{}
	homeDir, _ := os.UserHomeDir()

	switch runtime.GOOS {
	case osWindows:
		if localApp := os.Getenv("LOCALAPPDATA"); localApp != "" {
			dirs = append(dirs,
				filepath.Join(localApp, "Telepresence", "Logs"),
				filepath.Join(localApp, "telepresence", "logs"),
				filepath.Join(localApp, "Telepresence"),
			)
		}
		if appData := os.Getenv("APPDATA"); appData != "" {
			dirs = append(dirs,
				filepath.Join(appData, "Telepresence", "Logs"),
				filepath.Join(appData, "telepresence", "logs"),
			)
		}
		if homeDir != "" {
			dirs = append(dirs, filepath.Join(homeDir, ".cache", "telepresence", "logs"))
		}
	case "darwin":
		if homeDir != "" {
			dirs = append(dirs,
				filepath.Join(homeDir, "Library", "Logs", "telepresence"),
				filepath.Join(homeDir, ".cache", "telepresence", "logs"),
			)
		}
	default: // linux, etc.
		if homeDir != "" {
			dirs = append(dirs, filepath.Join(homeDir, ".cache", "telepresence", "logs"))
		}
		dirs = append(dirs, "/root/.cache/telepresence/logs")
	}

	return dirs
}
