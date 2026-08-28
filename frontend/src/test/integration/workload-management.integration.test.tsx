import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListPage } from "@/pages/list";
import * as AppBindings from "../../../wailsjs/go/app/App";
import * as WailsRuntime from "../../../wailsjs/runtime/runtime";
import { models } from "../../../wailsjs/go/models";

describe("Workload Management Integration", () => {
  const mockDisconnect = vi.fn();

  const mockWorkloads: models.Workload[] = [
    new models.Workload({
      name: "auth-service",
      namespace: "ecommerce",
      workload_resource_type: "Deployment",
      desired_replicas: 3,
      ready_replicas: 3,
      intercept_info: [
        new models.InterceptInfo({
          id: "auth-int-01",
          spec: new models.InterceptSpec({
            name: "auth-service",
            client: "local-user",
            target_host: "127.0.0.1",
            target_port: 8080,
            mechanism: "http",
          }),
          disposition: 2, // ACTIVE
          pod_name: "auth-service-pod-xyz",
        }),
      ],
    }),
    new models.Workload({
      name: "payment-gateway",
      namespace: "ecommerce",
      workload_resource_type: "Deployment",
      desired_replicas: 2,
      ready_replicas: 2,
      intercept_info: [],
    }),
    new models.Workload({
      name: "analytics-worker",
      namespace: "ecommerce",
      workload_resource_type: "StatefulSet",
      desired_replicas: 1,
      ready_replicas: 1,
      intercept_info: [],
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AppBindings.ListWorkloads).mockResolvedValue(mockWorkloads);
  });

  it("should fetch and render workloads with correct statuses and counts", async () => {
    render(<ListPage onDisconnect={mockDisconnect} />);

    await waitFor(() => {
      expect(screen.getByText("Active Workload Session")).toBeInTheDocument();
    });

    expect(screen.getByText("auth-service")).toBeInTheDocument();
    expect(screen.getByText("payment-gateway")).toBeInTheDocument();
    expect(screen.getByText("analytics-worker")).toBeInTheDocument();

    // Verify Intercepted badge on auth-service
    expect(screen.getByText("Intercepted")).toBeInTheDocument();
  });

  it("should filter workloads by search query", async () => {
    const user = userEvent.setup();
    render(<ListPage onDisconnect={mockDisconnect} />);

    await waitFor(() => {
      expect(screen.getByText("auth-service")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search workloads by name/i);
    await user.type(searchInput, "payment");

    expect(screen.getByText("payment-gateway")).toBeInTheDocument();
    expect(screen.queryByText("auth-service")).not.toBeInTheDocument();
    expect(screen.queryByText("analytics-worker")).not.toBeInTheDocument();
  });

  it("should open Intercept dialog and submit intercept configuration", async () => {
    const user = userEvent.setup();
    vi.mocked(AppBindings.InterceptWorkload).mockResolvedValue(undefined);

    render(<ListPage onDisconnect={mockDisconnect} />);

    await waitFor(() => {
      expect(screen.getByText("payment-gateway")).toBeInTheDocument();
    });

    // Find and click Intercept button for payment-gateway
    const interceptButtons = screen.getAllByRole("button", { name: /^Intercept$/i });
    expect(interceptButtons.length).toBeGreaterThan(0);
    await user.click(interceptButtons[0]);

    // Verify Intercept dialog is open
    await waitFor(() => {
      expect(screen.getByText("Intercept Workload")).toBeInTheDocument();
    });

    // Fill port mapping
    const portInput = screen.getByPlaceholderText(/8080 or 8080:80/i);
    await user.type(portInput, "9090:80");

    // Submit intercept
    const submitButton = screen.getByRole("button", { name: /Start Intercept/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(AppBindings.InterceptWorkload).toHaveBeenCalled();
    });
  });

  it("should open Replace dialog and configure replace workload", async () => {
    const user = userEvent.setup();
    vi.mocked(AppBindings.ReplaceWorkload).mockResolvedValue(undefined);

    render(<ListPage onDisconnect={mockDisconnect} />);

    await waitFor(() => {
      expect(screen.getByText("payment-gateway")).toBeInTheDocument();
    });

    // Click Replace button
    const replaceButtons = screen.getAllByRole("button", { name: /^Replace$/i });
    expect(replaceButtons.length).toBeGreaterThan(0);
    await user.click(replaceButtons[0]);

    // Verify Replace dialog is open
    await waitFor(() => {
      expect(screen.getByText("Replace Workload")).toBeInTheDocument();
    });

    const portInput = screen.getByPlaceholderText(/all, or 8080/i);
    await user.clear(portInput);
    await user.type(portInput, "8080:80");

    const submitReplace = screen.getByRole("button", { name: /Start Replace/i });
    await user.click(submitReplace);

    await waitFor(() => {
      expect(AppBindings.ReplaceWorkload).toHaveBeenCalled();
    });
  });

  it("should detach an active intercept when Detach is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(AppBindings.DetachWorkload).mockResolvedValue(undefined);

    render(<ListPage onDisconnect={mockDisconnect} />);

    await waitFor(() => {
      expect(screen.getByText("auth-service")).toBeInTheDocument();
    });

    const detachButton = screen.getByRole("button", { name: /Detach/i });
    await user.click(detachButton);

    await waitFor(() => {
      expect(AppBindings.DetachWorkload).toHaveBeenCalledWith(
        expect.objectContaining({
          attachment_name: "auth-service",
        })
      );
    });
  });

  it("should dynamically update workload list when workloads-changed event is received", async () => {
    let workloadsCallback: (workloads: models.Workload[]) => void = () => {};

    vi.mocked(WailsRuntime.EventsOn).mockImplementation((event, cb) => {
      if (event === "workloads-changed") {
        workloadsCallback = cb as (workloads: models.Workload[]) => void;
      }
      return () => {};
    });

    render(<ListPage onDisconnect={mockDisconnect} />);

    await waitFor(() => {
      expect(screen.getByText("auth-service")).toBeInTheDocument();
    });

    // Emit updated workloads with a new service
    const updatedWorkloads = [
      ...mockWorkloads,
      new models.Workload({
        name: "notification-hub",
        namespace: "ecommerce",
        workload_resource_type: "Deployment",
        desired_replicas: 1,
        ready_replicas: 1,
        intercept_info: [],
      }),
    ];

    await act(async () => {
      workloadsCallback(updatedWorkloads);
    });

    await waitFor(() => {
      expect(screen.getByText("notification-hub")).toBeInTheDocument();
    });
  });
});
