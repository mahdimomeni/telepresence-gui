package services

import (
	"context"
	"strings"
	"telepresence-gui/internal/models"
	"testing"
	"time"
)

func TestTelepresenceService_StartFlags(t *testing.T) {
	var capturedArgs []string
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			capturedArgs = args
			return `{"error": ""}`, nil
		},
	}

	svc := NewTelepresenceService(runner)
	ctx := context.Background()

	config := models.ConnectConfig{
		Namespace:                  "custom-ns",
		Name:                       "custom-name",
		ManagerNamespace:           "ambassador",
		Docker:                     true,
		MappedNamespaces:           "all",
		ProxyVia:                   "10.0.0.1",
		AlsoProxy:                  "10.1.0.0/16",
		NeverProxy:                 "192.168.0.0/16",
		RerouteLocal:               "8080:80",
		RerouteRemote:              "9090:90",
		VirtualNAT:                 "10.244.0.0/16",
		AllowConflictingSubnets:    "true",
		ExposePorts:                "3000:3000",
		Hostname:                   "dev-box",
		Kubeconfig:                 "/home/user/.kube/config",
		Context:                    "my-ctx",
		Cluster:                    "my-cluster",
		APIServer:                  "https://k8s.example.com",
		BearerToken:                "token",
		User:                       "kube-user",
		ImpersonateUser:            "imp-user",
		ImpersonateGroup:           "imp-group",
		ImpersonateUID:             "1000",
		ClientCertificate:          "/cert.crt",
		ClientKey:                  "/cert.key",
		SkipTLSVerify:              true,
		TLSServerName:              "k8s.example.com",
		TelepresenceConfigPath:     "/tp.yaml",
		RequestTimeout:             "45s",
		DisableResponseCompression: true,
	}

	_, err := svc.Start(ctx, config)
	if err != nil {
		t.Fatalf("unexpected error starting telepresence: %v", err)
	}

	argString := strings.Join(capturedArgs, " ")

	expectedFlags := []string{
		"connect",
		"--namespace custom-ns",
		"--name custom-name",
		"--manager-namespace ambassador",
		"--docker",
		"--mapped-namespaces all",
		"--proxy-via 10.0.0.1",
		"--also-proxy 10.1.0.0/16",
		"--never-proxy 192.168.0.0/16",
		"--reroute-local 8080:80",
		"--reroute-remote 9090:90",
		"--vnat 10.244.0.0/16",
		"--allow-conflicting-subnets true",
		"--expose 3000:3000",
		"--hostname dev-box",
		"--kubeconfig /home/user/.kube/config",
		"--context my-ctx",
		"--cluster my-cluster",
		"--server https://k8s.example.com",
		"--token token",
		"--user kube-user",
		"--as imp-user",
		"--as-group imp-group",
		"--as-uid 1000",
		"--client-certificate /cert.crt",
		"--client-key /cert.key",
		"--insecure-skip-tls-verify",
		"--tls-server-name k8s.example.com",
		"--config /tp.yaml",
		"--request-timeout 45s",
		"--disable-compression",
		"--format json",
		"--progress quiet",
	}

	for _, flag := range expectedFlags {
		if !strings.Contains(argString, flag) {
			t.Errorf("expected argString to contain flag %q, got: %s", flag, argString)
		}
	}
}

func TestTelepresenceService_InterceptFlags(t *testing.T) {
	var capturedArgs []string
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			capturedArgs = args
			return "", nil
		},
	}

	svc := NewTelepresenceService(runner)
	ctx := context.Background()

	config := models.InterceptConfig{
		Workload:       "web-app",
		Port:           "8080:80",
		Address:        "127.0.0.1",
		Container:      "web",
		Service:        "web-svc",
		Namespace:      "prod",
		HTTPHeader:     "x-debug=true",
		HTTPPathPrefix: "/api",
		Mount:          "/tmp/mount",
		LocalMountPort: 9005,
		ToPod:          []string{"8080", "9090"},
		EnvFile:        ".env",
		EnvJSON:        "env.json",
		EnvSyntax:      "docker",
		DockerMount:    "/app",
		DockerDebug:    "true",
		DockerBuild:    "./Dockerfile",
		DockerBuildOpt: []string{"--tag test:v1"},
		DockerRun:      true,
		DockerArgs:     "--rm -it",
	}

	_, err := svc.Intercept(ctx, config)
	if err != nil {
		t.Fatalf("unexpected error from Intercept: %v", err)
	}

	argString := strings.Join(capturedArgs, " ")

	expectedTokens := []string{
		"intercept web-app",
		"--port 8080:80",
		"--namespace prod",
		"--address 127.0.0.1",
		"--container web",
		"--service web-svc",
		"--http-header x-debug=true",
		"--http-path-prefix /api",
		"--mount /tmp/mount",
		"--local-mount-port 9005",
		"--to-pod 8080",
		"--to-pod 9090",
		"--env-file .env",
		"--env-json env.json",
		"--env-syntax docker",
		"--docker-mount /app",
		"--docker-debug true",
		"--docker-build ./Dockerfile",
		"--docker-build-opt --tag test:v1",
		"--docker-run",
		"-- --rm -it",
	}

	for _, token := range expectedTokens {
		if !strings.Contains(argString, token) {
			t.Errorf("expected args to contain token %q, got: %s", token, argString)
		}
	}
}

