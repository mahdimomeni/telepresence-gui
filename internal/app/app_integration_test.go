package app

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"telepresence-gui/internal/models"
	"telepresence-gui/internal/services"
	"testing"

	"github.com/wailsapp/wails/v2/pkg/options"
)

type mockIntegrationRunner struct {
	mu       sync.Mutex
	handlers map[string]func(ctx context.Context, args []string) (string, error)
	calls    []string
}

func newMockIntegrationRunner() *mockIntegrationRunner {
	return &mockIntegrationRunner{
		handlers: make(map[string]func(ctx context.Context, args []string) (string, error)),
	}
}

func (m *mockIntegrationRunner) Register(cmdName string, handler func(ctx context.Context, args []string) (string, error)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.handlers[cmdName] = handler
}

func (m *mockIntegrationRunner) Run(ctx context.Context, name string, args ...string) (string, error) {
	m.mu.Lock()
	m.calls = append(m.calls, name+" "+strings.Join(args, " "))
	handler, exists := m.handlers[name]
	m.mu.Unlock()

	if exists && handler != nil {
		return handler(ctx, args)
	}

	return "", errors.New("command not mocked: " + name)
}

type mockEventEmitter struct {
	mu     sync.Mutex
	events map[string][]interface{}
}

func newMockEventEmitter() *mockEventEmitter {
	return &mockEventEmitter{
		events: make(map[string][]interface{}),
	}
}

func (m *mockEventEmitter) Emit(eventName string, data ...interface{}) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events[eventName] = append(m.events[eventName], data)
}

func (m *mockEventEmitter) HasEvent(eventName string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	_, exists := m.events[eventName]
	return exists
}

type mockNotifier struct {
	mu            sync.Mutex
	notifications []struct{ Title, Body string }
}

func (m *mockNotifier) SendNotification(title, body string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.notifications = append(m.notifications, struct{ Title, Body string }{title, body})
	return nil
}

