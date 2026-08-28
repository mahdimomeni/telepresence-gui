package cli

import (
	"context"
	"os/exec"
	"testing"
	"time"
)

func TestCommandRunner_Run(t *testing.T) {
	runner := NewCommandRunner()
	if runner == nil {
		t.Fatal("expected non-nil runner")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Test a simple command that exists across systems (e.g. go or echo)
	goPath, err := exec.LookPath("go")
	if err == nil && goPath != "" {
		out, err := runner.Run(ctx, "go", "version")
		if err != nil {
			t.Fatalf("failed to run 'go version': %v", err)
		}
		if out == "" {
			t.Error("expected non-empty output from 'go version'")
		}
	}

	// Test non-existent binary returns error
	_, err = runner.Run(ctx, "non_existent_binary_12345")
	if err == nil {
		t.Error("expected error when running non-existent binary, got nil")
	}
}
