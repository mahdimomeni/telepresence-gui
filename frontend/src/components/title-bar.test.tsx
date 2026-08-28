import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TitleBar } from "./title-bar";
import { ThemeProvider } from "./theme-provider";
import { models } from "@/../wailsjs/go/models";

describe("TitleBar component", () => {
  it("should render branding and window control buttons", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TitleBar isConnected={false} isLogsOpen={false} onToggleLogs={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText("Telepresence")).toBeInTheDocument();
    expect(screen.getByText("GUI")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minimize Window" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maximize Window" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close to System Tray" })).toBeInTheDocument();
  });

  it("should display Active Session badge when connected", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TitleBar isConnected={true} isLogsOpen={false} onToggleLogs={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText("Active Session")).toBeInTheDocument();
  });

  it("should display Prerequisites Missing badge when tools are missing", () => {
    const mockReport = new models.SystemToolsReport({
      allInstalled: false,
      missingCount: 1,
      tools: [],
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <TitleBar
          isConnected={false}
          report={mockReport}
          isLogsOpen={false}
          onToggleLogs={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Prerequisites Missing")).toBeInTheDocument();
  });

  it("should trigger onToggleLogs when Logs button is clicked", async () => {
    const handleToggleLogs = vi.fn();
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="dark">
        <TitleBar isConnected={false} isLogsOpen={false} onToggleLogs={handleToggleLogs} />
      </ThemeProvider>
    );

    const logsBtn = screen.getByRole("button", { name: /logs/i });
    await user.click(logsBtn);

    expect(handleToggleLogs).toHaveBeenCalledTimes(1);
  });

  it("should trigger onOpenSettings when Settings button is clicked", async () => {
    const handleOpenSettings = vi.fn();
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="dark">
        <TitleBar
          isConnected={false}
          isLogsOpen={false}
          onToggleLogs={vi.fn()}
          onOpenSettings={handleOpenSettings}
        />
      </ThemeProvider>
    );

    const settingsBtn = screen.getByRole("button", { name: /settings/i });
    await user.click(settingsBtn);

    expect(handleOpenSettings).toHaveBeenCalledTimes(1);
  });
});
