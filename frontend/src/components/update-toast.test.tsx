import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdateToast } from "./update-toast";
import { UpdateService, type UpdateInfo } from "@/services/update";

describe("UpdateToast component", () => {
  let triggerUpdateAvailable: (info: UpdateInfo) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(UpdateService, "onUpdateAvailable").mockImplementation(cb => {
      triggerUpdateAvailable = cb;
      return () => {};
    });
    vi.spyOn(UpdateService, "onProgress").mockImplementation(() => () => {});
    vi.spyOn(UpdateService, "downloadAndInstall").mockResolvedValue(undefined);
  });

  it("should not render when no update is available", () => {
    const { container } = render(<UpdateToast />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render when update:available event is emitted", () => {
    render(<UpdateToast />);

    act(() => {
      triggerUpdateAvailable({
        available: true,
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
      });
    });

    expect(screen.getByText("Update Available")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("1.1.0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download & install/i })).toBeInTheDocument();
  });

  it("should dismiss toast when Later button is clicked", async () => {
    const user = userEvent.setup();
    render(<UpdateToast />);

    act(() => {
      triggerUpdateAvailable({
        available: true,
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
      });
    });

    const laterBtn = screen.getByRole("button", { name: "Later" });
    await user.click(laterBtn);

    expect(screen.queryByText("Update Available")).not.toBeInTheDocument();
  });

  it("should trigger downloadAndInstall when download button is clicked", async () => {
    const user = userEvent.setup();
    render(<UpdateToast />);

    act(() => {
      triggerUpdateAvailable({
        available: true,
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
      });
    });

    const downloadBtn = screen.getByRole("button", { name: /download & install/i });
    await user.click(downloadBtn);

    expect(UpdateService.downloadAndInstall).toHaveBeenCalled();
  });
});
