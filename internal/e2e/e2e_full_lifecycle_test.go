package e2e

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"telepresence-gui/internal/app"
	"telepresence-gui/internal/models"
	"telepresence-gui/internal/services"

	"github.com/wailsapp/wails/v2/pkg/options"
)

const themeDark = "dark"

type e2eMockRunner struct {
	mu       sync.Mutex
	commands []string
	handlers map[string]func(ctx context.Context, args []string) (string, error)
}

func newE2EMockRunner() *e2eMockRunner {
	return &e2eMockRunner{
		handlers: make(map[string]func(ctx context.Context, args []string) (string, error)),
	}
}

func (r *e2eMockRunner) Register(name string, fn func(ctx context.Context, args []string) (string, error)) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.handlers[name] = fn
}

func (r *e2eMockRunner) Run(ctx context.Context, name string, args ...string) (string, error) {
	r.mu.Lock()
	cmdLine := name + " " + strings.Join(args, " ")
	r.commands = append(r.commands, cmdLine)
	fn, exists := r.handlers[name]
	r.mu.Unlock()

	if exists && fn != nil {
		return fn(ctx, args)
	}
	return "", fmt.Errorf("unhandled command: %s", cmdLine)
}

func (r *e2eMockRunner) GetCommands() []string {
	r.mu.Lock()
	defer r.mu.Unlock()
	copied := make([]string, len(r.commands))
	copy(copied, r.commands)
	return copied
}

type e2eEventEmitter struct {
	mu     sync.Mutex
	events map[string][]interface{}
}

func newE2EEventEmitter() *e2eEventEmitter {
	return &e2eEventEmitter{
		events: make(map[string][]interface{}),
	}
}

func (e *e2eEventEmitter) Emit(eventName string, data ...interface{}) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.events[eventName] = append(e.events[eventName], data)
}

func (e *e2eEventEmitter) HasEvent(name string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	_, ok := e.events[name]
	return ok
}

func (e *e2eEventEmitter) EventCount(name string) int {
	e.mu.Lock()
	defer e.mu.Unlock()
	return len(e.events[name])
}

type e2eNotifier struct {
	mu            sync.Mutex
	notifications []struct{ Title, Body string }
}

func (n *e2eNotifier) SendNotification(title, body string) error {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.notifications = append(n.notifications, struct{ Title, Body string }{title, body})
	return nil
}

func (n *e2eNotifier) Count() int {
	n.mu.Lock()
	defer n.mu.Unlock()
	return len(n.notifications)
}

