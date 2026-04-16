import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/home/Hero";

describe("Hero", () => {
  it("ana başlığı render eder", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/mühendislik partneri/i);
  });

  it("1989 etiketi görünür", () => {
    render(<Hero />);
    expect(screen.getByText(/1989'dan beri/i)).toBeInTheDocument();
  });

  it("iki CTA içerir (custom + standart)", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /özel üretim/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /standart ürün/i })).toBeInTheDocument();
  });
});
