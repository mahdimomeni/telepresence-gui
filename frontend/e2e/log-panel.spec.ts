import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Log Console & Live Stream Panel E2E", () => {
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

  test("toggles log drawer from title bar and streams logs dynamically", async ({ page }) => {
    // Open log panel
    const logToggleBtn = page.locator('button[title*="Logs"], button[aria-label*="Logs"]').first();
    await expect(logToggleBtn).toBeVisible();
    await logToggleBtn.click();

    // Verify log drawer is visible
    await expect(page.getByText("Telepresence Console & Daemon Logs")).toBeVisible();

    // Emit live daemon log event
    await page.evaluate(() => {
      const w = window as unknown as {
        runtime: { EventsEmit: (name: string, ...args: unknown[]) => void };
      };
      w.runtime.EventsEmit("daemon-log", "[E2E Test] Daemon tunnel initialized on port 8080");
    });

    // Check log appears in panel
    await expect(page.getByText(/Daemon tunnel initialized on port 8080/i)).toBeVisible({
      timeout: 5000,
    });

    // Filter logs using search input
    const searchInput = page.getByPlaceholder(/Filter logs/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("Daemon tunnel");
      await expect(page.getByText(/Daemon tunnel initialized on port 8080/i)).toBeVisible();

      await searchInput.fill("nonexistent-string-query");
      await expect(page.getByText(/Daemon tunnel initialized on port 8080/i)).not.toBeVisible();
    }

    // Close log panel
    const closeBtn = page.locator('button[title="Close Console"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test("filters logs by log level buttons", async ({ page }) => {
    // Open log panel
    const logToggleBtn = page.locator('button[title*="Logs"], button[aria-label*="Logs"]').first();
    await logToggleBtn.click();

    // Emit error and info logs
    await page.evaluate(() => {
      const w = window as unknown as {
        runtime: { EventsEmit: (name: string, ...args: unknown[]) => void };
      };
      w.runtime.EventsEmit("daemon-log", "[ERROR] Critical connector failure detected");
      w.runtime.EventsEmit("daemon-log", "[INFO] Connector normal heartbeat ping");
    });

    await expect(page.getByText(/Critical connector failure detected/i)).toBeVisible();
    await expect(page.getByText(/Connector normal heartbeat ping/i)).toBeVisible();

    // Click "ERROR" filter tab/button
    const errorFilterBtn = page
      .getByRole("tab", { name: /^Error$/i })
      .or(page.getByRole("button", { name: /^Error$/i }))
      .first();
    if (await errorFilterBtn.isVisible()) {
      await errorFilterBtn.click();
      await expect(page.getByText(/Critical connector failure detected/i)).toBeVisible();
      await expect(page.getByText(/Connector normal heartbeat ping/i)).not.toBeVisible();
    }
  });
});
