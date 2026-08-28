package services

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"telepresence-gui/internal/cli"
	"telepresence-gui/internal/models"
	"time"

	"gopkg.in/yaml.v3"
)

type kubeConfigFile struct {
	CurrentContext string `yaml:"current-context"`
	Contexts       []struct {
		Name    string `yaml:"name"`
		Context struct {
			Namespace string `yaml:"namespace"`
			Cluster   string `yaml:"cluster"`
			User      string `yaml:"user"`
		} `yaml:"context"`
	} `yaml:"contexts"`
}

type KubeService struct {
	runner        cli.Runner
	configService *ConfigService
	timeout       time.Duration
}

func NewKubeService(runner cli.Runner, configService *ConfigService) *KubeService {
	return &KubeService{
		runner:        runner,
		configService: configService,
		timeout:       60 * time.Second,
	}
}

func (s *KubeService) GetKubeInfo(ctx context.Context, kubeConfigPath string) (models.KubeInfo, error) {
	info := models.KubeInfo{
		Contexts:  []string{},
		Namespace: "",
	}

	if saved, err := s.configService.LoadConnectConfig(); err == nil {
		info.SavedConfig = saved
	}

	if kubeConfigPath != "" {
		info.KubeconfigPath = kubeConfigPath
	} else {
		envPath := os.Getenv("KUBECONFIG")
		if envPath != "" {
			info.KubeconfigPath = envPath
		} else if home, err := os.UserHomeDir(); err == nil {
			info.KubeconfigPath = filepath.Join(home, ".kube", "config")
		}
	}

	// 1. High-speed in-memory YAML parse
	if data, err := os.ReadFile(info.KubeconfigPath); err == nil {
		var parsed kubeConfigFile
		if err := yaml.Unmarshal(data, &parsed); err == nil && len(parsed.Contexts) > 0 {
			info.CurrentContext = parsed.CurrentContext
			for _, ctxItem := range parsed.Contexts {
				info.Contexts = append(info.Contexts, ctxItem.Name)
				if ctxItem.Name == parsed.CurrentContext {
					info.Namespace = ctxItem.Context.Namespace
				}
			}
			return info, nil
		}
	}

	// 2. Fallback to CLI if file reading/parsing didn't succeed
	ctxTimeout, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	outAll, err := s.runner.Run(ctxTimeout, "kubectl", "config", "get-contexts", "-o", "name", "--kubeconfig="+info.KubeconfigPath)
	if err == nil {
		for _, line := range strings.Split(outAll, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				info.Contexts = append(info.Contexts, trimmed)
			}
		}
	}

	outCtx, err := s.runner.Run(ctxTimeout, "kubectl", "config", "current-context", "--kubeconfig="+info.KubeconfigPath)
	if err == nil {
		info.CurrentContext = strings.TrimSpace(outCtx)
	}

	outNs, err := s.runner.Run(ctxTimeout, "kubectl", "config", "view", "--minify", "--output", "jsonpath={..namespace}", "--kubeconfig="+info.KubeconfigPath)
	if err == nil {
		if ns := strings.TrimSpace(outNs); ns != "" {
			info.Namespace = ns
		}
	}

	return info, nil
}
