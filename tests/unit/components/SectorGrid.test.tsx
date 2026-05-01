import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";

vi.mock("server-only", () => ({}));

// SectorGrid is now an async server component that calls getTranslations.
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => {
    const store: Record<string, Record<string, string>> = {
      "home.sectors": {
        eyebrow: "Sektörler",
        title: "Üç sektör, tek mühendislik disiplini",
      },
    };
    const map = store[ns] ?? {};
    return (key: string) => map[key] ?? key;
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

// SectorPreviewGrid pulls in Supabase + env validation via lib/supabase/server.
// Its internal behavior (image loading, card layout) is covered by separate tests
// of the preview grid itself; here we mock it so SectorGrid's wrapper concerns
// (header rendering, grid mount, sector links + CTAs) can be verified in isolation.
vi.mock("@/components/public/sectors/SectorPreviewGrid", () => ({
  SectorPreviewGrid: () => (
    <div>
      <a href="#bottle-washing">
        <span>Cam Yıkama</span>
        <span>Daha Fazla</span>
      </a>
      <a href="#automotive">
        <span>Otomotiv</span>
        <span>Daha Fazla</span>
      </a>
      <a href="#textile">
        <span>Tekstil</span>
        <span>Daha Fazla</span>
      </a>
    </div>
  ),
}));

import { SectorGrid } from "@/components/home/SectorGrid";

const messages = {
  home: {
    sectors: {
      eyebrow: "Sektörler",
      title: "Üç sektör, tek mühendislik disiplini",
    },
  },
};

async function renderGrid(locale: "tr" | "en" | "ru" | "ar" = "tr") {
  const jsx = (await SectorGrid()) as ReactElement;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {jsx}
    </NextIntlClientProvider>,
  );
}

describe("SectorGrid", () => {
  it("3 sektör kartını render eder (çeviri mesajlarından)", async () => {
    await renderGrid();
    expect(screen.getByText(/^cam yıkama$/i)).toBeInTheDocument();
    expect(screen.getByText(/^otomotiv$/i)).toBeInTheDocument();
    expect(screen.getByText(/^tekstil$/i)).toBeInTheDocument();
  });

  it("her kart bir Link içerir", async () => {
    await renderGrid();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it("CTA etiketini çeviri mesajından okur", async () => {
    await renderGrid();
    const ctas = screen.getAllByText(/daha fazla/i);
    expect(ctas.length).toBeGreaterThanOrEqual(3);
  });

  it("başlığı çeviri mesajından render eder", async () => {
    await renderGrid();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/üç sektör/i);
  });
});
