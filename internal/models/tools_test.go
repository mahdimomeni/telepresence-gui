package models

import (
	"encoding/json"
	"testing"
)

func TestSystemToolsReportSerialization(t *testing.T) {
	report := SystemToolsReport{
		AllInstalled: false,
		MissingCount: 1,
		Tools: []ToolCheckResult{
			{
				Name:        "telepresence",
				DisplayName: "Telepresence CLI",
				Description: "Telepresence CLI tool",
				Required:    true,
				Installed:   true,
				Version:     "v2.21.3",
				Path:        "/usr/local/bin/telepresence",
				DocsURL:     "https://www.telepresence.io/docs/quick-start",
			},
			{
				Name:        "kubectl",
				DisplayName: "Kubernetes CLI",
				Description: "Kubernetes CLI tool",
				Required:    true,
				Installed:   false,
				Error:       "executable not found in PATH",
				DocsURL:     "https://kubernetes.io/docs/tasks/tools/",
			},
		},
	}

	data, err := json.Marshal(report)
	if err != nil {
		t.Fatalf("failed to marshal SystemToolsReport: %v", err)
	}

	var parsed SystemToolsReport
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal SystemToolsReport: %v", err)
	}

	if parsed.AllInstalled || parsed.MissingCount != 1 || len(parsed.Tools) != 2 {
		t.Errorf("unmarshaled SystemToolsReport mismatch: %+v", parsed)
	}
	if parsed.Tools[0].Version != "v2.21.3" || parsed.Tools[1].Error != "executable not found in PATH" {
		t.Errorf("unmarshaled tools mismatch: %+v", parsed.Tools)
	}
}