func setupTestApp(t *testing.T, runner *mockIntegrationRunner) (*App, *mockEventEmitter, string) {
	t.Helper()
	tempDir, err := os.MkdirTemp("", "tp-gui-app-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	configService := services.NewConfigServiceWithDir(tempDir)
	teleService := services.NewTelepresenceService(runner)
	kubeService := services.NewKubeService(runner, configService)
	updateService := services.NewUpdateService("mahdimomeni", "telepresence-gui", "1.0.0")
	toolService := services.NewToolCheckerService(runner)

	appInstance := NewApp(
		teleService,
		kubeService,
		configService,
		updateService,
		toolService,
		nil,
	)

	emitter := newMockEventEmitter()
	notifier := &mockNotifier{}
	appInstance.SetEventEmitter(emitter)
	appInstance.SetNotifier(notifier)

	return appInstance, emitter, tempDir
}

func TestApp_FullIntegrationLifecycle(t *testing.T) {
	runner := newMockIntegrationRunner()

	// 1. Tool Checker commands
	runner.Register("telepresence", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		switch {
		case strings.Contains(argStr, "version"):
			return "Client  : v2.21.3 (api v3)\nRoot Daemon: not running\nUser Daemon: not running", nil
		case strings.Contains(argStr, "connect"):
			return `{"status": "connected", "message": "Connected to context 'dev-ctx'"}`, nil
		case strings.Contains(argStr, "status --format json"):
			return `{"root_daemon": {"running": true}, "user_daemon": {"running": true, "status": "Connected"}}`, nil
		case strings.Contains(argStr, "list --format json"):
			return `[
				{
					"name": "payment-service",
					"namespace": "ecommerce",
					"workload_resource_type": "Deployment",
					"intercept_info": [
						{
							"id": "int-123",
							"spec": {
								"name": "payment-service",
								"client": "local-dev",
								"target_host": "127.0.0.1",
								"target_port": 8080,
								"mechanism": "http"
							}
						}
					]
				},
				{
					"name": "auth-service",
					"namespace": "ecommerce",
					"workload_resource_type": "Deployment"
				}
			]`, nil
		case strings.Contains(argStr, "intercept payment-service"):
			return `{"status": "success", "message": "Intercepted payment-service"}`, nil
		case strings.Contains(argStr, "replace auth-service"):
			return `{"status": "success", "message": "Replaced auth-service"}`, nil
		case strings.Contains(argStr, "leave payment-service"):
			return `{"status": "success", "message": "Left intercept"}`, nil
		case strings.Contains(argStr, "quit -s"):
			return `{"status": "success", "message": "Telepresence daemon stopped"}`, nil
		default:
			return `{"status": "ok"}`, nil
		}
	})

	runner.Register("kubectl", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		switch {
		case strings.Contains(argStr, "version"):
			return `{"clientVersion":{"gitVersion":"v1.31.0"}}`, nil
		case strings.Contains(argStr, "config view"):
			return `{
				"current-context": "dev-ctx",
				"contexts": [
					{"name": "dev-ctx", "context": {"cluster": "dev-cluster", "namespace": "ecommerce", "user": "dev-user"}},
					{"name": "stage-ctx", "context": {"cluster": "stage-cluster", "namespace": "staging", "user": "stage-user"}}
				],
				"clusters": [
					{"name": "dev-cluster", "cluster": {"server": "https://k8s-dev.example.com"}},
					{"name": "stage-cluster", "cluster": {"server": "https://k8s-stage.example.com"}}
				],
				"users": [
					{"name": "dev-user", "user": {"token": "secret-token"}}
				]
			}`, nil
		default:
			return "", nil
		}
	})

	appInstance, emitter, tempDir := setupTestApp(t, runner)
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	ctx := context.Background()
	appInstance.ctx = ctx

	// 1. Tool Checker integration
	report, err := appInstance.CheckSystemTools()
	if err != nil {
		t.Fatalf("CheckSystemTools failed: %v", err)
	}
	if !report.AllInstalled || report.MissingCount != 0 {
		t.Errorf("expected all tools installed, got %+v", report)
	}
	if len(report.Tools) < 2 {
		t.Errorf("expected 2 tools reported, got %d", len(report.Tools))
	}

	// 2. Settings lifecycle & persistence
	initialSettings, err := appInstance.GetAppSettings()
	if err != nil {
		t.Fatalf("GetAppSettings failed: %v", err)
	}
	if initialSettings.Theme != "dark" {
		t.Errorf("expected default theme dark, got %s", initialSettings.Theme)
	}

	// Modify settings
	modifiedSettings := initialSettings
	modifiedSettings.Theme = "light"
	modifiedSettings.RequestTimeoutSeconds = 45
	modifiedSettings.PollIntervalSeconds = 6
	modifiedSettings.EnableGlowEffects = false
	modifiedSettings.EnableNotifications = false

	if err := appInstance.SaveAppSettings(modifiedSettings); err != nil {
		t.Fatalf("SaveAppSettings failed: %v", err)
	}

	// Verify file was written
	savedBytes, err := os.ReadFile(filepath.Join(tempDir, "settings.json"))
	if err != nil {
		t.Fatalf("failed to read persisted settings.json: %v", err)
	}
	if !strings.Contains(string(savedBytes), `"light"`) {
		t.Errorf("settings file does not contain updated theme: %s", string(savedBytes))
	}

	loadedSettings, err := appInstance.GetAppSettings()
	if err != nil || loadedSettings.Theme != "light" || loadedSettings.RequestTimeoutSeconds != 45 {
		t.Errorf("unexpected loaded settings: %+v", loadedSettings)
	}

	// Reset settings
	resetSettings, err := appInstance.ResetAppSettings()
	if err != nil || resetSettings.Theme != "dark" {
		t.Errorf("unexpected reset settings: %+v, err: %v", resetSettings, err)
	}

	// 3. Kubernetes info retrieval & connect config persistence
	kubeconfigPath := filepath.Join(tempDir, "kubeconfig.yaml")
	kubeconfigContent := `
apiVersion: v1
kind: Config
current-context: dev-ctx
contexts:
- name: dev-ctx
  context:
    cluster: dev-cluster
    namespace: ecommerce
    user: dev-user
- name: stage-ctx
  context:
    cluster: stage-cluster
    namespace: staging
    user: stage-user
`
	if err := os.WriteFile(kubeconfigPath, []byte(kubeconfigContent), 0o600); err != nil {
		t.Fatalf("failed to write mock kubeconfig: %v", err)
	}

	kubeInfo, err := appInstance.GetKubeInfo(kubeconfigPath)
	if err != nil {
		t.Fatalf("GetKubeInfo failed: %v", err)
	}
	if kubeInfo.CurrentContext != "dev-ctx" || kubeInfo.Namespace != "ecommerce" {
		t.Errorf("unexpected kubeInfo: %+v", kubeInfo)
	}
	if len(kubeInfo.Contexts) != 2 {
		t.Errorf("expected 2 contexts, got %d", len(kubeInfo.Contexts))
	}

	// Save and load connect config
	connectCfg := models.ConnectConfig{
		Namespace:  "ecommerce",
		Context:    "dev-ctx",
		Cluster:    "dev-cluster",
		APIServer:  "https://k8s-dev.example.com",
		Kubeconfig: "/mock/kube/config",
		Docker:     true,
	}
	if err := appInstance.SaveConnectConfig(connectCfg); err != nil {
		t.Fatalf("SaveConnectConfig failed: %v", err)
	}

	loadedCfg, err := appInstance.LoadConnectConfig()
	if err != nil || loadedCfg == nil || loadedCfg.Context != "dev-ctx" || !loadedCfg.Docker {
		t.Errorf("unexpected loaded connect config: %+v, err: %v", loadedCfg, err)
	}

	// 4. Connect flow
	if err := appInstance.StartTelepresence(connectCfg); err != nil {
		t.Fatalf("StartTelepresence failed: %v", err)
	}

	appInstance.statusMu.Lock()
	isConnected := appInstance.isConnected
	appInstance.statusMu.Unlock()
	if !isConnected {
		t.Errorf("expected isConnected to be true after StartTelepresence")
	}
	if !emitter.HasEvent("connection-changed") {
		t.Errorf("expected connection-changed event to be emitted")
	}

	// 5. Workload operations
	workloads, err := appInstance.ListWorkloads()
	if err != nil {
		t.Fatalf("ListWorkloads failed: %v", err)
	}
	if len(workloads) != 2 {
		t.Fatalf("expected 2 workloads, got %d", len(workloads))
	}
	if workloads[0].Name != "payment-service" || len(workloads[0].InterceptInfo) == 0 {
		t.Errorf("expected payment-service to be intercepted, got: %+v", workloads[0])
	}
	if workloads[1].Name != "auth-service" || len(workloads[1].InterceptInfo) > 0 {
		t.Errorf("expected auth-service to not be intercepted, got: %+v", workloads[1])
	}

	// Intercept workload
	interceptCfg := models.InterceptConfig{
		Workload:  "payment-service",
		Namespace: "ecommerce",
		Port:      "8080:80",
	}
	if err := appInstance.InterceptWorkload(interceptCfg); err != nil {
		t.Fatalf("InterceptWorkload failed: %v", err)
	}

	// Replace workload
	replaceCfg := models.ReplaceConfig{
		Workload:  "auth-service",
		Namespace: "ecommerce",
		Container: "auth-container",
		Port:      "9000:80",
	}
	if err := appInstance.ReplaceWorkload(replaceCfg); err != nil {
		t.Fatalf("ReplaceWorkload failed: %v", err)
	}

	// Detach workload
	detachCfg := models.DetachConfig{
		AttachmentName: "payment-service",
		Namespace:      "ecommerce",
	}
	if err := appInstance.DetachWorkload(detachCfg); err != nil {
		t.Fatalf("DetachWorkload failed: %v", err)
	}

	// 6. Disconnect flow
	if err := appInstance.StopTelepresence(); err != nil {
		t.Fatalf("StopTelepresence failed: %v", err)
	}

	appInstance.statusMu.Lock()
	isConnected = appInstance.isConnected
	appInstance.statusMu.Unlock()
	if isConnected {
		t.Errorf("expected isConnected to be false after StopTelepresence")
	}

	// 7. Secondary instance launch & shutdown
	appInstance.OnSecondInstanceLaunch(options.SecondInstanceData{
		Args:             []string{"--connect", "--context=dev-ctx"},
		WorkingDirectory: tempDir,
	})

	appInstance.Shutdown(ctx)
}

