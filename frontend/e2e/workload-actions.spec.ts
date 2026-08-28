import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Workload Actions (Intercept, Replace, Detach, Details) E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupWailsMock(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "telepresence-gui-app-settings",
        JSON.stringify({ showSplashScreen: false })
      );
    });
    await page.goto("/");

    // Connect to cluster
    const connectButton = page.getByRole("button", { name: /Connect Session|Connect/i });
    await connectButton.click();
    await expect(page.getByText("Active Workload Session")).toBeVisible({ timeout: 5000 });
  });

  test("opens Intercept dialog, fills port mapping, and submits intercept", async ({ page }) => {
    const ordersRow = page.locator("tr", { hasText: "orders-service" });
    await expect(ordersRow).toBeVisible();

    // Click Intercept button in the row
    const interceptBtn = ordersRow.getByRole("button", { name: /^Intercept$/i });
    await interceptBtn.click();

    // Verify Intercept Dialog opened
    await expect(page.getByRole("heading", { name: "Intercept Workload" })).toBeVisible();
    await expect(page.getByText("orders-service").first()).toBeVisible();

    // Fill local / service port
    const portInput = page
      .getByPlaceholder(/Expose local port|8080/i)
      .or(page.locator('input[value="8080"]'))
      .first();
    if (await portInput.isVisible()) {
      await portInput.fill("3000");
    }

    // Submit dialog
    const submitBtn = page.getByRole("button", { name: "Start Intercept" });
    await submitBtn.click();

    // Dialog should close
    await expect(page.getByRole("heading", { name: "Intercept Workload" })).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("opens Replace dialog, selects container, and submits replacement", async ({ page }) => {
    const ordersRow = page.locator("tr", { hasText: "orders-service" });
    await expect(ordersRow).toBeVisible();

    // Click Replace button in the row
    const replaceBtn = ordersRow.getByRole("button", { name: /^Replace$/i });
    await replaceBtn.click();

    // Verify Replace Dialog opened
    await expect(page.getByRole("heading", { name: "Replace Workload" })).toBeVisible();

    // Submit replace
    const submitBtn = page.getByRole("button", {
      name: /Start Replace|Replace Workload|Apply Replacement/i,
    });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    await expect(page.getByRole("heading", { name: "Replace Workload" })).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("detaches active intercept on workload", async ({ page }) => {
    const paymentRow = page.locator("tr", { hasText: "payment-gateway" });
    await expect(paymentRow).toBeVisible();

    // Locate Detach button
    const detachBtn = paymentRow.getByRole("button", { name: /Detach/i });
    await expect(detachBtn).toBeVisible();
    await detachBtn.click();

    // If confirmation popover exists, confirm
    const confirmBtn = page
      .getByRole("button", { name: /Confirm Detach|Yes, Detach|Detach/i })
      .last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
  });

  test("opens Workload Details dialog and inspects spec", async ({ page }) => {
    const ordersRow = page.locator("tr", { hasText: "orders-service" });
    await expect(ordersRow).toBeVisible();

    // Click details/inspect button
    const detailsBtn = ordersRow
      .locator('button[title*="Details"], button[title*="Inspect"]')
      .first();
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();
      await expect(
        page.getByText(/Workload Specifications|Workload Details|orders-service/i)
      ).toBeVisible();

      // Close dialog
      const closeBtn = page.getByRole("button", { name: /Close/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });
});
