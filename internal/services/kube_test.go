package services

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestKubeService_GetKubeInfo_YAML(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "kube_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	kubeconfigPath := filepath.Join(tempDir, "config")
	yamlContent := `
apiVersion: v1
kind: Config
current-context: dev-cluster
contexts:
- name: dev-cluster
  context:
    cluster: dev-cluster
    namespace: dev-ns
    user: developer
- name: prod-cluster
  context:
    cluster: prod-cluster
    namespace: prod-ns
    user: admin
`
	if err := os.WriteFile(kubeconfigPath, []byte(yamlContent), 0o600); err != nil {
		t.Fatalf("failed to write kubeconfig: %v", err)
	}

	configSvc := NewConfigServiceWithDir(tempDir)
	runner := &mockRunner{}
	kubeSvc := NewKubeService(runner, configSvc)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	info, err := kubeSvc.GetKubeInfo(ctx, kubeconfigPath)
	if err != nil {
		t.Fatalf("unexpected error from GetKubeInfo: %v", err)
	}

	if info.CurrentContext != "dev-cluster" {
		t.Errorf("expected current context 'dev-cluster', got %s", info.CurrentContext)
	}
	if info.Namespace != "dev-ns" {
		t.Errorf("expected namespace 'dev-ns', got %s", info.Namespace)
	}
	if len(info.Contexts) != 2 {
		t.Fatalf("expected 2 contexts, got %d", len(info.Contexts))
	}
	if info.Contexts[0] != "dev-cluster" || info.Contexts[1] != "prod-cluster" {
		t.Errorf("unexpected contexts list: %+v", info.Contexts)
	}
	if info.KubeconfigPath != kubeconfigPath {
		t.Errorf("expected kubeconfig path %s, got %s", kubeconfigPath, info.KubeconfigPath)
	}
}

func TestKubeService_GetKubeInfo_CLIFallback(t *testing.T) {
	const configCmd = "config"
	tempDir, err := os.MkdirTemp("", "kube_test_cli_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	configSvc := NewConfigServiceWithDir(tempDir)
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			if len(args) >= 3 && args[0] == configCmd && args[1] == "get-contexts" {
				return "ctx-one\nctx-two\n", nil
			}
			if len(args) >= 3 && args[0] == configCmd && args[1] == "current-context" {
				return "ctx-two\n", nil
			}
			if len(args) >= 3 && args[0] == configCmd && args[1] == "view" {
				return "staging-ns\n", nil
			}
			return "", nil
		},
	}

	kubeSvc := NewKubeService(runner, configSvc)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Non-existent kubeconfig path triggers CLI fallback
	info, err := kubeSvc.GetKubeInfo(ctx, filepath.Join(tempDir, "non_existent_config"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if info.CurrentContext != "ctx-two" {
		t.Errorf("expected current context 'ctx-two', got %s", info.CurrentContext)
	}
	if info.Namespace != "staging-ns" {
		t.Errorf("expected namespace 'staging-ns', got %s", info.Namespace)
	}
	if len(info.Contexts) != 2 || info.Contexts[0] != "ctx-one" || info.Contexts[1] != "ctx-two" {
		t.Errorf("unexpected contexts: %+v", info.Contexts)
	}
}
