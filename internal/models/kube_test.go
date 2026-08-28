package models

import (
	"encoding/json"
	"testing"
)

func TestKubeInfoSerialization(t *testing.T) {
	info := KubeInfo{
		CurrentContext: "gke_project_us-central1_cluster-1",
		Contexts:       []string{"gke_project_us-central1_cluster-1", "minikube"},
		Namespace:      "staging",
		KubeconfigPath: "/home/user/.kube/config",
		SavedConfig: &ConnectConfig{
			Namespace: "staging",
			Context:   "gke_project_us-central1_cluster-1",
		},
	}

	data, err := json.Marshal(info)
	if err != nil {
		t.Fatalf("failed to marshal KubeInfo: %v", err)
	}

	var parsed KubeInfo
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal KubeInfo: %v", err)
	}

	if parsed.CurrentContext != "gke_project_us-central1_cluster-1" || len(parsed.Contexts) != 2 || parsed.Namespace != "staging" {
		t.Errorf("unmarshaled KubeInfo mismatch: %+v", parsed)
	}
	if parsed.SavedConfig == nil || parsed.SavedConfig.Namespace != "staging" {
		t.Errorf("unmarshaled SavedConfig mismatch: %+v", parsed.SavedConfig)
	}
}
