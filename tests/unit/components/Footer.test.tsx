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
import type { Company } from "@/lib/admin/schemas/company";

const TEST_COMPANY: Company = {
  legalName: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
  brandName: "Kıta Plastik",
  shortName: "KITA",
  founded: 1989,
  address: {
    street: "Eski Gemlik Yolu Kadem Sk. No: 37-40",
    district: "Osmangazi",
    city: "Bursa",
    countryCode: "TR",
    maps: "https://www.google.com/maps/search/?api=1&query=test",
  },
  phone: { display: "+90 224 216 16 94", tel: "+902242161694" },
  cellPhone: { display: "+90 532 237 13 24", tel: "+905322371324" },
  fax: { display: "+90 224 215 05 25" },
  email: { primary: "info@kitaplastik.com", secondary: "kitaplastik@hotmail.com" },
  whatsapp: { display: "+90 224 216 16 94", wa: "905322371324" },
  telegram: { handle: "kitaplastik", display: "@kitaplastik" },
  web: { primary: "https://www.kitaplastik.com", alt: "https://www.kitaplastik.com.tr" },
};

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
      legalName: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti. — Bursa, Türkiye",
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
      <Footer company={TEST_COMPANY} />
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
      screen.getByText(/Kıta Plastik ve Tekstil San\. Tic\. Ltd\. Şti\. — Bursa/i),
    ).toBeInTheDocument();
  });

  it("telif hakkı satırında güncel yılı gösterir", () => {
    renderFooter();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
  });

  it("footer link etiketlerini çeviri mesajlarından okur", () => {
    renderFooter();
    // Şirket kolonundan Hakkımızda (nav.about çevirisi)
    expect(screen.getByRole("link", { name: /hakkımızda/i })).toBeInTheDocument();
    // İletişim kolonundan Ürünler + Teklif İste
    expect(screen.getByRole("link", { name: /ürünler/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /teklif İste/i })).toBeInTheDocument();
    // Sektörler kolon başlığı H3 olarak (link değil) görünmeli
    expect(screen.getByRole("heading", { level: 3, name: /sektörler/i })).toBeInTheDocument();
  });
});
