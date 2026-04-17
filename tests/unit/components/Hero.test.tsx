import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Hero } from "@/components/home/Hero";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    locale,
    children,
    ...rest
  }: ComponentProps<"a"> & { href: string; locale?: string }) => (
    <a href={locale ? `/${locale}${href}` : href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
}));

const messages = {
  home: {
    hero: {
      eyebrow: "1989'dan beri · Bursa, Türkiye",
      titleLead: "Plastik enjeksiyonun",
      titleAccent: "mühendislik partneri.",
      subtitle: "36 yıllık üretim deneyimi. Bursa atölyemizden üretim ve özel mühendislik.",
      primaryCta: "Teklif İste",
      secondaryCta: "Sektörleri Keşfet",
    },
  },
};

function renderHero() {
  return render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <Hero />
    </NextIntlClientProvider>,
  );
}

describe("Hero", () => {
  it("ana başlığı render eder", () => {
    renderHero();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/mühendislik partneri/i);
  });

  it("1989 etiketi görünür", () => {
    renderHero();
    expect(screen.getByText(/1989'dan beri/i)).toBeInTheDocument();
  });

  it("primary ve secondary CTA linklerini render eder", () => {
    renderHero();
    expect(screen.getByRole("link", { name: "Teklif İste" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sektörleri Keşfet" })).toBeInTheDocument();
  });
});
