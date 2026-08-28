import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("should handle conditional class names", () => {
    const isPrimary = true;
    const isSecondary = false;
    expect(cn("btn", isPrimary && "btn-primary", isSecondary && "btn-secondary")).toBe(
      "btn btn-primary"
    );
  });

  it("should merge conflicting Tailwind utility classes properly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should ignore falsy and undefined values", () => {
    expect(cn("base", undefined, null, false, "")).toBe("base");
  });

  it("should handle arrays and objects of classes", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });
});
