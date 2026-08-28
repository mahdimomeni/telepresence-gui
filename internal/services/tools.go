package services

import (
	"context"
	"os/exec"
	"strings"
	"telepresence-gui/internal/cli"
	"telepresence-gui/internal/models"
	"time"
)

type ToolCheckerService struct {
	runner  cli.Runner
	timeout time.Duration
}

func NewToolCheckerService(runner cli.Runner) *ToolCheckerService {
	return &ToolCheckerService{
		runner:  runner,
		timeout: 5 * time.Second,
	}
}

func (s *ToolCheckerService) CheckTools(ctx context.Context) (models.SystemToolsReport, error) {
	report := models.SystemToolsReport{
		AllInstalled: true,
		MissingCount: 0,
		Tools:        make([]models.ToolCheckResult, 0, 2),
	}

	// 1. Check Telepresence
	teleResult := s.checkTelepresence(ctx)
	report.Tools = append(report.Tools, teleResult)
	if teleResult.Required && !teleResult.Installed {
		report.AllInstalled = false
		report.MissingCount++
	}

	// 2. Check Kubectl
	kubeResult := s.checkKubectl(ctx)
	report.Tools = append(report.Tools, kubeResult)
	if kubeResult.Required && !kubeResult.Installed {
		report.AllInstalled = false
		report.MissingCount++
	}

	return report, nil
}

func (s *ToolCheckerService) checkTelepresence(ctx context.Context) models.ToolCheckResult {
	result := models.ToolCheckResult{
		Name:        "telepresence",
		DisplayName: "Telepresence CLI",
		Description: "Connects your local workstation directly to the remote Kubernetes cluster and intercepts traffic.",
		Required:    true,
		DocsURL:     "https://www.getambassador.io/docs/telepresence/latest/install",
	}

	path, err := exec.LookPath("telepresence")
	if err != nil {
		result.Installed = false
		result.Error = "Telepresence executable was not found in system PATH."
		return result
	}

	result.Path = path
	result.Installed = true

	// Retrieve version
	ctxTimeout, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	out, err := s.runner.Run(ctxTimeout, "telepresence", "version")
	if err == nil && out != "" {
		lines := strings.Split(out, "\n")
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(strings.ToLower(trimmed), "client") || strings.HasPrefix(strings.ToLower(trimmed), "oss client") {
				result.Version = trimmed
				break
			}
		}
		if result.Version == "" && len(lines) > 0 {
			result.Version = strings.TrimSpace(lines[0])
		}
	} else if err != nil {
		// Found in path but failed to execute
		result.Version = "Installed (Unknown version)"
	}

	return result
}

func (s *ToolCheckerService) checkKubectl(ctx context.Context) models.ToolCheckResult {
	result := models.ToolCheckResult{
		Name:        "kubectl",
		DisplayName: "Kubernetes CLI (kubectl)",
		Description: "The official command-line tool for controlling Kubernetes clusters and managing resources.",
		Required:    true,
		DocsURL:     "https://kubernetes.io/docs/tasks/tools/",
	}

	path, err := exec.LookPath("kubectl")
	if err != nil {
		result.Installed = false
		result.Error = "Kubectl executable was not found in system PATH."
		return result
	}

	result.Path = path
	result.Installed = true

	// Retrieve version
	ctxTimeout, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	out, err := s.runner.Run(ctxTimeout, "kubectl", "version", "--client")
	if err == nil && out != "" {
		lines := strings.Split(out, "\n")
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(strings.ToLower(trimmed), "client version") {
				result.Version = trimmed
				break
			}
		}
		if result.Version == "" && len(lines) > 0 {
			result.Version = strings.TrimSpace(lines[0])
		}
	} else if err != nil {
		result.Version = "Installed (Unknown version)"
	}

	return result
}
