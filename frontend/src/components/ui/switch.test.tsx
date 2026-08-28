import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Switch } from "./switch";

describe("Switch component", () => {
  it("should render switch component", () => {
    render(<Switch aria-label="Toggle notifications" />);
    expect(screen.getByRole("switch", { name: "Toggle notifications" })).toBeInTheDocument();
  });

  it("should render checked state", () => {
    render(<Switch checked aria-label="Dark mode" readOnly />);
    const switchEl = screen.getByRole("switch", { name: "Dark mode" });
    expect(switchEl).toBeInTheDocument();
  });
});
