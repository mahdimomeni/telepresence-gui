import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MissingToolsView } from "./missing-tools-view";
import { models } from "@/../wailsjs/go/models";

describe("MissingToolsView component", () => {
  const mockReport = new models.SystemToolsReport({
    allInstalled: false,
    missingCount: 1,
    tools: [
      new models.ToolCheckResult({
        name: "telepresence",
        displayName: "Telepresence CLI",
        description: "Fast, realistic local development for Kubernetes",
        required: true,
        installed: true,
        version: "v2.21.3",
        docsUrl: "https://www.telepresence.io",
      }),
      new models.ToolCheckResult({
        name: "kubectl",
        displayName: "Kubernetes CLI",
        description: "The Kubernetes command-line tool",
        required: true,
        installed: false,
        error: "executable not found in PATH",
        docsUrl: "https://kubernetes.io",
      }),
    ],
  });

  it("should render missing tools information and counts", () => {
    render(<MissingToolsView report={mockReport} isChecking={false} onRecheck={vi.fn()} />);

    expect(screen.getByText("Required System Tools Missing")).toBeInTheDocument();
    expect(screen.getByText("1 Missing")).toBeInTheDocument();
    expect(screen.getByText("Telepresence CLI")).toBeInTheDocument();
    expect(screen.getByText("Kubernetes CLI")).toBeInTheDocument();
    expect(screen.getByText("Not Found in PATH")).toBeInTheDocument();
  });

  it("should trigger onRecheck when re-check button is clicked", async () => {
    const handleRecheck = vi.fn();
    const user = userEvent.setup();

    render(<MissingToolsView report={mockReport} isChecking={false} onRecheck={handleRecheck} />);

    const button = screen.getByRole("button", { name: /re-check system tools/i });
    await user.click(button);

    expect(handleRecheck).toHaveBeenCalledTimes(1);
  });

  it("should display loading spinner when isChecking is true", () => {
    render(<MissingToolsView report={mockReport} isChecking={true} onRecheck={vi.fn()} />);

    expect(screen.getByText("Checking System...")).toBeInTheDocument();
  });
});
