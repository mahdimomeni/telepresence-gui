import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("Workload Management & Data Table E2E", () => {
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

  test("renders workload table with status badges and replicas", async ({ page }) => {
    await expect(page.getByText("orders-service")).toBeVisible();
    await expect(page.getByText("payment-gateway")).toBeVisible();
    await expect(page.getByText("inventory-cache")).toBeVisible();

    // Check Intercepted badge on payment-gateway
    const interceptedBadge = page.locator("span", { hasText: /Intercepted/i }).first();
    await expect(interceptedBadge).toBeVisible();
  });

  test("filters workloads by search query", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search workloads by name/i);
    await expect(searchInput).toBeVisible();

    // Filter for "payment"
    await searchInput.fill("payment");
    await expect(page.getByText("payment-gateway")).toBeVisible();
    await expect(page.getByText("orders-service")).not.toBeVisible();
    await expect(page.getByText("inventory-cache")).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await expect(page.getByText("orders-service")).toBeVisible();
  });

  test("expands workload row to reveal intercept routing spec", async ({ page }) => {
    // Locate the row for payment-gateway which has active intercept
    const paymentRow = page.locator("tr", { hasText: "payment-gateway" });
    await expect(paymentRow).toBeVisible();

    // Click expand button inside the row
    const expandBtn = paymentRow.locator('button[title*="Expand routing summary"]').first();
    await expandBtn.click();

    // Check routing details rendered in expanded row
    await expect(page.getByText(/Active Traffic Interception/i)).toBeVisible();
    await expect(page.getByText("127.0.0.1:8080")).toBeVisible();
  });
});
