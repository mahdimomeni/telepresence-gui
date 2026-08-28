package services

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestGetTelepresenceLogDirs(t *testing.T) {
	dirs := getTelepresenceLogDirs()
	if len(dirs) == 0 {
		t.Errorf("expected getTelepresenceLogDirs to return at least one candidate directory")
	}

	for _, d := range dirs {
		if d == "" {
			t.Errorf("expected non-empty directory path in candidates list")
		}
	}
}

func TestLogTailer_Lifecycle(t *testing.T) {
	tailer := NewLogTailer()
	if tailer == nil {
		t.Fatal("expected non-nil LogTailer")
	}

	tailer.SetOnLog(func(line string) {})

	ctx, cancel := context.WithCancel(context.Background())
	tailer.Start(ctx)

	// Idempotent start check
	tailer.Start(ctx)

	time.Sleep(50 * time.Millisecond)

	cancel()
	tailer.Stop()

	// Idempotent stop check
	tailer.Stop()
}

func TestLogTailer_ScanAndWatchWithTempFile(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "log_tail_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	logFile := filepath.Join(tempDir, "connector.log")
	if err := os.WriteFile(logFile, []byte("line 1\nline 2\n"), 0o600); err != nil {
		t.Fatalf("failed to write log file: %v", err)
	}

	var logsReceived []string
	tailer := NewLogTailer()
	tailer.SetOnLog(func(line string) {
		logsReceived = append(logsReceived, line)
	})

	tailer.emitLog("connector.log", "hello world")
	if len(logsReceived) != 1 || logsReceived[0] != "[connector] hello world" {
		t.Errorf("unexpected emitted log format: %+v", logsReceived)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	tailer.Start(ctx)
	time.Sleep(50 * time.Millisecond)
	tailer.Stop()
}
