package models

import (
	"encoding/json"
	"testing"
)

func TestWorkloadAndInterceptInfoSerialization(t *testing.T) {
	workload := Workload{
		Name:                   "orders-api",
		Namespace:              "production",
		WorkloadResourceType:   "Deployment",
		UID:                    "uid-999",
		DesiredReplicas:        3,
		ReadyReplicas:          3,
		AgentVersion:           "v2.30.0",
		NotInterceptableReason: "",
		InterceptInfo: []InterceptInfo{
			{
				ID: "intercept-abc",
				Spec: InterceptSpec{
					Name:           "orders-api",
					Client:         "developer-laptop",
					Agent:          "orders-api",
					WorkloadKind:   "Deployment",
					Namespace:      "production",
					Mechanism:      "tcp",
					TargetHost:     "127.0.0.1",
					PortIdentifier: "8080",
					ServicePort:    8080,
					ContainerPort:  8080,
					TargetPort:     8080,
					Replace:        false,
				},
				ClientSession: ClientSession{
					SessionID: "sess-1",
					InstallID: "inst-1",
				},
				Disposition: 1,
				PodName:     "orders-api-pod-1",
				PodIP:       "10.244.1.20",
				Environment: map[string]string{
					"DB_HOST": "postgres.production",
				},
				ModifiedAt: Timestamp{
					Seconds: 1700000000,
					Nanos:   123456,
				},
			},
		},
	}

	data, err := json.Marshal(workload)
	if err != nil {
		t.Fatalf("failed to marshal Workload: %v", err)
	}

	var parsed Workload
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal Workload: %v", err)
	}

	if parsed.Name != "orders-api" || parsed.DesiredReplicas != 3 || len(parsed.InterceptInfo) != 1 {
		t.Errorf("unmarshaled workload does not match: %+v", parsed)
	}

	if parsed.InterceptInfo[0].Spec.TargetHost != "127.0.0.1" || parsed.InterceptInfo[0].Environment["DB_HOST"] != "postgres.production" {
		t.Errorf("unmarshaled intercept info does not match: %+v", parsed.InterceptInfo[0])
	}
}

func TestTelepresenceStatusOutputSerialization(t *testing.T) {
	jsonRaw := `{
		"user_daemon": {
			"running": true,
			"status": "Connected",
			"kubernetes_context": "k8s-prod",
			"namespace": "default",
			"manager_namespace": "ambassador"
		},
		"root_daemon": {
			"running": true,
			"name": "Root Daemon",
			"version": "v2.21.3"
		},
		"traffic_manager": {
			"name": "Traffic Manager",
			"version": "v2.21.3"
		}
	}`

	var status TelepresenceStatusOutput
	if err := json.Unmarshal([]byte(jsonRaw), &status); err != nil {
		t.Fatalf("failed to unmarshal TelepresenceStatusOutput: %v", err)
	}

	if !status.UserDaemon.Running || status.UserDaemon.Status != "Connected" {
		t.Errorf("unexpected user daemon status: %+v", status.UserDaemon)
	}
	if !status.RootDaemon.Running || status.RootDaemon.Version != "v2.21.3" {
		t.Errorf("unexpected root daemon status: %+v", status.RootDaemon)
	}
}
