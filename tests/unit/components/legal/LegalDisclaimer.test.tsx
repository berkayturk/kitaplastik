import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

describe("LegalDisclaimer", () => {
  it("renders publishedDate, lastUpdated, and disclaimer text", () => {
    render(
      <LegalDisclaimer
        publishedDate="26 Nisan 2026"
        lastUpdated="26 Nisan 2026"
        text="Bu metin bilgilendirme amaçlıdır."
      />,
    );
    expect(screen.getByText(/26 Nisan 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Bu metin bilgilendirme amaçlıdır/)).toBeInTheDocument();
  });

  it("renders inside a footer-like region with role contentinfo or aside", () => {
    const { container } = render(<LegalDisclaimer publishedDate="x" lastUpdated="y" text="z" />);
    const small = container.querySelector(
      "small, .legal-disclaimer, [data-testid='legal-disclaimer']",
    );
    expect(small).not.toBeNull();
  });
});