func TestTelepresenceService_ReplaceFlags(t *testing.T) {
	var capturedArgs []string
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			capturedArgs = args
			return "", nil
		},
	}

	svc := NewTelepresenceService(runner)
	ctx := context.Background()

	config := models.ReplaceConfig{
		Workload:       "payment-svc",
		Port:           "8000",
		Container:      "payment",
		Address:        "127.0.0.1",
		Mount:          "/tmp/mount",
		LocalMountPort: 9000,
		ToPod:          []string{"8000"},
		EnvFile:        ".env",
		EnvJSON:        "env.json",
		EnvSyntax:      "json",
		DockerMount:    "/src",
		DockerDebug:    "false",
		DockerBuild:    "./Dockerfile.dev",
		DockerBuildOpt: []string{"--build-arg ENV=dev"},
		DockerRun:      true,
		DockerArgs:     "-p 8000:8000",
		Namespace:      "payments",
	}

	_, err := svc.Replace(ctx, config)
	if err != nil {
		t.Fatalf("unexpected error from Replace: %v", err)
	}

	argString := strings.Join(capturedArgs, " ")

	expectedTokens := []string{
		"replace payment-svc",
		"--namespace payments",
		"--port 8000",
		"--container payment",
		"--address 127.0.0.1",
		"--mount /tmp/mount",
		"--local-mount-port 9000",
		"--to-pod 8000",
		"--env-file .env",
		"--env-json env.json",
		"--env-syntax json",
		"--docker-mount /src",
		"--docker-debug false",
		"--docker-build ./Dockerfile.dev",
		"--docker-build-opt --build-arg ENV=dev",
		"--docker-run",
		"-- -p 8000:8000",
	}

	for _, token := range expectedTokens {
		if !strings.Contains(argString, token) {
			t.Errorf("expected args to contain %q, got: %s", token, argString)
		}
	}
}

func TestTelepresenceService_Detach(t *testing.T) {
	var capturedArgs []string
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			capturedArgs = args
			return "", nil
		},
	}

	svc := NewTelepresenceService(runner)
	ctx := context.Background()

	config := models.DetachConfig{
		AttachmentName: "web-app",
		Namespace:      "frontend",
	}

	_, err := svc.Detach(ctx, config)
	if err != nil {
		t.Fatalf("unexpected error from Detach: %v", err)
	}

	argString := strings.Join(capturedArgs, " ")
	if !strings.Contains(argString, "detach --namespace frontend web-app") {
		t.Errorf("unexpected detach args: %s", argString)
	}
}

func TestTelepresenceService_StopAndQuitSync(t *testing.T) {
	const quitSuccess = "quit success"
	var capturedArgs []string
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			capturedArgs = args
			return quitSuccess, nil
		},
	}

	svc := NewTelepresenceService(runner)
	ctx := context.Background()

	out, err := svc.Stop(ctx)
	if err != nil || out != quitSuccess {
		t.Errorf("unexpected Stop result: out=%s, err=%v", out, err)
	}
	if strings.Join(capturedArgs, " ") != "quit" {
		t.Errorf("unexpected Stop args: %+v", capturedArgs)
	}

	outSync, err := svc.QuitSync(ctx)
	if err != nil || outSync != quitSuccess {
		t.Errorf("unexpected QuitSync result: out=%s, err=%v", outSync, err)
	}
	if strings.Join(capturedArgs, " ") != "quit -s" {
		t.Errorf("unexpected QuitSync args: %+v", capturedArgs)
	}
}

func TestTelepresenceService_ListWorkloadsResponses(t *testing.T) {
	testCases := []struct {
		name          string
		output        string
		expectedCount int
		expectErr     bool
	}{
		{
			name:          "empty output",
			output:        "",
			expectedCount: 0,
			expectErr:     false,
		},
		{
			name:          "null output",
			output:        "null",
			expectedCount: 0,
			expectErr:     false,
		},
		{
			name:          "No workloads string",
			output:        "No workloads found in namespace",
			expectedCount: 0,
			expectErr:     false,
		},
		{
			name:          "valid workload JSON array",
			output:        `[{"name":"api","namespace":"default"},{"name":"web","namespace":"default"}]`,
			expectedCount: 2,
			expectErr:     false,
		},
		{
			name:      "malformed JSON",
			output:    `{invalid json`,
			expectErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			runner := &mockRunner{
				runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
					return tc.output, nil
				},
			}
			svc := NewTelepresenceService(runner)
			ctx := context.Background()

			_, workloads, err := svc.ListWorkloadsRawNoLock(ctx)
			if tc.expectErr {
				if err == nil {
					t.Errorf("expected error for case %q, got nil", tc.name)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error for case %q: %v", tc.name, err)
				}
				if len(workloads) != tc.expectedCount {
					t.Errorf("expected %d workloads, got %d", tc.expectedCount, len(workloads))
				}
			}
		})
	}
}

func TestTelepresenceService_LockingAndTimeout(t *testing.T) {
	svc := NewTelepresenceService(&mockRunner{})
	svc.SetTimeout(10 * time.Second)

	if !svc.TryLock() {
		t.Fatal("expected TryLock to succeed on unlocked service")
	}

	if svc.TryLock() {
		t.Fatal("expected TryLock to fail on already locked service")
	}

	svc.Unlock()

	if !svc.TryLock() {
		t.Fatal("expected TryLock to succeed after Unlock")
	}
	svc.Unlock()
}
