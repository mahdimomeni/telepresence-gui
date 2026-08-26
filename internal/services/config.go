package services

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"telepresence-gui/internal/models"
)

type ConfigService struct {
	mu sync.RWMutex
}

func NewConfigService() *ConfigService {
	return &ConfigService{}
}

func (s *ConfigService) getConfigFilePath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(configDir, "telepresence-gui")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(appDir, "config.json"), nil
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
