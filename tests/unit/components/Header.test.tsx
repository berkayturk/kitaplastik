import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

describe("Header", () => {
  it("logo veya marka adı görünür", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText(/KITA/i)).toBeInTheDocument();
  });

  it("ana navigasyon link'leri içerir", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: /ana menü/i });
    expect(nav).toBeInTheDocument();
  });

  it("Teklif İste CTA butonu görünür", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /teklif iste/i })).toBeInTheDocument();
  });
});
