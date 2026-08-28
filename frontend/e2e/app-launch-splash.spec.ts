import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("App Launch & Splash Screen E2E", () => {
  test("shows splash screen on startup when enabled and allows skipping/entering", async ({
    page,
  }) => {
    await setupWailsMock(page, {
      settings: {
        theme: "dark",
        enableGlowEffects: true,
        showSplashScreen: true,
        closeToTray: true,
        startMinimized: false,
        enableNotifications: true,
        notifyOnConnect: true,
        notifyOnIntercept: true,
        autoCheckUpdates: false,
        defaultNamespace: "default",
        defaultKubeconfig: "",
        defaultContext: "",
        managerNamespace: "",
        requestTimeoutSeconds: 60,
        pollIntervalSeconds: 4,
        dockerDaemonMode: false,
        disableCompression: false,
        insecureSkipTLS: false,
        maxLogLines: 2000,
        autoScrollLogs: true,
        wrapLogLines: true,
        defaultLogLevel: "all",
      },
    });

    await page.goto("/");

    // Splash Screen should be visible
    const splash = page.locator("#telepresence-splash");
    await expect(splash).toBeVisible({ timeout: 5000 });
    await expect(splash).toContainText("TELEPRESENCE");

    // Click "Skip Boot"
    const skipBtn = page.getByRole("button", { name: /Skip Boot|Skip/i });
    if (await skipBtn.isVisible()) {
      await skipBtn.click({ force: true }).catch(() => {});
    }

    // Splash screen should disappear, main view should appear
    await expect(splash).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 6000 });
  });

  test("skips splash screen immediately when showSplashScreen setting is false", async ({
    page,
  }) => {
    await setupWailsMock(page, {
      settings: {
        theme: "dark",
        enableGlowEffects: true,
        showSplashScreen: false,
        closeToTray: true,
        startMinimized: false,
        enableNotifications: true,
        notifyOnConnect: true,
        notifyOnIntercept: true,
        autoCheckUpdates: false,
        defaultNamespace: "default",
        defaultKubeconfig: "",
        defaultContext: "",
        managerNamespace: "",
        requestTimeoutSeconds: 60,
        pollIntervalSeconds: 4,
        dockerDaemonMode: false,
        disableCompression: false,
        insecureSkipTLS: false,
        maxLogLines: 2000,
        autoScrollLogs: true,
        wrapLogLines: true,
        defaultLogLevel: "all",
      },
    });

    // Set localStorage flag as well
    await page.addInitScript(() => {
      localStorage.setItem(
        "telepresence-gui-app-settings",
        JSON.stringify({ showSplashScreen: false })
      );
    });

    await page.goto("/");

    // Main connect page should be visible without splash blocking
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#telepresence-splash")).not.toBeVisible();
  });

  test("allows replaying splash screen from title bar", async ({ page }) => {
    await setupWailsMock(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "telepresence-gui-app-settings",
        JSON.stringify({ showSplashScreen: false })
      );
    });

    await page.goto("/");
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 5000 });

    // Click replay splash branding in title bar
    const replayBtn = page.locator('div[title*="Click to replay boot sequence"]').first();
    await expect(replayBtn).toBeVisible();
    await replayBtn.click();

    // Splash screen should appear again
    const splash = page.locator("#telepresence-splash");
    await expect(splash).toBeVisible({ timeout: 3000 });

    // Skip it
    const skipBtn = page.getByRole("button", { name: /Skip Boot|Skip/i });
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }
    await expect(splash).not.toBeVisible({ timeout: 5000 });
  });
});
