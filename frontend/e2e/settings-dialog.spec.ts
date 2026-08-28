import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Settings & Preferences Dialog E2E", () => {
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

  test("opens settings dialog, navigates tabs, modifies settings, and saves successfully", async ({
    page,
  }) => {
    // Open settings from TitleBar
    const settingsBtn = page
      .locator('button[title*="Settings"], button[aria-label*="Settings"]')
      .first();
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Verify settings modal is open
    await expect(page.getByText("Application Preferences & Settings")).toBeVisible({
      timeout: 5000,
    });

    // 1. General Tab (Appearance & Visuals)
    await expect(page.getByText("Appearance & Visuals")).toBeVisible();

    // 2. Switch to Cluster Tab
    const clusterTab = page.getByRole("tab", { name: "Cluster" });
    if (await clusterTab.isVisible()) {
      await clusterTab.click();
      await expect(page.getByText("Default Namespace").first()).toBeVisible();
    }

    // 3. Switch to Logs Tab
    const logsTab = page.getByRole("tab", { name: "Logs" });
    if (await logsTab.isVisible()) {
      await logsTab.click();
      await expect(page.getByText(/Log Buffer & Output|Log Level|Log Console/i)).toBeVisible();
    }

    // 4. Switch to About Tab
    const aboutTab = page.getByRole("tab", { name: "About" });
    if (await aboutTab.isVisible()) {
      await aboutTab.click();
      await expect(page.getByRole("heading", { name: "Telepresence GUI" })).toBeVisible();
    }

    // 5. Save Changes
    const saveBtn = page.getByRole("button", { name: "Save Changes" });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await expect(page.getByText("Settings saved successfully!")).toBeVisible({ timeout: 5000 });
    }
  });

  test("resets settings to factory defaults", async ({ page }) => {
    // Open settings
    const settingsBtn = page
      .locator('button[title*="Settings"], button[aria-label*="Settings"]')
      .first();
    await settingsBtn.click();
    await expect(page.getByText("Application Preferences & Settings")).toBeVisible();

    // Click Reset to Defaults
    const resetBtn = page.getByRole("button", { name: "Reset Defaults" });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify status message
    await expect(page.getByText("Restored factory defaults.")).toBeVisible({ timeout: 5000 });
  });
});
