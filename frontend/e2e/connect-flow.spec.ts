import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Cluster Connection Flow E2E", () => {
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

  test("completes full connect and disconnect lifecycle", async ({ page }) => {
    // 1. Verify Connect Page is displayed
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 5000 });

    // 2. Select Context / Namespace
    const namespaceInput = page.getByPlaceholder(/namespace|e.g. default/i).first();
    if (await namespaceInput.isVisible()) {
      await namespaceInput.fill("ecommerce");
    }

    // 3. Click Connect Button
    const connectButton = page.getByRole("button", { name: /Connect Session|Connect/i });
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // 4. Verify transition to List Page (Active Session)
    await expect(page.getByText("Active Workload Session")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("orders-service")).toBeVisible();
    await expect(page.getByText("payment-gateway")).toBeVisible();

    // 5. Click Disconnect Button in session header
    const disconnectButton = page.getByRole("button", { name: /Disconnect Session|Disconnect/i });
    await expect(disconnectButton).toBeVisible();
    await disconnectButton.click();

    // 6. Verify return to Connect Page
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 5000 });
  });

  test("displays error toast alert when connection fails", async ({ page }) => {
    // Set mock to fail connection
    await page.evaluate(() => {
      const w = window as unknown as { __mockState: { shouldFailConnect: boolean } };
      w.__mockState.shouldFailConnect = true;
    });

    const connectButton = page.getByRole("button", { name: /Connect Session|Connect/i });
    await connectButton.click();

    // Verify error toast appears
    await expect(
      page.getByText(/Daemon failed to establish tunnel connection|Failed to connect/i)
    ).toBeVisible({ timeout: 5000 });
    // Still on Connect Page
    await expect(page.getByText("Establish Cluster Session")).toBeVisible();
  });
});
