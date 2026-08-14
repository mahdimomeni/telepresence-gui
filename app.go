package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/energye/systray"
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
	CurrentContext string         `json:"currentContext"`
	Contexts       []string       `json:"contexts"`
	Namespace      string         `json:"namespace"`
	KubeconfigPath string         `json:"kubeconfigPath"`
	SavedConfig    *ConnectConfig `json:"savedConfig"`
}

type Workload struct {
	Name                   string          `json:"name"`
	Namespace              string          `json:"namespace"`
	WorkloadResourceType   string          `json:"workload_resource_type"`
	UID                    string          `json:"uid"`
	DesiredReplicas        int             `json:"desired_replicas"`
	ReadyReplicas          int             `json:"ready_replicas"`
	AgentVersion           string          `json:"agent_version,omitempty"`
	NotInterceptableReason string          `json:"not_interceptable_reason,omitempty"`
	InterceptInfo          []InterceptInfo `json:"intercept_info,omitempty"`
}

type InterceptInfo struct {
	Spec              InterceptSpec     `json:"spec"`
	ID                string            `json:"id"`
	ClientSession     ClientSession     `json:"client_session"`
	Disposition       int               `json:"disposition"`
	PodName           string            `json:"pod_name"`
	APIPort           int               `json:"api_port"`
	PodIP             string            `json:"pod_ip"`
	SFTPPort          int               `json:"sftp_port"`
	FTPPort           int               `json:"ftp_port"`
	MountPoint        string            `json:"mount_point"`
	MechanismArgsDesc string            `json:"mechanism_args_desc"`
	Environment       map[string]string `json:"environment"`
	Mounts            map[string]int    `json:"mounts"`
	ModifiedAt        Timestamp         `json:"modified_at"`
}

type InterceptSpec struct {
	Name             string            `json:"name"`
	Client           string            `json:"client"`
	Agent            string            `json:"agent"`
	WorkloadKind     string            `json:"workload_kind"`
	Namespace        string            `json:"namespace"`
	Mechanism        string            `json:"mechanism"`
	TargetHost       string            `json:"target_host"`
	PortIdentifier   string            `json:"port_identifier"`
	ServicePortName  string            `json:"service_port_name"`
	ServicePort      int               `json:"service_port"`
	ServiceUID       string            `json:"service_uid"`
	Protocol         string            `json:"protocol"`
	ContainerName    string            `json:"container_name"`
	ContainerPort    int               `json:"container_port"`
	TargetPort       int               `json:"target_port"`
	RoundtripLatency int64             `json:"roundtrip_latency"`
	DialTimeout      int64             `json:"dial_timeout"`
	Replace          bool              `json:"replace"`
	Wiretap          bool              `json:"wiretap"`
	NoDefaultPort    bool              `json:"no_default_port"`
	HeaderFilters    map[string]string `json:"header_filters"`
	Plaintext        bool              `json:"plaintext"`
	NodeAgent        bool              `json:"node_agent"`
}

type ClientSession struct {
	SessionID        string `json:"session_id"`
	ManagerInstallID string `json:"manager_install_id"`
	InstallID        string `json:"install_id"`
}

type Timestamp struct {
	Seconds int64 `json:"seconds"`
	Nanos   int32 `json:"nanos"`
}

type InterceptConfig struct {
	Workload   string `json:"workload"`
	Port       string `json:"port"`
	EnvFile    string `json:"env_file"`
	EnvJSON    string `json:"env_json"`
	EnvSyntax  string `json:"env_syntax"`
	HTTPHeader string `json:"http_header"`
	Mount      string `json:"mount"`
	Container  string `json:"container"`
	Service    string `json:"service"`
	DockerRun  bool   `json:"docker_run"`
	DockerArgs string `json:"docker_args"`
}

type DetachConfig struct {
	AttachmentName string `json:"attachment_name"`
	Namespace      string `json:"namespace"`
}

type TelepresenceStatusOutput struct {
	UserDaemon struct {
		Running           bool   `json:"running"`
		Status            string `json:"status"`
		KubernetesContext string `json:"kubernetes_context"`
		Namespace         string `json:"namespace"`
		ManagerNamespace  string `json:"manager_namespace"`
	} `json:"user_daemon"`
	RootDaemon struct {
		Running bool   `json:"running"`
		Name    string `json:"name"`
		Version string `json:"version"`
	} `json:"root_daemon"`
	TrafficManager struct {
		Name    string `json:"name"`
		Version string `json:"version"`
	} `json:"traffic_manager"`
}

// App struct
type App struct {
	ctx           context.Context
	pollMu        sync.Mutex
	lastStatusRaw string
	lastListRaw   string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	go systray.Run(a.onReady, a.onExit)

	err := runtime.InitializeNotifications(a.ctx)
	if err != nil {
		log.Printf("Failed to initialize notifications: %v", err)
		return
	}

	if runtime.IsNotificationAvailable(a.ctx) {
		authorized, err := runtime.CheckNotificationAuthorization(a.ctx)
		if err != nil {
			log.Printf("Failed to authorize notifications: %v", err)
			return
		}

		if !authorized {
			authorized, err = runtime.RequestNotificationAuthorization(a.ctx)
			if err != nil || !authorized {
				log.Printf("Failed to authorize notifications: %v", err)
				return
			}
		}
	}

	go a.startBackgroundWatcher()
}

