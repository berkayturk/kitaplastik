import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalLayout } from "@/components/legal/LegalLayout";

describe("LegalLayout", () => {
  it("renders title as <h1>", () => {
    render(
      <LegalLayout title="Gizlilik Politikası" intro={<>Intro text</>}>
        <p>section content</p>
      </LegalLayout>,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Gizlilik Politikası");
  });

  it("renders intro and children", () => {
    render(
      <LegalLayout title="t" intro={<>Welcome paragraph</>}>
        <p>section content</p>
      </LegalLayout>,
    );
    expect(screen.getByText("Welcome paragraph")).toBeInTheDocument();
    expect(screen.getByText("section content")).toBeInTheDocument();
  });

  it("wraps body in an <article>", () => {
    const { container } = render(
      <LegalLayout title="t" intro="i">
        <p>section</p>
      </LegalLayout>,
    );
    expect(container.querySelector("article")).not.toBeNull();
  });

  it("does NOT render any extra <h1> (hierarchy)", () => {
    render(
      <LegalLayout title="t" intro="i">
        <h2>section heading</h2>
        <p>x</p>
      </LegalLayout>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