func TestApp_ErrorHandlingAndEdgeCases(t *testing.T) {
	runner := newMockIntegrationRunner()

	// Make CLI return failures
	runner.Register("telepresence", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		switch {
		case strings.Contains(argStr, "connect"):
			return "failed to establish connector tunnel", errors.New("exit status 1")
		case strings.Contains(argStr, "intercept"):
			return "workload already intercepted", errors.New("exit status 1")
		case strings.Contains(argStr, "replace"):
			return "container not found in pod", errors.New("exit status 1")
		case strings.Contains(argStr, "leave"):
			return "no active intercept with that name", errors.New("exit status 1")
		case strings.Contains(argStr, "quit -s"):
			return "daemon is not currently running", errors.New("exit status 1")
		default:
			return "", errors.New("command failed")
		}
	})

	appInstance, _, tempDir := setupTestApp(t, runner)
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	ctx := context.Background()
	appInstance.ctx = ctx

	// 1. Connect failure should return error and not flip connection state
	err := appInstance.StartTelepresence(models.ConnectConfig{Namespace: "default"})
	if err == nil {
		t.Errorf("expected StartTelepresence to fail")
	}
	appInstance.statusMu.Lock()
	if appInstance.isConnected {
		t.Errorf("isConnected should remain false after failed connect")
	}
	appInstance.statusMu.Unlock()

	// 2. Intercept, Replace, Detach errors
	if err := appInstance.InterceptWorkload(models.InterceptConfig{Workload: "svc"}); err == nil {
		t.Errorf("expected InterceptWorkload to fail")
	}
	if err := appInstance.ReplaceWorkload(models.ReplaceConfig{Workload: "svc"}); err == nil {
		t.Errorf("expected ReplaceWorkload to fail")
	}
	if err := appInstance.DetachWorkload(models.DetachConfig{AttachmentName: "svc"}); err == nil {
		t.Errorf("expected DetachWorkload to fail")
	}

	// 3. Stop Telepresence error
	if err := appInstance.StopTelepresence(); err == nil {
		t.Errorf("expected StopTelepresence to fail")
	}

	// 4. Notification with disabled settings
	_ = appInstance.configService.SaveAppSettings(models.AppSettings{
		EnableNotifications: false,
	})
	if err := appInstance.Notify("Test", "Body"); err != nil {
		t.Errorf("unexpected error on disabled notification: %v", err)
	}
}

