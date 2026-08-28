package services

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestUpdateService_Initialization(t *testing.T) {
	svc := NewUpdateService("mahdimomeni", "telepresence-gui", "1.0.0")
	if svc == nil {
		t.Fatal("expected non-nil UpdateService")
	}

	if svc.repoSlug != "mahdimomeni/telepresence-gui" {
		t.Errorf("expected repoSlug 'mahdimomeni/telepresence-gui', got %s", svc.repoSlug)
	}
	if svc.currentVersion != "1.0.0" {
		t.Errorf("expected currentVersion '1.0.0', got %s", svc.currentVersion)
	}
}

func TestUpdateProgress_Serialization(t *testing.T) {
	p := UpdateProgress{
		Percentage: 50,
		Status:     "downloading",
		Error:      "",
	}

	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("failed to marshal UpdateProgress: %v", err)
	}

	var parsed UpdateProgress
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal UpdateProgress: %v", err)
	}

	if parsed.Percentage != 50 || parsed.Status != "downloading" {
		t.Errorf("unmarshaled UpdateProgress mismatch: %+v", parsed)
	}
}

func TestUpdateInfo_Serialization(t *testing.T) {
	info := UpdateInfo{
		Available:      true,
		CurrentVersion: "1.0.0",
		LatestVersion:  "1.1.0",
		ReleaseNotes:   "Bug fixes and improvements",
		PublishedAt:    "2026-08-28T12:00:00Z",
		URL:            "https://github.com/mahdimomeni/telepresence-gui/releases/tag/v1.1.0",
	}

	data, err := json.Marshal(info)
	if err != nil {
		t.Fatalf("failed to marshal UpdateInfo: %v", err)
	}

	var parsed UpdateInfo
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal UpdateInfo: %v", err)
	}

	if !parsed.Available || parsed.LatestVersion != "1.1.0" || !strings.Contains(parsed.ReleaseNotes, "Bug fixes") {
		t.Errorf("unmarshaled UpdateInfo mismatch: %+v", parsed)
	}
}

func TestUpdateService_DownloadAndApply_AlreadyInProgress(t *testing.T) {
	svc := NewUpdateService("owner", "repo", "1.0.0")
	svc.mu.Lock()
	svc.isUpdating = true
	svc.mu.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err := svc.DownloadAndApply(ctx, func(p UpdateProgress) {})
	if err == nil || !strings.Contains(err.Error(), "already in progress") {
		t.Errorf("expected 'already in progress' error, got: %v", err)
	}
}
