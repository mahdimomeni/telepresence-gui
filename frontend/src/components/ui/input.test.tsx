import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input component", () => {
  it("should render text input with placeholder", () => {
    render(<Input placeholder="Enter namespace..." />);
    expect(screen.getByPlaceholderText("Enter namespace...")).toBeInTheDocument();
  });

  it("should accept user typing", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input placeholder="Namespace" onChange={handleChange} />);
    const input = screen.getByPlaceholderText("Namespace");

    await user.type(input, "production");
    expect(input).toHaveValue("production");
    expect(handleChange).toHaveBeenCalled();
  });

  it("should handle disabled state", () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
  });
});
