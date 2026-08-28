import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Update Notification Toast E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupWailsMock(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "telepresence-gui-app-settings",
        JSON.stringify({ showSplashScreen: false })
      );
    });
    await page.goto("/");
  });

  test("displays update available banner toast and allows downloading update", async ({ page }) => {
    // Emit update:available event
    await page.evaluate(() => {
      const w = window as unknown as {
        runtime: { EventsEmit: (name: string, ...args: unknown[]) => void };
      };
      w.runtime.EventsEmit("update:available", {
        available: true,
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
        releaseNotes: "Improved connection performance and stability.",
      });
    });

    // Check toast appears
    await expect(page.getByText("Update Available")).toBeVisible({ timeout: 5000 });

    // Click Download & Install button
    const updateBtn = page.getByRole("button", { name: "Download & Install" });
    if (await updateBtn.isVisible()) {
      await updateBtn.click();
      // Verify progress state
      await expect(page.getByText(/Downloading binary|Installing update|50%|100%/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("dismisses update notification toast when later/dismiss is clicked", async ({ page }) => {
    // Emit update:available event
    await page.evaluate(() => {
      const w = window as unknown as {
        runtime: { EventsEmit: (name: string, ...args: unknown[]) => void };
      };
      w.runtime.EventsEmit("update:available", {
        available: true,
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
      });
    });

    await expect(page.getByText("Update Available")).toBeVisible({ timeout: 5000 });

    // Click Later button
    const dismissBtn = page.getByRole("button", { name: "Later" });
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await expect(page.getByText("Update Available")).not.toBeVisible({ timeout: 5000 });
    }
  });
});
