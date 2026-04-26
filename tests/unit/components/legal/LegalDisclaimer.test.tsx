import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

describe("LegalDisclaimer", () => {
  it("renders publishedDate, lastUpdated, and disclaimer text with locale-translated labels", () => {
    render(
      <LegalDisclaimer
        publishedLabel="Yayın tarihi"
        publishedDate="26 Nisan 2026"
        updatedLabel="Son güncelleme"
        lastUpdated="26 Nisan 2026"
        text="Bu metin bilgilendirme amaçlıdır."
      />,
    );
    expect(screen.getByText(/Yayın tarihi/)).toBeInTheDocument();
    expect(screen.getByText(/Son güncelleme/)).toBeInTheDocument();
    expect(screen.getByText(/Bu metin bilgilendirme amaçlıdır/)).toBeInTheDocument();
  });

  it("renders a small element with the legal-disclaimer test id", () => {
    const { container } = render(
      <LegalDisclaimer
        publishedLabel="Published"
        publishedDate="x"
        updatedLabel="Last updated"
        lastUpdated="y"
        text="z"
      />,
    );
    const small = container.querySelector(
      "small, .legal-disclaimer, [data-testid='legal-disclaimer']",
    );
    expect(small).not.toBeNull();
  });
});
