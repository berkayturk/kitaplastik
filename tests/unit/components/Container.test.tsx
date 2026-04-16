import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "@/components/layout/Container";

describe("Container", () => {
  it("children'ı render eder", () => {
    render(
      <Container>
        <span>içerik</span>
      </Container>,
    );
    expect(screen.getByText("içerik")).toBeInTheDocument();
  });

  it("varsayılan max-width container class'ını uygular", () => {
    const { container } = render(
      <Container>
        <span>x</span>
      </Container>,
    );
    expect(container.firstChild).toHaveClass("mx-auto");
    expect(container.firstChild).toHaveClass("max-w-7xl");
  });

  it("custom className'i merge eder", () => {
    const { container } = render(
      <Container className="bg-red-500">
        <span>x</span>
      </Container>,
    );
    expect(container.firstChild).toHaveClass("bg-red-500");
    expect(container.firstChild).toHaveClass("max-w-7xl");
  });

  it("as prop ile farklı element render eder", () => {
    render(
      <Container as="section" data-testid="ctn">
        <span>x</span>
      </Container>,
    );
    expect(screen.getByTestId("ctn").tagName).toBe("SECTION");
  });
});
