package services

import (
	"context"
	"testing"
)

func TestToolCheckerService_CheckTools(t *testing.T) {
	runner := &mockRunner{
		runFunc: func(ctx context.Context, name string, args ...string) (string, error) {
			if name == "telepresence" && len(args) > 0 && args[0] == "version" {
				return "Client: v2.21.3 (api v3)\nRoot Daemon: not running", nil
			}
			if name == "kubectl" && len(args) > 0 && args[0] == "version" {
				return "Client Version: v1.31.0", nil
			}
			return "", nil
		},
	}

	checker := NewToolCheckerService(runner)
	ctx := context.Background()

	report, err := checker.CheckTools(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(report.Tools) != 2 {
		t.Fatalf("expected 2 tools, got %d", len(report.Tools))
	}

	// Verify tool entries
	teleFound := false
	kubeFound := false
	for _, tool := range report.Tools {
		if tool.Name == "telepresence" {
			teleFound = true
			if tool.DocsURL == "" {
				t.Errorf("expected telepresence docsUrl to be set")
			}
		}
		if tool.Name == "kubectl" {
			kubeFound = true
			if tool.DocsURL == "" {
				t.Errorf("expected kubectl docsUrl to be set")
			}
		}
	}

	if !teleFound {
		t.Errorf("telepresence tool not found in report")
	}
	if !kubeFound {
		t.Errorf("kubectl tool not found in report")
	}
}
