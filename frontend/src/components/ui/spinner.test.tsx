import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./spinner";

describe("Spinner component", () => {
  it("should render spinner with status role and loading label", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("should apply custom className", () => {
    render(<Spinner className="size-6 text-primary" />);
    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toHaveClass("size-6");
    expect(spinner).toHaveClass("text-primary");
  });
});