func (a *App) startBackgroundWatcher() {
	ticker := time.NewTicker(4 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.checkTelepresenceChanges()
		}
	}
}

func (a *App) checkTelepresenceChanges() {
	if !a.pollMu.TryLock() {
		return
	}
	defer a.pollMu.Unlock()

	ctx, cancel := context.WithTimeout(a.ctx, 6*time.Second)
	defer cancel()

	// 1. Telepresence Status Check
	statusOut, err := runCommand(ctx, "telepresence", "status", "--format", "json")
	if err == nil && statusOut != "" {
		if statusOut != a.lastStatusRaw {
			a.lastStatusRaw = statusOut

			var status TelepresenceStatusOutput
			if err := json.Unmarshal([]byte(statusOut), &status); err == nil {
				// Connected if user daemon is running and status is explicitly "Connected"
				connected := status.UserDaemon.Running && strings.EqualFold(status.UserDaemon.Status, "Connected")

				statusMutex.Lock()
				prevConnected := isConnected
				statusMutex.Unlock()

				if connected != prevConnected {
					a.updateConnectionStatus(connected)
				}

				// Emit full parsed status struct to frontend
				runtime.EventsEmit(a.ctx, "telepresence-status-changed", status)
			}
		}
	}

	// 2. Telepresence List Check (Only check list when connected)
	statusMutex.Lock()
	connected := isConnected
	statusMutex.Unlock()

	if connected {
		listOut, err := runCommand(ctx, "telepresence", "list", "--format", "json")
		if err == nil && listOut != "" && listOut != a.lastListRaw {
			a.lastListRaw = listOut

			var workloads []Workload
			if err := json.Unmarshal([]byte(listOut), &workloads); err == nil {
				runtime.EventsEmit(a.ctx, "workloads-changed", workloads)
			}
		}
	} else {
		a.lastListRaw = ""
	}
}

func (a *App) Notify(title string, body string) error {
	if !runtime.IsNotificationAvailable(a.ctx) {
		return nil
	}

	return runtime.SendNotification(a.ctx, runtime.NotificationOptions{
		ID:    "telepresence-gui-alert",
		Title: title,
		Body:  body,
	})
}

var (
	mConnectToggle *systray.MenuItem
	isConnected    bool
	statusMutex    sync.Mutex
)

func (a *App) onReady() {
	systray.SetIcon(appIconIco)
	systray.SetTemplateIcon(appIconIco, appIconPng)
	systray.SetTitle("Telepresence")
	systray.SetTooltip("Telepresence GUI Client")

	systray.SetOnClick(func(menu systray.IMenu) {
		runtime.WindowUnminimise(a.ctx)
		runtime.WindowShow(a.ctx)
	})

	mConnectToggle = systray.AddMenuItem("Connect", "Connect to Kubernetes cluster")
	mConnectToggle.Click(func() {
		statusMutex.Lock()
		currentlyConnected := isConnected
		statusMutex.Unlock()

		if currentlyConnected {
			runtime.EventsEmit(a.ctx, "connection-pending", true)
			if err := a.StopTelepresence(); err != nil {
				_ = a.Notify("Disconnect Failed", fmt.Sprintf("Error: %v", err))
			} else {
				a.updateConnectionStatus(false)
				runtime.EventsEmit(a.ctx, "connection-pending", false)
			}
		} else {
			config, err := a.LoadConnectConfig()
			if err != nil || config == nil {
				config = &ConnectConfig{Namespace: "default"}
			}

			runtime.EventsEmit(a.ctx, "daemon-log", "[Tray] Connecting to cluster...")
			runtime.EventsEmit(a.ctx, "connection-pending", true)
			if err := a.StartTelepresence(*config); err != nil {
				_ = a.Notify("Connection Failed", fmt.Sprintf("Error: %v", err))
			} else {
				a.updateConnectionStatus(true)
				runtime.EventsEmit(a.ctx, "connection-pending", false)
			}
		}
	})

	mQuit := systray.AddMenuItem("Quit", "Disconnect and exit")
	mQuit.Click(func() {
		_ = a.StopTelepresence()
		systray.Quit()
		runtime.Quit(a.ctx)
	})
}

func (a *App) updateConnectionStatus(connected bool) {
	statusMutex.Lock()
	defer statusMutex.Unlock()

	isConnected = connected
	if connected {
		_ = a.Notify("Telepresence Connected", "Connected to cluster successfully.")
		mConnectToggle.SetTitle("Disconnect")
		mConnectToggle.SetTooltip("Disconnect Telepresence daemon")
	} else {
		_ = a.Notify("Telepresence Disconnected", "Daemon stopped successfully.")
		mConnectToggle.SetTitle("Connect")
		mConnectToggle.SetTooltip("Connect to Kubernetes cluster")
	}

	// Sync state with React frontend
	runtime.EventsEmit(a.ctx, "connection-changed", isConnected)
}

