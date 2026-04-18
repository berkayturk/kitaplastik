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

  it("1989 etiketi en az bir kez görünür", () => {
    renderHero();
    // Hero'da iki yerde 1989'dan beri var: eyebrow ve KPI açıklaması. Ikisi de OK.
    expect(screen.getAllByText(/1989'dan beri/i).length).toBeGreaterThan(0);
  });

  it("primary ve secondary CTA linklerini render eder", () => {
    renderHero();
    // Turkish İ/i casefold edilmez regex `/i` flag'i ile; pattern'e tam İ koyulur.
    expect(screen.getByRole("link", { name: /Teklif İste/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sektörleri Keşfet/ })).toBeInTheDocument();
  });
});
