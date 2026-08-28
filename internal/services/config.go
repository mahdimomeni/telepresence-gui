package services

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"telepresence-gui/internal/models"
)

type ConfigService struct {
	mu        sync.RWMutex
	customDir string
}

func NewConfigService() *ConfigService {
	return &ConfigService{}
}

// NewConfigServiceWithDir creates a ConfigService rooted at a specific directory (useful for tests).
func NewConfigServiceWithDir(dir string) *ConfigService {
	return &ConfigService{customDir: dir}
}

func (s *ConfigService) getAppDir() (string, error) {
	if s.customDir != "" {
		if err := os.MkdirAll(s.customDir, 0755); err != nil {
			return "", err
		}
		return s.customDir, nil
	}

	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(configDir, "telepresence-gui")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return "", err
	}
	return appDir, nil
}

func (s *ConfigService) getConfigFilePath() (string, error) {
	appDir, err := s.getAppDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "config.json"), nil
}

func (s *ConfigService) getSettingsFilePath() (string, error) {
	appDir, err := s.getAppDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "settings.json"), nil
}

func (s *ConfigService) SaveConnectConfig(config models.ConnectConfig) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filePath, err := s.getConfigFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

func (s *ConfigService) LoadConnectConfig() (*models.ConnectConfig, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	filePath, err := s.getConfigFilePath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	var config models.ConnectConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}
	return &config, nil
}

func (s *ConfigService) SaveAppSettings(settings models.AppSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filePath, err := s.getSettingsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

func (s *ConfigService) LoadAppSettings() (*models.AppSettings, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	defaults := models.DefaultAppSettings()

	filePath, err := s.getSettingsFilePath()
	if err != nil {
		return &defaults, nil
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		// File does not exist yet; return defaults
		return &defaults, nil
	}

	var settings models.AppSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return &defaults, nil
	}

	// Sanity checks on vital fields
	if settings.Theme == "" {
		settings.Theme = defaults.Theme
	}
	if settings.MaxLogLines <= 0 {
		settings.MaxLogLines = defaults.MaxLogLines
	}
	if settings.RequestTimeoutSeconds <= 0 {
		settings.RequestTimeoutSeconds = defaults.RequestTimeoutSeconds
	}
	if settings.PollIntervalSeconds <= 0 {
		settings.PollIntervalSeconds = defaults.PollIntervalSeconds
	}
	if settings.DefaultLogLevel == "" {
		settings.DefaultLogLevel = defaults.DefaultLogLevel
	}

	return &settings, nil
}

func (s *ConfigService) ResetAppSettings() (*models.AppSettings, error) {
	defaults := models.DefaultAppSettings()
	if err := s.SaveAppSettings(defaults); err != nil {
		return nil, err
	}
	return &defaults, nil
}

