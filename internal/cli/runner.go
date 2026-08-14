package cli

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
)

type Runner interface {
	Run(ctx context.Context, name string, args ...string) (string, error)
}

type CommandRunner struct{}

func NewCommandRunner() *CommandRunner {
	return &CommandRunner{}
}

func (r *CommandRunner) Run(ctx context.Context, name string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.SysProcAttr = getSysProcAttr()

	output, err := cmd.CombinedOutput()
	strOut := strings.TrimSpace(string(output))
	if err != nil {
		return strOut, fmt.Errorf("%w: %s", err, strOut)
	}
	return strOut, nil
}
