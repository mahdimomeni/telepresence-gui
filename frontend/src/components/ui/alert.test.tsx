import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert, AlertTitle, AlertDescription } from "./alert";

describe("Alert component", () => {
  it("should render alert title and description", () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Kubeconfig file is missing or invalid.</AlertDescription>
      </Alert>
    );

    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Kubeconfig file is missing or invalid.")).toBeInTheDocument();
  });

  it("should render destructive alert variant", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to connect to cluster.</AlertDescription>
      </Alert>
    );

    expect(screen.getByRole("alert")).toHaveClass("text-destructive");
  });
});
