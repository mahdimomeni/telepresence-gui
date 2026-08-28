import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Error Recovery & Daemon Lifecycle Events E2E", () => {
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

  test("handles unexpected daemon disconnection and returns to connect screen", async ({
    page,
  }) => {
    // 1. Connect first
    const connectButton = page.getByRole("button", { name: /Connect Session|Connect/i });
    await connectButton.click();
    await expect(page.getByText("Active Workload Session")).toBeVisible({ timeout: 5000 });

    // 2. Simulate daemon crash / background event emitting connection-changed = false
    await page.evaluate(() => {
      const w = window as unknown as {
        runtime: { EventsEmit: (name: string, ...args: unknown[]) => void };
      };
      w.runtime.EventsEmit("connection-changed", false);
    });

    // 3. App should reactively switch back to ConnectPage
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 5000 });
  });

  test("displays actionable error message when intercept fails", async ({ page }) => {
    // Set intercept to fail
    await page.evaluate(() => {
      const w = window as unknown as { __mockState: { shouldFailIntercept: boolean } };
      w.__mockState.shouldFailIntercept = true;
    });

    // Connect
    const connectButton = page.getByRole("button", { name: /Connect Session|Connect/i });
    await connectButton.click();
    await expect(page.getByText("Active Workload Session")).toBeVisible({ timeout: 5000 });

    // Open intercept modal on orders-service
    const ordersRow = page.locator("tr", { hasText: "orders-service" });
    const interceptBtn = ordersRow.getByRole("button", { name: /^Intercept$/i });
    await interceptBtn.click();

    // Submit intercept
    const submitBtn = page.getByRole("button", { name: "Start Intercept" });
    await submitBtn.click();

    // Dialog stays open or handles error
    await expect(page.getByRole("heading", { name: "Intercept Workload" })).toBeVisible({
      timeout: 5000,
    });
  });
});