func TestApp_StatusCheckingLogic(t *testing.T) {
	runner := newMockIntegrationRunner()

	statusResponse := `{"root_daemon": {"running": true}, "user_daemon": {"running": true, "status": "Connected"}}`
	workloadsResponse := `[{"name": "test-svc", "namespace": "default"}]`

	runner.Register("telepresence", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		switch {
		case strings.Contains(argStr, "status --format json"):
			return statusResponse, nil
		case strings.Contains(argStr, "list --format json"):
			return workloadsResponse, nil
		default:
			return "", nil
		}
	})

	appInstance, emitter, tempDir := setupTestApp(t, runner)
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	ctx := context.Background()
	appInstance.ctx = ctx

	// Invoke status check logic directly
	appInstance.checkTelepresenceChanges()

	appInstance.statusMu.Lock()
	isConnected := appInstance.isConnected
	lastStatus := appInstance.lastStatusRaw
	appInstance.statusMu.Unlock()

	if !isConnected {
		t.Errorf("expected isConnected to become true after connected status detected")
	}
	if lastStatus != statusResponse {
		t.Errorf("expected lastStatus to match response, got: %s", lastStatus)
	}
	if !emitter.HasEvent("telepresence-status-changed") {
		t.Errorf("expected telepresence-status-changed event to be emitted")
	}
}
