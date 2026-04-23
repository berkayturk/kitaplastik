import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BlueprintIllustration } from "@/components/not-found/BlueprintIllustration";

describe("<BlueprintIllustration />", () => {
  it("renders a decorative svg marked aria-hidden", () => {
    const { container } = render(<BlueprintIllustration />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("role", "presentation");
    expect(svg).toHaveAttribute("viewBox", "0 0 240 240");
  });

  it("draws a 12x12 dot grid (144 dots)", () => {
    const { container } = render(<BlueprintIllustration />);
    const gridDots = container.querySelectorAll("svg [data-layer='grid'] circle");
    expect(gridDots).toHaveLength(144);
  });

  it("draws the cobalt arc, cobalt vertical segment, and one jade accent dot", () => {
    const { container } = render(<BlueprintIllustration />);
    expect(container.querySelector("[data-shape='arc']")).not.toBeNull();
    expect(container.querySelector("[data-shape='segment']")).not.toBeNull();
    const accent = container.querySelector("[data-shape='accent']");
    expect(accent).not.toBeNull();
    expect(accent).toHaveAttribute("fill", "#0FA37F");
  });
});
