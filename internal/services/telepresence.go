package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"telepresence-gui/internal/cli"
	"telepresence-gui/internal/models"
	"time"
)

type TelepresenceService struct {
	runner  cli.Runner
	timeout time.Duration
}

func NewTelepresenceService(runner cli.Runner) *TelepresenceService {
	return &TelepresenceService{
		runner:  runner,
		timeout: 60 * time.Second,
	}
}

func (s *TelepresenceService) Start(ctx context.Context, config models.ConnectConfig) (string, error) {
	args := []string{"connect"}

	// Core Flags
	if config.Namespace != "" {
		args = append(args, "--namespace", config.Namespace)
	}
	if config.Name != "" {
		args = append(args, "--name", config.Name)
	}
	if config.ManagerNamespace != "" {
		args = append(args, "--manager-namespace", config.ManagerNamespace)
	}
	if config.Docker {
		args = append(args, "--docker")
	}

	// Network Flags
	if config.MappedNamespaces != "" {
		args = append(args, "--mapped-namespaces", config.MappedNamespaces)
	}
	if config.ProxyVia != "" {
		args = append(args, "--proxy-via", config.ProxyVia)
	}
	if config.AlsoProxy != "" {
		args = append(args, "--also-proxy", config.AlsoProxy)
	}
	if config.NeverProxy != "" {
		args = append(args, "--never-proxy", config.NeverProxy)
	}
	if config.RerouteLocal != "" {
		args = append(args, "--reroute-local", config.RerouteLocal)
	}
	if config.RerouteRemote != "" {
		args = append(args, "--reroute-remote", config.RerouteRemote)
	}
	if config.VirtualNAT != "" {
		args = append(args, "--vnat", config.VirtualNAT)
	}
	if config.AllowConflictingSubnets != "" {
		args = append(args, "--allow-conflicting-subnets", config.AllowConflictingSubnets)
	}
	if config.ExposePorts != "" {
		args = append(args, "--expose", config.ExposePorts)
	}
	if config.Hostname != "" {
		args = append(args, "--hostname", config.Hostname)
	}

	// Cluster & Auth Flags
	if config.Kubeconfig != "" {
		args = append(args, "--kubeconfig", config.Kubeconfig)
	}
	if config.Context != "" {
		args = append(args, "--context", config.Context)
	}
	if config.Cluster != "" {
		args = append(args, "--cluster", config.Cluster)
	}
	if config.APIServer != "" {
		args = append(args, "--server", config.APIServer)
	}
	if config.BearerToken != "" {
		args = append(args, "--token", config.BearerToken)
	}
	if config.User != "" {
		args = append(args, "--user", config.User)
	}
	if config.ImpersonateUser != "" {
		args = append(args, "--as", config.ImpersonateUser)
	}
	if config.ImpersonateGroup != "" {
		args = append(args, "--as-group", config.ImpersonateGroup)
	}
	if config.ImpersonateUID != "" {
		args = append(args, "--as-uid", config.ImpersonateUID)
	}
	if config.ClientCertificate != "" {
		args = append(args, "--client-certificate", config.ClientCertificate)
	}
	if config.ClientKey != "" {
		args = append(args, "--client-key", config.ClientKey)
	}
	if config.SkipTLSVerify {
		args = append(args, "--insecure-skip-tls-verify")
	}
	if config.TLSServerName != "" {
		args = append(args, "--tls-server-name", config.TLSServerName)
	}

	// Advanced Flags
	if config.TelepresenceConfigPath != "" {
		args = append(args, "--config", config.TelepresenceConfigPath)
	}
	if config.RequestTimeout != "" {
		args = append(args, "--request-timeout", config.RequestTimeout)
	}
	if config.DisableResponseCompression {
		args = append(args, "--disable-compression")
	}

	args = append(args, "--format", "json", "--progress", "quiet")

	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	output, err := s.runner.Run(ctx, "telepresence", args...)
	if err != nil {
		return output, err
	}

	if len(output) != 0 {
		var res models.TelepresenceResponse
		if err := json.Unmarshal([]byte(output), &res); err != nil {
			return output, err
		}
		if res.Error != "" {
			return output, errors.New(res.Error)
		}
	}

	return output, nil
}

func (s *TelepresenceService) Stop(ctx context.Context) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()
	return s.runner.Run(ctx, "telepresence", "quit")
}

func (s *TelepresenceService) QuitSync(ctx context.Context) (string, error) {
	return s.runner.Run(ctx, "telepresence", "quit", "-s")
}

func (s *TelepresenceService) ListWorkloads(ctx context.Context) ([]models.Workload, error) {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	output, err := s.runner.Run(ctx, "telepresence", "list", "--format", "json")
	if err != nil {
		return nil, fmt.Errorf("failed to list workloads: %w (output: %s)", err, output)
	}

	var workloads []models.Workload
	if err := json.Unmarshal([]byte(output), &workloads); err != nil {
		return nil, fmt.Errorf("failed to decode workloads: %w (output: %s)", err, output)
	}

	return workloads, nil
}

func (s *TelepresenceService) Intercept(ctx context.Context, config models.InterceptConfig) error {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	args := []string{"intercept", config.Workload, "--port", config.Port}

	// Environment options
	if config.EnvFile != "" {
		args = append(args, "--env-file", config.EnvFile)
	}
	if config.EnvJSON != "" {
		args = append(args, "--env-json", config.EnvJSON)
	}
	if config.EnvSyntax != "" {
		args = append(args, "--env-syntax", config.EnvSyntax)
	}

	// Advanced routing options
	if config.HTTPHeader != "" {
		args = append(args, "--http-header", config.HTTPHeader)
	}
	if config.Mount != "" {
		args = append(args, "--mount", config.Mount)
	}
	if config.Container != "" {
		args = append(args, "--container", config.Container)
	}
	if config.Service != "" {
		args = append(args, "--service", config.Service)
	}

	// Docker integration
	if config.DockerRun {
		args = append(args, "--docker-run", "--")
		if config.DockerArgs != "" {
			args = append(args, strings.Fields(config.DockerArgs)...)
		}
	}

	_, err := s.runner.Run(ctx, "telepresence", args...)
	return err
}

func (s *TelepresenceService) Detach(ctx context.Context, config models.DetachConfig) error {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	args := []string{"detach"}
	if config.Namespace != "" {
		args = append(args, "--namespace", config.Namespace)
	}
	args = append(args, config.AttachmentName)

	_, err := s.runner.Run(ctx, "telepresence", args...)
	return err
}

func (s *TelepresenceService) Status(ctx context.Context) (string, *models.TelepresenceStatusOutput, error) {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	output, err := s.runner.Run(ctx, "telepresence", "status", "--format", "json")
	if err != nil || output == "" {
		return output, nil, err
	}

	var status models.TelepresenceStatusOutput
	if err := json.Unmarshal([]byte(output), &status); err != nil {
		return output, nil, err
	}

	return output, &status, nil
}
