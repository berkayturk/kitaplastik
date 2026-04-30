import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

// i18n navigation mock — matches pattern used by ReferencesStrip/Header tests.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

import { SectorGrid } from "@/components/home/SectorGrid";

const messages = {
  home: {
    sectors: {
      eyebrow: "Sektörler",
      title: "Üç sektör, tek mühendislik disiplini",
      camYikama: {
        title: "Cam Yıkama",
        description: "Şişeleme hatlarına dayanıklı yıkama ekipmanı parçaları.",
      },
      otomotiv: {
        title: "Otomotiv",
        description: "EV ve içten yanmalı araçlar için güvenlik aksesuarları.",
      },
      tekstil: {
        title: "Tekstil",
        description: "Tekstil makineleri ve aksesuarları için plastik parçalar.",
      },
    },
  },
  common: {
    cta: {
      learnMore: "Daha Fazla",
    },
  },
};

function renderGrid(locale: "tr" | "en" | "ru" | "ar" = "tr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SectorGrid />
    </NextIntlClientProvider>,
  );
}

describe("SectorGrid", () => {
  it("3 sektör kartını render eder (çeviri mesajlarından)", () => {
    renderGrid();
    expect(screen.getByText(/^cam yıkama$/i)).toBeInTheDocument();
    expect(screen.getByText(/^otomotiv$/i)).toBeInTheDocument();
    expect(screen.getByText(/^tekstil$/i)).toBeInTheDocument();
  });

  it("her kart bir Link içerir", () => {
    renderGrid();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it("CTA etiketini çeviri mesajından okur", () => {
    renderGrid();
    const ctas = screen.getAllByText(/daha fazla/i);
    expect(ctas.length).toBeGreaterThanOrEqual(3);
  });

  it("başlığı çeviri mesajından render eder", () => {
    renderGrid();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/üç sektör/i);
  });
});
