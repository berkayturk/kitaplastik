import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

// i18n navigation mock — matches pattern used by Header/ReferencesStrip tests.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

import { Footer } from "@/components/layout/Footer";

const messages = {
  common: {
    brand: {
      name: "Kıta Plastik",
      tagline: "Plastik enjeksiyonun mühendislik partneri",
    },
    cta: {
      requestQuote: "Teklif İste",
    },
    footer: {
      copyright: "© {year} Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
      since: "1989'dan beri Bursa'dan",
      address: "Bursa Organize Sanayi Bölgesi",
      phone: "Telefon",
      email: "E-posta",
      links: "Bağlantılar",
    },
  },
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

function renderFooter(locale: "tr" | "en" | "ru" | "ar" = "tr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Footer />
    </NextIntlClientProvider>,
  );
}

describe("Footer", () => {
  it("contentinfo role'üyle render olur", () => {
    renderFooter();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("şirketin tam yasal adını içerir", () => {
    renderFooter();
    expect(
      screen.getByText(/KITA PLASTİK ve TEKSTİL SAN\. TİC\. LTD\. ŞTİ\./i),
    ).toBeInTheDocument();
  });

  it("telif hakkı satırında güncel yılı gösterir", () => {
    renderFooter();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
  });

  it("footer link etiketlerini çeviri mesajlarından okur", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: /sektörler/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ürünler/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hakkımızda/i })).toBeInTheDocument();
  });
});
