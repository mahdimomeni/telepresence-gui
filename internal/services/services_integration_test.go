package services

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"telepresence-gui/internal/models"
	"testing"
)

func TestCrossService_KubeAndConfigIntegration(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "tp-gui-services-integration-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	// Create real kubeconfig YAML file in tempDir
	kubeconfigContent := `
apiVersion: v1
kind: Config
current-context: production-us-east
contexts:
- name: production-us-east
  context:
    cluster: prod-k8s
    namespace: billing
    user: admin-user
- name: staging-eu-west
  context:
    cluster: stage-k8s
    namespace: default
    user: developer
clusters:
- name: prod-k8s
  cluster:
    server: https://k8s-prod.company.internal
- name: stage-k8s
  cluster:
    server: https://k8s-stage.company.internal
users:
- name: admin-user
  user:
    token: test-token
`
	kubeconfigPath := filepath.Join(tempDir, "kubeconfig.yaml")
	if err := os.WriteFile(kubeconfigPath, []byte(kubeconfigContent), 0o600); err != nil {
		t.Fatalf("failed to write kubeconfig file: %v", err)
	}

	runner := &mockRunner{}
	configSvc := NewConfigServiceWithDir(tempDir)
	kubeSvc := NewKubeService(runner, configSvc)

	ctx := context.Background()

	// 1. Get Kube Info from file
	kubeInfo, err := kubeSvc.GetKubeInfo(ctx, kubeconfigPath)
	if err != nil {
		t.Fatalf("GetKubeInfo failed: %v", err)
	}

	if kubeInfo.CurrentContext != "production-us-east" {
		t.Errorf("expected current context production-us-east, got %s", kubeInfo.CurrentContext)
	}
	if kubeInfo.Namespace != "billing" {
		t.Errorf("expected namespace billing, got %s", kubeInfo.Namespace)
	}
	if len(kubeInfo.Contexts) != 2 {
		t.Errorf("expected 2 contexts, got %d", len(kubeInfo.Contexts))
	}

	// 2. Save Connect Config through ConfigService and verify KubeService retrieves it
	connectCfg := models.ConnectConfig{
		Namespace:  kubeInfo.Namespace,
		Context:    kubeInfo.CurrentContext,
		Cluster:    "prod-k8s",
		APIServer:  "https://k8s-prod.company.internal",
		Kubeconfig: kubeconfigPath,
		Docker:     true,
	}

	if err := configSvc.SaveConnectConfig(connectCfg); err != nil {
		t.Fatalf("SaveConnectConfig failed: %v", err)
	}

	loadedKubeInfo, err := kubeSvc.GetKubeInfo(ctx, kubeconfigPath)
	if err != nil {
		t.Fatalf("second GetKubeInfo failed: %v", err)
	}
	if loadedKubeInfo.SavedConfig == nil {
		t.Fatalf("expected SavedConfig to be non-nil in KubeInfo")
	}
	if loadedKubeInfo.SavedConfig.Context != "production-us-east" {
		t.Errorf("expected saved config context production-us-east, got %s", loadedKubeInfo.SavedConfig.Context)
	}

	// 3. Telepresence Service consuming SavedConfig
	var executedArgs []string
	tpRunner := &mockRunner{
		runFunc: func(_ context.Context, _ string, args ...string) (string, error) {
			executedArgs = args
			return `{"status": "connected"}`, nil
		},
	}
	teleSvc := NewTelepresenceService(tpRunner)

	_, err = teleSvc.Start(ctx, *loadedKubeInfo.SavedConfig)
	if err != nil {
		t.Fatalf("TelepresenceService.Start failed: %v", err)
	}

	argString := strings.Join(executedArgs, " ")
	if !strings.Contains(argString, "--namespace billing") || !strings.Contains(argString, "--context production-us-east") || !strings.Contains(argString, "--docker") {
		t.Errorf("telepresence args missing expected values: %s", argString)
	}
}
