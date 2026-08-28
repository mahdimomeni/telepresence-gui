import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

describe("Card component", () => {
  it("should render full card structure with header, title, description, content and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Workload Settings</CardTitle>
          <CardDescription>Configure intercept and network options</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main Card Body</p>
        </CardContent>
        <CardFooter>
          <button>Save</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText("Workload Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure intercept and network options")).toBeInTheDocument();
    expect(screen.getByText("Main Card Body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
