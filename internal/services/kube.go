package services

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"telepresence-gui/internal/cli"
	"telepresence-gui/internal/models"
	"time"
)

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
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	info := models.KubeInfo{
		Contexts:  []string{},
		Namespace: "default",
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

	outAll, err := s.runner.Run(ctx, "kubectl", "config", "get-contexts", "-o", "name", "--kubeconfig="+info.KubeconfigPath)
	if err == nil {
		for _, line := range strings.Split(outAll, "\n") {
			if trimmed := strings.TrimSpace(line); trimmed != "" {
				info.Contexts = append(info.Contexts, trimmed)
			}
		}
	}

	outCtx, err := s.runner.Run(ctx, "kubectl", "config", "current-context", "--kubeconfig="+info.KubeconfigPath)
	if err == nil {
		info.CurrentContext = strings.TrimSpace(outCtx)
	}

	outNs, err := s.runner.Run(ctx, "kubectl", "config", "view", "--minify", "--output", "jsonpath={..namespace}", "--kubeconfig="+info.KubeconfigPath)
	if err == nil {
		if ns := strings.TrimSpace(outNs); ns != "" {
			info.Namespace = ns
		}
	}

	return info, nil
}
