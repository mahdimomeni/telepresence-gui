package services

import (
	"context"
	"os"
	"testing"
)

func TestToolCheckerService_CheckTools(t *testing.T) {
	runner := &mockRunner{
		runFunc: func(_ context.Context, name string, args ...string) (string, error) {
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
	checker.SetLookPathFunc(func(file string) (string, error) {
		return "/usr/local/bin/" + file, nil
	})
	ctx := context.Background()

	report, err := checker.CheckTools(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !report.AllInstalled || report.MissingCount != 0 {
		t.Errorf("expected all installed, got %+v", report)
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
			if !tool.Installed || tool.Path != "/usr/local/bin/telepresence" {
				t.Errorf("unexpected telepresence result: %+v", tool)
			}
		}
		if tool.Name == "kubectl" {
			kubeFound = true
			if tool.DocsURL == "" {
				t.Errorf("expected kubectl docsUrl to be set")
			}
			if !tool.Installed || tool.Path != "/usr/local/bin/kubectl" {
				t.Errorf("unexpected kubectl result: %+v", tool)
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

func TestToolCheckerService_CheckTools_MissingTools(t *testing.T) {
	runner := &mockRunner{}
	checker := NewToolCheckerService(runner)
	checker.SetLookPathFunc(func(file string) (string, error) {
		if file == "telepresence" {
			return "", os.ErrNotExist
		}
		return "/usr/bin/kubectl", nil
	})

	report, err := checker.CheckTools(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if report.AllInstalled || report.MissingCount != 1 {
		t.Errorf("expected 1 missing tool, got %+v", report)
	}
}
