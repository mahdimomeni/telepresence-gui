import { test, expect, setupWailsMock } from "./fixtures/wails-mock-bridge";

test.describe("System Tools Checker E2E", () => {
  test("displays missing tools alert view when tools are not found", async ({ page }) => {
    await setupWailsMock(page, {
      toolsReport: {
        allInstalled: false,
        missingCount: 2,
        tools: [
          {
            name: "telepresence",
            displayName: "Telepresence CLI",
            description: "Connects local workstation to cluster",
            required: true,
            installed: false,
            docsUrl: "https://www.telepresence.io/docs/quick-start",
          },
          {
            name: "kubectl",
            displayName: "Kubernetes CLI",
            description: "Kubernetes control CLI",
            required: true,
            installed: false,
            docsUrl: "https://kubernetes.io/docs/tasks/tools/",
          },
        ],
      },
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        "telepresence-gui-app-settings",
        JSON.stringify({ showSplashScreen: false })
      );
    });

    await page.goto("/");

    // Verify Missing Tools UI
    await expect(page.getByText("Required System Tools Missing")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Telepresence CLI")).toBeVisible();
    await expect(page.getByText("Kubernetes CLI")).toBeVisible();

    const recheckBtn = page.getByRole("button", { name: /Re-check System Tools/i });
    await expect(recheckBtn).toBeVisible();
  });

  test("transitions to connect page when re-check detects installed tools", async ({ page }) => {
    await setupWailsMock(page, {
      toolsReport: {
        allInstalled: false,
        missingCount: 1,
        tools: [
          {
            name: "telepresence",
            displayName: "Telepresence CLI",
            required: true,
            installed: false,
            docsUrl: "https://www.telepresence.io/docs/quick-start",
          },
        ],
      },
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        "telepresence-gui-app-settings",
        JSON.stringify({ showSplashScreen: false })
      );
    });

    await page.goto("/");
    await expect(page.getByText("Required System Tools Missing")).toBeVisible({ timeout: 5000 });

    // Update state to installed tools
    await page.evaluate(() => {
      const w = window as unknown as {
        __mockState: {
          toolsReport: {
            allInstalled: boolean;
            missingCount: number;
            tools: Array<{
              name: string;
              displayName: string;
              required: boolean;
              installed: boolean;
              version?: string;
            }>;
          };
        };
      };
      w.__mockState.toolsReport = {
        allInstalled: true,
        missingCount: 0,
        tools: [
          {
            name: "telepresence",
            displayName: "Telepresence CLI",
            required: true,
            installed: true,
            version: "v2.21.3",
          },
        ],
      };
    });

    const recheckBtn = page.getByRole("button", { name: /Re-check System Tools/i });
    await recheckBtn.click();

    // Should transition to ConnectPage
    await expect(page.getByText("Establish Cluster Session")).toBeVisible({ timeout: 5000 });
  });
});
