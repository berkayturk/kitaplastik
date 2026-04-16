import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("contentinfo role'üyle render olur", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("şirketin tam yasal adını içerir", () => {
    render(<Footer />);
    expect(
      screen.getByText(/KITA PLASTİK ve TEKSTİL SAN\. TİC\. LTD\. ŞTİ\./i),
    ).toBeInTheDocument();
  });

  it("güncel yıl + 1989'dan beri kuruluş yılını gösterir", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`1989.*${currentYear}|${currentYear}.*1989`)),
    ).toBeInTheDocument();
  });
});
