package services

import (
	"context"
	"testing"
	"time"

	"github.com/telepresenceio/telepresence/rpc/v2/connector"
	"github.com/telepresenceio/telepresence/rpc/v2/manager"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type mockRunner struct {
	runFunc func(ctx context.Context, name string, args ...string) (string, error)
}

func (m *mockRunner) Run(ctx context.Context, name string, args ...string) (string, error) {
	if m.runFunc != nil {
		return m.runFunc(ctx, name, args...)
	}
	return "", nil
}

func TestLocatePossibleSockets(t *testing.T) {
	client := NewTelepresenceGRPCClient()
	sockets := client.LocatePossibleSockets()

	if len(sockets) == 0 {
		t.Errorf("expected non-empty list of candidate socket paths")
	}
}

func TestConvertProtoSnapshot(t *testing.T) {
	snapshot := &connector.WorkloadInfoSnapshot{
		Workloads: []*connector.WorkloadInfo{
			{
				Name:                   "test-service",
				Namespace:              "test-ns",
				WorkloadResourceType:   "Deployment",
				Uid:                    "uid-12345",
				DesiredReplicas:        2,
				ReadyReplicas:          2,
				AgentVersion:           "v2.31.2",
				NotInterceptableReason: "",
				InterceptInfo: []*manager.InterceptInfo{
					{
						Id: "intercept-1",
						Spec: &manager.InterceptSpec{
							Name:           "test-service",
							Namespace:      "test-ns",
							TargetHost:     "127.0.0.1",
							PortIdentifier: "8080",
							TargetPort:     8080,
						},
						Disposition: manager.InterceptDispositionType_ACTIVE,
						PodName:     "test-service-pod-xyz",
						PodIp:       "10.244.0.5",
						ModifiedAt: &timestamppb.Timestamp{
							Seconds: 1700000000,
							Nanos:   500,
						},
					},
				},
			},
		},
	}

	workloads := ConvertProtoSnapshot(snapshot)
	if len(workloads) != 1 {
		t.Fatalf("expected 1 workload, got %d", len(workloads))
	}

	wl := workloads[0]
	if wl.Name != "test-service" || wl.Namespace != "test-ns" {
		t.Errorf("unexpected workload name or namespace: %+v", wl)
	}
	if wl.DesiredReplicas != 2 || wl.ReadyReplicas != 2 {
		t.Errorf("unexpected replica count: %+v", wl)
	}
	if len(wl.InterceptInfo) != 1 {
		t.Fatalf("expected 1 intercept info, got %d", len(wl.InterceptInfo))
	}

	ic := wl.InterceptInfo[0]
	if ic.ID != "intercept-1" || ic.PodName != "test-service-pod-xyz" || ic.PodIP != "10.244.0.5" {
		t.Errorf("unexpected intercept info fields: %+v", ic)
	}
	if ic.Spec.TargetHost != "127.0.0.1" || ic.Spec.TargetPort != 8080 {
		t.Errorf("unexpected intercept spec: %+v", ic.Spec)
	}
	if ic.ModifiedAt.Seconds != 1700000000 || ic.ModifiedAt.Nanos != 500 {
		t.Errorf("unexpected timestamp: %+v", ic.ModifiedAt)
	}
}

func TestTelepresenceServiceFallback(t *testing.T) {
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			if len(args) > 0 && args[0] == "status" {
				return `{"user_daemon":{"running":false,"status":"Not running"},"root_daemon":{"running":true,"version":"v2.31.2"}}`, nil
			}
			if len(args) > 0 && args[0] == "list" {
				return `[{"name":"mock-workload","namespace":"default"}]`, nil
			}
			return "", nil
		},
	}

	svc := NewTelepresenceService(runner)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, status, err := svc.Status(ctx)
	if err != nil {
		t.Fatalf("status failed: %v", err)
	}
	if status == nil || status.RootDaemon.Version != "v2.31.2" {
		t.Errorf("unexpected status fallback result: %+v", status)
	}

	workloads, err := svc.ListWorkloads(ctx)
	if err != nil {
		t.Fatalf("list workloads failed: %v", err)
	}
	if len(workloads) != 1 || workloads[0].Name != "mock-workload" {
		t.Errorf("unexpected workload list fallback result: %+v", workloads)
	}
}