func (a *App) onExit() {
	// Cleanup logic if needed
}

func (a *App) shutdown(ctx context.Context) {
	cmd := exec.Command("telepresence", "quit", "-s")
	if err := cmd.Run(); err != nil {
		fmt.Println("Failed to quit Telepresence on shutdown:", err)
	} else {
		fmt.Println("Telepresence daemon stopped successfully.")
	}
}

func (a *App) getConfigFilePath() (string, error) {
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

func (a *App) SaveConnectConfig(config ConnectConfig) error {
	filePath, err := a.getConfigFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

func (a *App) LoadConnectConfig() (*ConnectConfig, error) {
	filePath, err := a.getConfigFilePath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err // Returns nil if file doesn't exist yet
	}
	var config ConnectConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}
	return &config, nil
}

func (a *App) GetKubeInfo(kubeConfigPath string) (KubeInfo, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()

	// Default values
	info := KubeInfo{
		Contexts:  []string{},
		Namespace: "default",
	}

	// 1. Fetch saved config from local disk and attach to info
	if saved, err := a.LoadConnectConfig(); err == nil {
		info.SavedConfig = saved
	}

	// 2. Kubeconfig Path: check ENV or default to ~/.kube/config
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

	// 3. Get ALL available contexts
	cmdAll := exec.CommandContext(ctx, "kubectl", "config", "get-contexts", "-o", "name", "--kubeconfig="+info.KubeconfigPath)
	cmdAll.SysProcAttr = getSysProcAttr()
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

	// 4. Get the current context
	cmdCtx := exec.CommandContext(ctx, "kubectl", "config", "current-context", "--kubeconfig="+info.KubeconfigPath)
	cmdCtx.SysProcAttr = getSysProcAttr()
	outCtx, err := cmdCtx.Output()
	if err == nil {
		info.CurrentContext = strings.TrimSpace(string(outCtx))
	}

	// 5. Get the namespace for the current context (if set)
	cmdNs := exec.CommandContext(ctx, "kubectl", "config", "view", "--minify", "--output", "jsonpath={..namespace}", "--kubeconfig="+info.KubeconfigPath)
	cmdNs.SysProcAttr = getSysProcAttr()
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

	output, err := runCommand(ctx, "telepresence", args...)
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Error stopping daemon]: %s", string(output)))
		return err
	}

	if len(output) != 0 {
		var res TelepresenceResponse
		err = json.Unmarshal([]byte(output), &res)
		if err != nil {
			return err
		}
		if res.Error != "" {
			return errors.New(res.Error)
		}
	}

	a.updateConnectionStatus(true)
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
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()

	output, err := runCommand(ctx, "telepresence", "quit")
	if err != nil {
		runtime.EventsEmit(a.ctx, "daemon-log", fmt.Sprintf("[Error stopping daemon]: %s", string(output)))
		return err
	}

	runtime.EventsEmit(a.ctx, "daemon-log", "[Telepresence Disconnected]")
	a.updateConnectionStatus(false)
	return nil
}

func (a *App) ListWorkloads() ([]Workload, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()

	output, err := runCommand(ctx, "telepresence", "list", "--format", "json")
	if err != nil {
		errorMessage := fmt.Sprintf("Failed to list workloads: %s\n%s", err.Error(), string(output))
		fmt.Println(errorMessage)
		return []Workload{}, errors.New(errorMessage)
	}

	var workloads []Workload
	err = json.Unmarshal([]byte(output), &workloads)
	if err != nil {
		errorMessage := fmt.Sprintf("Failed to list workloads: %s\n%s", err.Error(), string(output))
		fmt.Println(errorMessage)
		return []Workload{}, errors.New(errorMessage)
	}

	return workloads, nil
}

func (a *App) InterceptWorkload(config InterceptConfig) error {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
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

	_, err := runCommand(ctx, "telepresence", args...)
	if err != nil {
		return fmt.Errorf("failed to intercept %s: %v", config.Workload, err)
	}
	return nil
}

func (a *App) DetachWorkload(config DetachConfig) error {
	ctx, cancel := context.WithTimeout(a.ctx, 15*time.Second)
	defer cancel()

	args := []string{"detach"}
	if config.Namespace != "" {
		args = append(args, "--namespace", config.Namespace)
	}
	args = append(args, config.AttachmentName)

	_, err := runCommand(ctx, "telepresence", args...)
	if err != nil {
		return fmt.Errorf("failed to detach %s: %v", config.AttachmentName, err)
	}
	return nil
}

func runCommand(ctx context.Context, name string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, name, args...)

	cmd.SysProcAttr = getSysProcAttr()

	output, err := cmd.CombinedOutput()

	strOut := strings.TrimSpace(string(output))
	if err != nil {
		return strOut, fmt.Errorf("%w: %s", err, strOut)
	}
	return strOut, nil
}
