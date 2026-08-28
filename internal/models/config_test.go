package models

import (
	"encoding/json"
	"testing"
)

func TestDefaultAppSettings(t *testing.T) {
	defaults := DefaultAppSettings()

	if defaults.Theme != "dark" {
		t.Errorf("expected default theme 'dark', got %s", defaults.Theme)
	}
	if !defaults.EnableGlowEffects {
		t.Errorf("expected EnableGlowEffects to be true")
	}
	if !defaults.ShowSplashScreen {
		t.Errorf("expected ShowSplashScreen to be true")
	}
	if !defaults.CloseToTray {
		t.Errorf("expected CloseToTray to be true")
	}
	if defaults.StartMinimized {
		t.Errorf("expected StartMinimized to be false")
	}
	if !defaults.EnableNotifications {
		t.Errorf("expected EnableNotifications to be true")
	}
	if !defaults.NotifyOnConnect {
		t.Errorf("expected NotifyOnConnect to be true")
	}
	if !defaults.NotifyOnIntercept {
		t.Errorf("expected NotifyOnIntercept to be true")
	}
	if !defaults.AutoCheckUpdates {
		t.Errorf("expected AutoCheckUpdates to be true")
	}
	if defaults.DefaultNamespace != "default" {
		t.Errorf("expected DefaultNamespace 'default', got %s", defaults.DefaultNamespace)
	}
	if defaults.RequestTimeoutSeconds != 60 {
		t.Errorf("expected RequestTimeoutSeconds 60, got %d", defaults.RequestTimeoutSeconds)
	}
	if defaults.PollIntervalSeconds != 4 {
		t.Errorf("expected PollIntervalSeconds 4, got %d", defaults.PollIntervalSeconds)
	}
	if defaults.MaxLogLines != 2000 {
		t.Errorf("expected MaxLogLines 2000, got %d", defaults.MaxLogLines)
	}
	if !defaults.AutoScrollLogs {
		t.Errorf("expected AutoScrollLogs to be true")
	}
	if !defaults.WrapLogLines {
		t.Errorf("expected WrapLogLines to be true")
	}
	if defaults.DefaultLogLevel != "all" {
		t.Errorf("expected DefaultLogLevel 'all', got %s", defaults.DefaultLogLevel)
	}
}

func TestConnectConfigSerialization(t *testing.T) {
	cfg := ConnectConfig{
		Namespace:                  "dev",
		Name:                       "dev-session",
		ManagerNamespace:           "ambassador",
		Docker:                     true,
		MappedNamespaces:           "default,dev",
		ProxyVia:                   "gateway",
		AlsoProxy:                  "10.0.0.0/8",
		NeverProxy:                 "192.168.1.0/24",
		RerouteLocal:               "80:8080",
		RerouteRemote:              "90:9090",
		VirtualNAT:                 "10.244.0.0/16",
		AllowConflictingSubnets:    "true",
		ExposePorts:                "8080:80",
		Hostname:                   "my-host",
		Kubeconfig:                 "/path/to/kubeconfig",
		Context:                    "my-context",
		Cluster:                    "my-cluster",
		APIServer:                  "https://k8s.example.com",
		BearerToken:                "token123",
		User:                       "admin",
		ImpersonateUser:            "dev-user",
		ImpersonateGroup:           "dev-group",
		ImpersonateUID:             "1001",
		ClientCertificate:          "/path/to/cert",
		ClientKey:                  "/path/to/key",
		SkipTLSVerify:              true,
		TLSServerName:              "k8s.example.com",
		TelepresenceConfigPath:     "/path/to/tp.yaml",
		RequestTimeout:             "30s",
		DisableResponseCompression: true,
	}

	data, err := json.Marshal(cfg)
	if err != nil {
		t.Fatalf("failed to marshal ConnectConfig: %v", err)
	}

	var parsed ConnectConfig
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal ConnectConfig: %v", err)
	}

	if parsed.Namespace != "dev" || parsed.Name != "dev-session" || !parsed.Docker || !parsed.SkipTLSVerify || !parsed.DisableResponseCompression {
		t.Errorf("deserialized ConnectConfig does not match original: %+v", parsed)
	}
}

func TestInterceptAndReplaceConfigSerialization(t *testing.T) {
	ic := InterceptConfig{
		Workload:       "user-service",
		Port:           "8080:80",
		Address:        "127.0.0.1",
		Container:      "main",
		Service:        "user-svc",
		Namespace:      "backend",
		HTTPHeader:     "x-user=test",
		HTTPPathPrefix: "/api/v1",
		Mount:          "/tmp/mount",
		LocalMountPort: 9000,
		ToPod:          []string{"8080", "9090"},
		EnvFile:        ".env",
		EnvJSON:        "env.json",
		EnvSyntax:      "docker",
		DockerRun:      true,
		DockerArgs:     "-e FOO=BAR",
		DockerBuild:    "./Dockerfile",
		DockerBuildOpt: []string{"--tag", "test:latest"},
		DockerDebug:    "true",
		DockerMount:    "/app",
	}

	data, err := json.Marshal(ic)
	if err != nil {
		t.Fatalf("failed to marshal InterceptConfig: %v", err)
	}

	var parsed InterceptConfig
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal InterceptConfig: %v", err)
	}

	if parsed.Workload != "user-service" || parsed.LocalMountPort != 9000 || !parsed.DockerRun || len(parsed.ToPod) != 2 {
		t.Errorf("deserialized InterceptConfig does not match: %+v", parsed)
	}

	rc := ReplaceConfig{
		Workload:       "auth-service",
		Port:           "3000",
		Container:      "auth",
		Address:        "127.0.0.1",
		Mount:          "/tmp/replace",
		LocalMountPort: 9001,
		ToPod:          []string{"3000"},
		EnvFile:        ".env.replace",
		DockerRun:      false,
		Namespace:      "auth-ns",
	}

	rcData, err := json.Marshal(rc)
	if err != nil {
		t.Fatalf("failed to marshal ReplaceConfig: %v", err)
	}

	var rcParsed ReplaceConfig
	if err := json.Unmarshal(rcData, &rcParsed); err != nil {
		t.Fatalf("failed to unmarshal ReplaceConfig: %v", err)
	}

	if rcParsed.Workload != "auth-service" || rcParsed.Namespace != "auth-ns" || rcParsed.LocalMountPort != 9001 {
		t.Errorf("deserialized ReplaceConfig does not match: %+v", rcParsed)
	}

	dc := DetachConfig{
		AttachmentName: "user-service",
		Namespace:      "backend",
	}
	dcData, err := json.Marshal(dc)
	if err != nil {
		t.Fatalf("failed to marshal DetachConfig: %v", err)
	}
	var dcParsed DetachConfig
	if err := json.Unmarshal(dcData, &dcParsed); err != nil {
		t.Fatalf("failed to unmarshal DetachConfig: %v", err)
	}
	if dcParsed.AttachmentName != "user-service" || dcParsed.Namespace != "backend" {
		t.Errorf("deserialized DetachConfig mismatch: %+v", dcParsed)
	}
}
