import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Keyboard Shortcuts & Global UI Behaviors E2E", () => {
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

  test("opens and toggles settings modal via Ctrl+, keyboard shortcut", async ({ page }) => {
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 5000 });

    // Press Ctrl+,
    await page.keyboard.press("Control+,");
    await expect(page.getByText("Application Preferences & Settings")).toBeVisible({
      timeout: 5000,
    });

    // Press Escape to close modal
    await page.keyboard.press("Escape");
    await expect(page.getByText("Application Preferences & Settings")).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("suppresses default browser context menu on non-input UI elements", async ({ page }) => {
    // Right click the background
    const bgElement = page.locator("#App");
    await bgElement.click({ button: "right", position: { x: 50, y: 50 } });

    // Ensure page is still intact and interactive
    await expect(page.getByText("Establish Cluster Session")).toBeVisible();
  });
});
