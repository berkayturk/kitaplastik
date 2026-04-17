import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "@/components/layout/Header";

// next-intl's navigation wrappers call next/navigation's `usePathname`, which
// returns null outside a Next.js runtime. Since next-intl is pre-bundled CJS,
// vi.mock("next/navigation") cannot reach its internal requires — mock our
// own wrapper instead.
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
  nav: {
    primary: "Ana navigasyon",
    sectors: "Sektörler",
    products: "Ürünler",
    references: "Referanslar",
    about: "Hakkımızda",
    contact: "İletişim",
    language: "Dil",
  },
};

function renderHeader(locale: "tr" | "en" | "ru" | "ar" = "tr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
    </NextIntlClientProvider>,
  );
}

describe("Header", () => {
  it("logo veya marka adı görünür", () => {
    renderHeader();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /kıta plastik/i })).toBeInTheDocument();
  });

  it("ana navigasyon link'leri içerir", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: /ana navigasyon/i });
    expect(nav).toBeInTheDocument();
  });

  it("Teklif İste CTA butonu görünür", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /teklif/i })).toBeInTheDocument();
  });
});
