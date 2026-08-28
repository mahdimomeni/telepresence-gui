package e2e

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"telepresence-gui/internal/app"
	"telepresence-gui/internal/models"
	"telepresence-gui/internal/services"
)

func TestE2E_ResilienceAndErrorRecovery(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "tp-e2e-resilience-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	runner := newE2EMockRunner()

	// 1. Configure runner to return errors
	runner.Register("telepresence", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		switch {
		case strings.Contains(argStr, "connect"):
			return "connector timed out waiting for daemon response", errors.New("exit status 1")
		case strings.Contains(argStr, "intercept"):
			return "port collision on target port 8080", errors.New("exit status 1")
		case strings.Contains(argStr, "replace"):
			return "failed to pull replacement image", errors.New("exit status 1")
		case strings.Contains(argStr, "leave"):
			return "intercept target not found", errors.New("exit status 1")
		case strings.Contains(argStr, "quit -s"):
			return "daemon already terminated", errors.New("exit status 1")
		case strings.Contains(argStr, "status --format json"):
			return `malformed-json-payload`, nil
		case strings.Contains(argStr, "list --format json"):
			return `invalid json`, nil
		default:
			return "", errors.New("command execution failed")
		}
	})

	runner.Register("kubectl", func(_ context.Context, args []string) (string, error) {
		return "", errors.New("kubectl binary execution failed")
	})

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

	// 1. Tool check report structure & error resilience
	toolReport, err := appInstance.CheckSystemTools()
	if err != nil {
		t.Fatalf("CheckSystemTools failed: %v", err)
	}
	if len(toolReport.Tools) != 2 {
		t.Errorf("expected 2 tools reported, got %d", len(toolReport.Tools))
	}

	// 2. Corrupt settings file fallback recovery
	settingsPath := filepath.Join(tempDir, "settings.json")
	if err := os.WriteFile(settingsPath, []byte("{corrupted-json-content!"), 0o600); err != nil {
		t.Fatalf("failed to write corrupted settings: %v", err)
	}

	recoveredSettings, err := appInstance.GetAppSettings()
	if err == nil && recoveredSettings.Theme == "" {
		t.Errorf("expected default settings when settings.json is corrupted")
	}

	// 3. Reset settings creates fresh valid config
	resetSettings, err := appInstance.ResetAppSettings()
	if err != nil || resetSettings.Theme != "dark" {
		t.Fatalf("ResetAppSettings failed to restore defaults: %v", err)
	}

	// 4. Connect failure handling
	err = appInstance.StartTelepresence(models.ConnectConfig{
		Context:   "invalid-ctx",
		Namespace: "default",
	})
	if err == nil {
		t.Fatalf("expected StartTelepresence to fail with daemon error")
	}

	// 5. Workload operation failure handling
	if err := appInstance.InterceptWorkload(models.InterceptConfig{Workload: "svc"}); err == nil {
		t.Fatalf("expected InterceptWorkload to fail on error")
	}

	if err := appInstance.ReplaceWorkload(models.ReplaceConfig{Workload: "svc"}); err == nil {
		t.Fatalf("expected ReplaceWorkload to fail on error")
	}

	if err := appInstance.DetachWorkload(models.DetachConfig{AttachmentName: "svc"}); err == nil {
		t.Fatalf("expected DetachWorkload to fail on error")
	}

	// 6. Stop telepresence failure handling
	if err := appInstance.StopTelepresence(); err == nil {
		t.Fatalf("expected StopTelepresence to return error when quit fails")
	}
}

func TestE2E_ConcurrentStatusChecksAndConfigRoundtrips(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "tp-e2e-concurrency-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	runner := newE2EMockRunner()
	runner.Register("telepresence", func(_ context.Context, args []string) (string, error) {
		argStr := strings.Join(args, " ")
		switch {
		case strings.Contains(argStr, "status --format json"):
			return `{"root_daemon": {"running": true}, "user_daemon": {"running": true, "status": "Connected"}}`, nil
		case strings.Contains(argStr, "list --format json"):
			return `[{"name": "worker-pool", "namespace": "prod", "workload_resource_type": "Deployment"}]`, nil
		default:
			return `{"status": "ok"}`, nil
		}
	})

	runner.Register("kubectl", func(_ context.Context, _ []string) (string, error) {
		return `{"clientVersion":{"gitVersion":"v1.31.0"}}`, nil
	})

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
	appInstance.SetEventEmitter(emitter)

	ctx := context.Background()
	appInstance.SetContext(ctx)

	// Run concurrent config mutations and reads
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func(workerID int) {
			for j := 0; j < 20; j++ {
				cfg := models.ConnectConfig{
					Namespace: "prod",
					Context:   "cluster-1",
					Cluster:   "k8s-cluster",
				}
				_ = appInstance.SaveConnectConfig(cfg)
				_, _ = appInstance.LoadConnectConfig()

				settings := models.DefaultAppSettings()
				settings.PollIntervalSeconds = 4 + workerID
				_ = appInstance.SaveAppSettings(settings)
				_, _ = appInstance.GetAppSettings()
			}
			done <- true
		}(i)
	}

	for i := 0; i < 10; i++ {
		<-done
	}

	// Verify consistent state at the end
	finalSettings, err := appInstance.GetAppSettings()
	if err != nil || finalSettings.Theme != "dark" {
		t.Fatalf("unexpected state after concurrent execution: %+v, err: %v", finalSettings, err)
	}
}
