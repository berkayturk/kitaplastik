import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HeroFallback } from "@/components/three/HeroFallback";

describe("HeroFallback", () => {
  it("renders aria-hidden decorative background", () => {
    const { container } = render(<HeroFallback />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.className).toContain("absolute");
    expect(root.className).toContain("inset-0");
  });
});
