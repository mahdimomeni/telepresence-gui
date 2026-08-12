package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ConnectConfig struct {
	Namespace                  string `json:"namespace"`
	Name                       string `json:"name"`
	ManagerNamespace           string `json:"manager-namespace"`
	Docker                     bool   `json:"docker"`
	MappedNamespaces           string `json:"mapped-namespaces"`
	ProxyVia                   string `json:"proxy-via"`
	AlsoProxy                  string `json:"also-proxy"`
	NeverProxy                 string `json:"never-proxy"`
	RerouteLocal               string `json:"reroute-local"`
	RerouteRemote              string `json:"reroute-remote"`
	VirtualNAT                 string `json:"vnat"`
	AllowConflictingSubnets    string `json:"allow-conflicting-subnets"`
	ExposePorts                string `json:"expose"`
	Hostname                   string `json:"hostname"`
	Kubeconfig                 string `json:"kubeconfig"`
	Context                    string `json:"context"`
	Cluster                    string `json:"cluster"`
	APIServer                  string `json:"server"`
	BearerToken                string `json:"token"`
	User                       string `json:"user"`
	ImpersonateUser            string `json:"as"`
	ImpersonateGroup           string `json:"as-group"`
	ImpersonateUID             string `json:"as-uid"`
	ClientCertificate          string `json:"client-certificate"`
	ClientKey                  string `json:"client-key"`
	SkipTLSVerify              bool   `json:"insecure-skip-tls-verify"`
	TLSServerName              string `json:"tls-server-name"`
	TelepresenceConfigPath     string `json:"config"`
	RequestTimeout             string `json:"request-timeout"`
	DisableResponseCompression bool   `json:"disable-compression"`
}

type TelepresenceResponse struct {
	Error string
}

type KubeInfo struct {
	CurrentContext string   `json:"currentContext"`
	Contexts       []string `json:"contexts"`
	Namespace      string   `json:"namespace"`
	KubeconfigPath string   `json:"kubeconfigPath"`
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(ctx context.Context) {
	cmd := exec.Command("telepresence", "quit", "-s")
	if err := cmd.Run(); err != nil {
		fmt.Println("Failed to quit Telepresence on shutdown:", err)
	} else {
		fmt.Println("Telepresence daemon stopped successfully.")
	}
}

func (a *App) GetKubeInfo() (KubeInfo, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()

	// Default values
	info := KubeInfo{
		Contexts:  []string{},
		Namespace: "default",
	}

	// 1. Get Kubeconfig Path from ENV or default to ~/.kube/config
	envPath := os.Getenv("KUBECONFIG")
	if envPath != "" {
		info.KubeconfigPath = envPath
	} else {
		if home, err := os.UserHomeDir(); err == nil {
			info.KubeconfigPath = filepath.Join(home, ".kube", "config")
		}
	}

	// 2. Get ALL available contexts
	cmdAll := exec.CommandContext(ctx, "kubectl", "config", "get-contexts", "-o", "name")
	outAll, err := cmdAll.Output()
	if err == nil {
		lines := strings.Split(string(outAll), "\n")
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if trimmed != "" {
				info.Contexts = append(info.Contexts, trimmed)
			}
		}
	}

	// 3. Get the current context
	cmdCtx := exec.CommandContext(ctx, "kubectl", "config", "current-context")
	outCtx, err := cmdCtx.Output()
	if err == nil {
		info.CurrentContext = strings.TrimSpace(string(outCtx))
	}

	// 4. Get the namespace for the current context (if set)
	cmdNs := exec.CommandContext(ctx, "kubectl", "config", "view", "--minify", "--output", "jsonpath={..namespace}")
	outNs, err := cmdNs.Output()
	if err == nil {
		ns := strings.TrimSpace(string(outNs))
		if ns != "" {
			info.Namespace = ns
		}
	}

	return info, nil
}

func (a *App) StartTelepresence(config ConnectConfig) error {
	fmt.Println("telepresence connect triggered")

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

	args = append(args, "--format", "json")
	args = append(args, "--progress", "quiet")

	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "telepresence", args...)

	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf
	cmd.Stdin = nil

	err := cmd.Run()
	rawStdout := bytes.TrimSpace(stdoutBuf.Bytes())

	if err != nil && len(rawStdout) == 0 {
		return err
	}

	if len(rawStdout) == 0 {
		return nil
	}

	var res TelepresenceResponse
	err = json.Unmarshal(rawStdout, &res)
	if err != nil {
		return err
	}

	if res.Error != "" {
		return errors.New(res.Error)
	}

	return nil
}

func (a *App) SelectFile(title string) (string, error) {
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	if err != nil {
		return "", err
	}
	return selection, nil
}

func (a *App) StopTelepresence() error {
	cmd := exec.Command("telepresence", "quit")
	output, err := cmd.CombinedOutput()
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Error stopping daemon]: %s", string(output)))
		return err
	}
	runtime.EventsEmit(a.ctx, "daemon-log", "[Telepresence Disconnected]")
	return nil
}

func (a *App) ListWorkloads() (string, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "telepresence", "list", "--format", "json")

	output, err := cmd.CombinedOutput()
	if err != nil {
		errorMessage := fmt.Sprintf("Failed to list workloads: %s\n%s", err.Error(), string(output))
		fmt.Println(errorMessage)
		return "", errors.New(errorMessage)
	}

	return string(output), nil
}