func TestE2E_CompleteApplicationLifecycle(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "tp-e2e-lifecycle-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	runner := newE2EMockRunner()

	// 1. Mock telepresence CLI outputs
	var interceptedWorkloads = make(map[string]bool)
	var replacedWorkloads = make(map[string]bool)
	var isConnected = false
	var mu sync.Mutex

	runner.Register("telepresence", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		mu.Lock()
		defer mu.Unlock()

		switch {
		case strings.Contains(argStr, "version"):
			return "Client  : v2.21.3 (api v3)\nRoot Daemon: not running\nUser Daemon: not running", nil

		case strings.Contains(argStr, "connect"):
			isConnected = true
			return `{"status": "connected", "message": "Connected to context 'prod-cluster'"}`, nil

		case strings.Contains(argStr, "status --format json"):
			if isConnected {
				return `{"root_daemon": {"running": true}, "user_daemon": {"running": true, "status": "Connected"}}`, nil
			}
			return `{"root_daemon": {"running": false}, "user_daemon": {"running": false, "status": "Not Connected"}}`, nil

		case strings.Contains(argStr, "list --format json"):
			var paymentIntercepts string
			if interceptedWorkloads["payment-service"] {
				paymentIntercepts = `[{"id": "int-101", "spec": {"name": "payment-service", "target_host": "127.0.0.1", "target_port": 8080, "mechanism": "http"}}]`
			} else {
				paymentIntercepts = `[]`
			}

			return fmt.Sprintf(`[
				{
					"name": "payment-service",
					"namespace": "ecommerce",
					"workload_resource_type": "Deployment",
					"desired_replicas": 3,
					"ready_replicas": 3,
					"intercept_info": %s
				},
				{
					"name": "auth-service",
					"namespace": "ecommerce",
					"workload_resource_type": "Deployment",
					"desired_replicas": 2,
					"ready_replicas": 2,
					"intercept_info": []
				},
				{
					"name": "cache-service",
					"namespace": "ecommerce",
					"workload_resource_type": "StatefulSet",
					"desired_replicas": 1,
					"ready_replicas": 1,
					"intercept_info": []
				}
			]`, paymentIntercepts), nil

		case strings.Contains(argStr, "intercept payment-service"):
			interceptedWorkloads["payment-service"] = true
			return `{"status": "success", "message": "Intercepted payment-service"}`, nil

		case strings.Contains(argStr, "replace auth-service"):
			replacedWorkloads["auth-service"] = true
			return `{"status": "success", "message": "Replaced auth-service"}`, nil

		case strings.Contains(argStr, "detach payment-service") || strings.Contains(argStr, "leave payment-service") || strings.Contains(argStr, "detach") || strings.Contains(argStr, "leave"):
			delete(interceptedWorkloads, "payment-service")
			return `{"status": "success", "message": "Detached intercept"}`, nil

		case strings.Contains(argStr, "quit -s"):
			isConnected = false
			return `{"status": "success", "message": "Telepresence daemon stopped"}`, nil

		default:
			return `{"status": "ok"}`, nil
		}
	})

	// 2. Mock kubectl CLI outputs
	runner.Register("kubectl", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		switch {
		case strings.Contains(argStr, "version"):
			return `{"clientVersion":{"gitVersion":"v1.31.0"}}`, nil
		case strings.Contains(argStr, "config view"):
			return `{
				"current-context": "prod-cluster",
				"contexts": [
					{"name": "prod-cluster", "context": {"cluster": "k8s-prod", "namespace": "ecommerce", "user": "prod-admin"}},
					{"name": "staging-cluster", "context": {"cluster": "k8s-staging", "namespace": "staging", "user": "stage-admin"}}
				],
				"clusters": [
					{"name": "k8s-prod", "cluster": {"server": "https://k8s-prod.company.internal"}},
					{"name": "k8s-staging", "cluster": {"server": "https://k8s-stage.company.internal"}}
				]
			}`, nil
		default:
			return "", nil
		}
	})

	// Setup App Services
	configService := services.NewConfigServiceWithDir(tempDir)
	kubeService := services.NewKubeService(runner, configService)
	teleService := services.NewTelepresenceService(runner)
	updateService := services.NewUpdateService("mahdimomeni", "telepresence-gui", "1.0.0")
	toolService := services.NewToolCheckerService(runner)
	toolService.SetLookPathFunc(func(file string) (string, error) {
		return "/mock/bin/" + file, nil
	})

	appInstance := app.NewApp(
		teleService,
		kubeService,
		configService,
		updateService,
		toolService,
		nil,
	)

	emitter := newE2EEventEmitter()
	notifier := &e2eNotifier{}
	appInstance.SetEventEmitter(emitter)
	appInstance.SetNotifier(notifier)

	ctx := context.Background()
	appInstance.SetContext(ctx)

	// STEP 1: Settings Initialization and Engine Configuration

	initialSettings, err := appInstance.GetAppSettings()
	if err != nil {
		t.Fatalf("GetAppSettings failed: %v", err)
	}
	if initialSettings.Theme != themeDark {
		t.Errorf("expected default theme dark, got %s", initialSettings.Theme)
	}

	// Mutate and save custom preferences
	initialSettings.Theme = "light"
	initialSettings.EnableGlowEffects = true
	initialSettings.RequestTimeoutSeconds = 45
	initialSettings.PollIntervalSeconds = 5
	initialSettings.EnableNotifications = true
	initialSettings.NotifyOnConnect = true
	initialSettings.NotifyOnIntercept = true

	if err := appInstance.SaveAppSettings(initialSettings); err != nil {
		t.Fatalf("SaveAppSettings failed: %v", err)
	}

	reloadedSettings, err := appInstance.GetAppSettings()
	if err != nil || reloadedSettings.Theme != "light" || reloadedSettings.RequestTimeoutSeconds != 45 {
		t.Fatalf("reloaded settings do not match saved state: %+v", reloadedSettings)
	}

	// STEP 2: System Tools Check Flow
	report, err := appInstance.CheckSystemTools()
	if err != nil {
		t.Fatalf("CheckSystemTools failed: %v", err)
	}
	if !report.AllInstalled || report.MissingCount != 0 {
		t.Errorf("expected all tools installed, got %+v", report)
	}
	if len(report.Tools) < 2 {
		t.Errorf("expected telepresence and kubectl in report, got %d tools", len(report.Tools))
	}

	// STEP 3: Kubeconfig Inspection & Connection Setup
	mockKubeconfig := filepath.Join(tempDir, "kubeconfig.yaml")
	kubeconfigData := `
apiVersion: v1
kind: Config
current-context: prod-cluster
contexts:
- name: prod-cluster
  context:
    cluster: k8s-prod
    namespace: ecommerce
    user: prod-admin
- name: staging-cluster
  context:
    cluster: k8s-staging
    namespace: staging
    user: stage-admin
`
	if err := os.WriteFile(mockKubeconfig, []byte(kubeconfigData), 0o600); err != nil {
		t.Fatalf("failed to write mock kubeconfig: %v", err)
	}

	kubeInfo, err := appInstance.GetKubeInfo(mockKubeconfig)
	if err != nil {
		t.Fatalf("GetKubeInfo failed: %v", err)
	}
	if kubeInfo.CurrentContext != "prod-cluster" || len(kubeInfo.Contexts) != 2 {
		t.Errorf("unexpected kubeInfo: %+v", kubeInfo)
	}

	connectConfig := models.ConnectConfig{
		Context:    "prod-cluster",
		Namespace:  "ecommerce",
		Cluster:    "k8s-prod",
		APIServer:  "https://k8s-prod.company.internal",
		Kubeconfig: mockKubeconfig,
		Docker:     true,
	}

	if err := appInstance.SaveConnectConfig(connectConfig); err != nil {
		t.Fatalf("SaveConnectConfig failed: %v", err)
	}

	loadedConnCfg, err := appInstance.LoadConnectConfig()
	if err != nil || loadedConnCfg == nil || loadedConnCfg.Context != "prod-cluster" {
		t.Fatalf("LoadConnectConfig failed or returned invalid data: %+v", loadedConnCfg)
	}

	// STEP 4: Start Telepresence Connection
	if err := appInstance.StartTelepresence(connectConfig); err != nil {
		t.Fatalf("StartTelepresence failed: %v", err)
	}

	if !emitter.HasEvent("connection-changed") {
		t.Errorf("expected connection-changed event")
	}

	// STEP 5: List Workloads in Cluster
	workloads, err := appInstance.ListWorkloads()
	if err != nil {
		t.Fatalf("ListWorkloads failed: %v", err)
	}
	if len(workloads) != 3 {
		t.Fatalf("expected 3 workloads, got %d", len(workloads))
	}
	if workloads[0].Name != "payment-service" || workloads[1].Name != "auth-service" {
		t.Errorf("unexpected workload list order/names: %+v", workloads)
	}

	// STEP 6: Intercept Workload
	interceptCfg := models.InterceptConfig{
		Workload:   "payment-service",
		Namespace:  "ecommerce",
		Port:       "8080:80",
		HTTPHeader: "x-user=tester",
	}
	if err := appInstance.InterceptWorkload(interceptCfg); err != nil {
		t.Fatalf("InterceptWorkload failed: %v", err)
	}

	// Verify workload now shows intercepted state
	workloads, err = appInstance.ListWorkloads()
	if err != nil || len(workloads[0].InterceptInfo) == 0 {
		t.Fatalf("expected payment-service to have active intercept: %+v", workloads[0])
	}

	// STEP 7: Replace Workload
	replaceCfg := models.ReplaceConfig{
		Workload:  "auth-service",
		Namespace: "ecommerce",
		Container: "auth-container",
		Port:      "9000:80",
	}
	if err := appInstance.ReplaceWorkload(replaceCfg); err != nil {
		t.Fatalf("ReplaceWorkload failed: %v", err)
	}

	// STEP 8: Detach Workload Intercept
	detachCfg := models.DetachConfig{
		AttachmentName: "payment-service",
		Namespace:      "ecommerce",
	}
	if err := appInstance.DetachWorkload(detachCfg); err != nil {
		t.Fatalf("DetachWorkload failed: %v", err)
	}

	// Verify intercept was removed
	workloads, err = appInstance.ListWorkloads()
	if err != nil || len(workloads[0].InterceptInfo) > 0 {
		t.Fatalf("expected payment-service intercept to be removed: %+v", workloads[0])
	}

	// STEP 9: Secondary Instance Launch
	appInstance.OnSecondInstanceLaunch(options.SecondInstanceData{
		Args:             []string{"--reconnect", "--context=prod-cluster"},
		WorkingDirectory: tempDir,
	})

	time.Sleep(50 * time.Millisecond)
	if !emitter.HasEvent("launchArgs") {
		t.Errorf("expected launchArgs event to be emitted on second instance")
	}

	// STEP 10: Disconnect Telepresence
	if err := appInstance.StopTelepresence(); err != nil {
		t.Fatalf("StopTelepresence failed: %v", err)
	}

	// STEP 11: Application Shutdown
	appInstance.Shutdown(ctx)
}
