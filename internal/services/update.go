package services

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"time"

	"github.com/creativeprojects/go-selfupdate"
)

type UpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes"`
	PublishedAt    string `json:"publishedAt"`
	URL            string `json:"url"`
}

type UpdateProgress struct {
	Percentage int    `json:"percentage"`
	Status     string `json:"status"` // "checking", "downloading", "installing", "done", "error"
	Error      string `json:"error,omitempty"`
}

type UpdateService struct {
	repoSlug       string
	currentVersion string
	mu             sync.Mutex
	cachedRelease  *selfupdate.Release
}

func NewUpdateService(owner, repo, currentVersion string) *UpdateService {
	return &UpdateService{
		repoSlug:       fmt.Sprintf("%s/%s", owner, repo),
		currentVersion: currentVersion,
	}
}

func (s *UpdateService) CheckForUpdate(ctx context.Context) (*UpdateInfo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	updater, err := selfupdate.NewUpdater(selfupdate.Config{
		Filters: []string{
			`telepresence-gui_.*_` + runtime.GOOS + `_` + runtime.GOARCH + getAbiTag() + `\.(tar\.gz|zip)`,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create updater: %w", err)
	}

	latest, found, err := updater.DetectLatest(ctx, selfupdate.ParseSlug(s.repoSlug))
	if err != nil {
		return nil, fmt.Errorf("failed to detect update: %w", err)
	}

	if !found {
		return &UpdateInfo{
			Available:      false,
			CurrentVersion: s.currentVersion,
		}, nil
	}

	s.cachedRelease = latest
	isGreater := latest.GreaterThan(s.currentVersion)

	var publishedAt string
	if !latest.PublishedAt.IsZero() {
		publishedAt = latest.PublishedAt.Format(time.RFC3339)
	}

	return &UpdateInfo{
		Available:      isGreater,
		CurrentVersion: s.currentVersion,
		LatestVersion:  latest.Version(),
		ReleaseNotes:   latest.ReleaseNotes,
		PublishedAt:    publishedAt,
		URL:            latest.URL,
	}, nil
}

func (s *UpdateService) DownloadAndApply(ctx context.Context, onProgress func(UpdateProgress)) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	updater, err := selfupdate.NewUpdater(selfupdate.Config{
		Filters: []string{
			`telepresence-gui_.*_` + runtime.GOOS + `_` + runtime.GOARCH + getAbiTag() + `\.(tar\.gz|zip)`,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to initialize updater: %w", err)
	}

	if s.cachedRelease == nil {
		onProgress(UpdateProgress{Percentage: 10, Status: "checking"})
		latest, found, err := updater.DetectLatest(ctx, selfupdate.ParseSlug(s.repoSlug))
		if err != nil {
			return fmt.Errorf("detect failed: %w", err)
		}
		if !found || latest == nil {
			return fmt.Errorf("no release found on repository %s", s.repoSlug)
		}
		s.cachedRelease = latest
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to resolve executable path: %w", err)
	}

	onProgress(UpdateProgress{Percentage: 35, Status: "downloading"})

	if err := updater.UpdateTo(ctx, s.cachedRelease, exePath); err != nil {
		onProgress(UpdateProgress{Percentage: 0, Status: "error", Error: err.Error()})
		return fmt.Errorf("failed to apply update: %w", err)
	}

	onProgress(UpdateProgress{Percentage: 100, Status: "done"})
	return nil
}

func (s *UpdateService) RestartApp() error {
	self, err := os.Executable()
	if err != nil {
		return err
	}

	cmd := exec.Command(self, os.Args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to launch updated binary: %w", err)
	}

	os.Exit(0)
	return nil
}
