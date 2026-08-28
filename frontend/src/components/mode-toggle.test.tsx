import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModeToggle } from "./mode-toggle";
import { ThemeProvider } from "./theme-provider";

describe("ModeToggle component", () => {
  it("should render mode toggle button and sr-only label", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ModeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });
});
