package services

import (
	"os"
	"path/filepath"
	"telepresence-gui/internal/models"
	"testing"
)

func TestConfigServiceAppSettings(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "config_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	service := NewConfigServiceWithDir(tempDir)

	// 1. Initial load should return defaults
	initialSettings, err := service.LoadAppSettings()
	if err != nil {
		t.Fatalf("failed to load initial settings: %v", err)
	}
	if initialSettings == nil {
		t.Fatal("expected non-nil initial settings")
	}
	if initialSettings.Theme != "dark" {
		t.Errorf("expected default theme 'dark', got %s", initialSettings.Theme)
	}
	if !initialSettings.EnableGlowEffects {
		t.Error("expected EnableGlowEffects to be true by default")
	}
	if initialSettings.MaxLogLines != 2000 {
		t.Errorf("expected MaxLogLines 2000, got %d", initialSettings.MaxLogLines)
	}

	// 2. Save customized settings
	custom := *initialSettings
	custom.Theme = "light"
	custom.EnableGlowEffects = false
	custom.DefaultNamespace = "staging-ns"
	custom.RequestTimeoutSeconds = 120
	custom.MaxLogLines = 5000

	if err := service.SaveAppSettings(custom); err != nil {
		t.Fatalf("failed to save custom settings: %v", err)
	}

	// 3. Load saved settings and verify
	loaded, err := service.LoadAppSettings()
	if err != nil {
		t.Fatalf("failed to load saved settings: %v", err)
	}
	if loaded.Theme != "light" {
		t.Errorf("expected theme 'light', got %s", loaded.Theme)
	}
	if loaded.EnableGlowEffects {
		t.Error("expected EnableGlowEffects to be false")
	}
	if loaded.DefaultNamespace != "staging-ns" {
		t.Errorf("expected DefaultNamespace 'staging-ns', got %s", loaded.DefaultNamespace)
	}
	if loaded.RequestTimeoutSeconds != 120 {
		t.Errorf("expected RequestTimeoutSeconds 120, got %d", loaded.RequestTimeoutSeconds)
	}
	if loaded.MaxLogLines != 5000 {
		t.Errorf("expected MaxLogLines 5000, got %d", loaded.MaxLogLines)
	}

	// 4. Reset settings
	reset, err := service.ResetAppSettings()
	if err != nil {
		t.Fatalf("failed to reset settings: %v", err)
	}
	if reset.Theme != "dark" {
		t.Errorf("expected reset theme 'dark', got %s", reset.Theme)
	}
	if reset.DefaultNamespace != "default" {
		t.Errorf("expected reset DefaultNamespace 'default', got %s", reset.DefaultNamespace)
	}
}

func TestConfigServiceConnectConfig(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "config_test_conn_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	service := NewConfigServiceWithDir(tempDir)

	cfg := models.ConnectConfig{
		Namespace:  "production",
		Context:    "prod-cluster",
		Kubeconfig: filepath.Join(tempDir, "kubeconfig"),
		Docker:     true,
	}

	if err := service.SaveConnectConfig(cfg); err != nil {
		t.Fatalf("failed to save connect config: %v", err)
	}

	loaded, err := service.LoadConnectConfig()
	if err != nil {
		t.Fatalf("failed to load connect config: %v", err)
	}
	if loaded.Namespace != "production" {
		t.Errorf("expected namespace 'production', got %s", loaded.Namespace)
	}
	if !loaded.Docker {
		t.Error("expected Docker to be true")
	}
}
