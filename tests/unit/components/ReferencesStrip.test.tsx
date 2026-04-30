import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

vi.mock("server-only", () => ({}));

// next-intl/server requires an active request context — stub getTranslations
// to return a simple key-lookup function that works in jsdom.
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => {
    const store: Record<string, Record<string, string>> = {
      "home.references": {
        eyebrow: "Güvenilen partner",
        title: "Bizi seçen markalar",
        viewAll: "Tümü",
      },
      "references.clients": {
        "c1.name": "Anadolu",
        "c2.name": "Marmara",
        "c3.name": "Ege",
        "c4.name": "Bosphorus",
        "c5.name": "Nord",
        "c6.name": "Textile",
        "c7.name": "Balkan",
        "c8.name": "Cosmo",
      },
    };
    const map = store[ns] ?? {};
    return (key: string) => map[key] ?? key;
  }),
  getLocale: vi.fn(async () => "tr"),
}));

// i18n navigation mock pattern established in Task 4
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/references/data", () => ({
  getReferences: vi.fn(async () => [
    {
      id: "c1",
      key: "c1",
      logoPath: "/references/c1.svg",
      sectorKey: "camYikama",
      displayName: null,
    },
    {
      id: "c2",
      key: "c2",
      logoPath: "/references/c2.svg",
      sectorKey: "otomotiv",
      displayName: null,
    },
    {
      id: "c3",
      key: "c3",
      logoPath: "/references/c3.svg",
      sectorKey: "tekstil",
      displayName: null,
    },
    {
      id: "c4",
      key: "c4",
      logoPath: "/references/c4.svg",
      sectorKey: "camYikama",
      displayName: null,
    },
    {
      id: "c5",
      key: "c5",
      logoPath: "/references/c5.svg",
      sectorKey: "otomotiv",
      displayName: null,
    },
    {
      id: "c6",
      key: "c6",
      logoPath: "/references/c6.svg",
      sectorKey: "tekstil",
      displayName: null,
    },
    {
      id: "c7",
      key: "c7",
      logoPath: "/references/c7.svg",
      sectorKey: "camYikama",
      displayName: null,
    },
    {
      id: "c8",
      key: "c8",
      logoPath: "/references/c8.svg",
      sectorKey: "otomotiv",
      displayName: null,
    },
  ]),
}));

import { ReferencesStrip } from "@/components/home/ReferencesStrip";
import { getReferences } from "@/lib/references/data";

const messages = {
  home: {
    references: {
      eyebrow: "Güvenilen partner",
      title: "Bizi seçen markalar",
      subtitle: "36 yıl",
      viewAll: "Tümü",
    },
  },
  references: {
    clients: {
      c1: { name: "Anadolu", sector: "Cam" },
      c2: { name: "Marmara", sector: "Kapak" },
      c3: { name: "Ege", sector: "Tekstil" },
      c4: { name: "Bosphorus", sector: "Cam" },
      c5: { name: "Nord", sector: "Kapak" },
      c6: { name: "Textile", sector: "Tekstil" },
      c7: { name: "Balkan", sector: "Cam" },
      c8: { name: "Cosmo", sector: "Kapak" },
    },
  },
};

async function renderStrip() {
  const jsx = await ReferencesStrip();
  return render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      {jsx}
    </NextIntlClientProvider>,
  );
}

describe("ReferencesStrip", () => {
  it("renders eyebrow and title", async () => {
    await renderStrip();
    expect(screen.getByText("Güvenilen partner")).toBeInTheDocument();
    expect(screen.getByText("Bizi seçen markalar")).toBeInTheDocument();
  });

  it("renders all 8 client logos with alt text", async () => {
    await renderStrip();
    expect(screen.getByRole("img", { name: /Anadolu/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Cosmo/i })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(8);
  });

  it("has link to full references page", async () => {
    await renderStrip();
    const link = screen.getByRole("link", { name: /Tümü/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("/references"));
  });
});

describe("ReferencesStrip — displayName fallback chain", () => {
  beforeEach(() => {
    vi.mocked(getReferences).mockResolvedValue([
      {
        id: "c1",
        key: "c1",
        logoPath: "/references/c1.svg",
        sectorKey: "camYikama",
        displayName: { tr: "CUSTOM-Anadolu", en: "CUSTOM-Anadolu" },
      },
      {
        id: "c2",
        key: "c2",
        logoPath: "/references/c2.svg",
        sectorKey: "otomotiv",
        displayName: { tr: "CUSTOM-Marmara", en: "CUSTOM-Marmara" },
      },
      {
        id: "c3",
        key: "c3",
        logoPath: "/references/c3.svg",
        sectorKey: "tekstil",
        displayName: { tr: "CUSTOM-Ege", en: "CUSTOM-Ege" },
      },
      {
        id: "c4",
        key: "c4",
        logoPath: "/references/c4.svg",
        sectorKey: "camYikama",
        displayName: { tr: "CUSTOM-Bosphorus", en: "CUSTOM-Bosphorus" },
      },
      {
        id: "c5",
        key: "c5",
        logoPath: "/references/c5.svg",
        sectorKey: "otomotiv",
        displayName: null,
      },
      {
        id: "c6",
        key: "c6",
        logoPath: "/references/c6.svg",
        sectorKey: "tekstil",
        displayName: null,
      },
      {
        id: "c7",
        key: "c7",
        logoPath: "/references/c7.svg",
        sectorKey: "camYikama",
        displayName: null,
      },
      {
        id: "c8",
        key: "c8",
        logoPath: "/references/c8.svg",
        sectorKey: "otomotiv",
        displayName: null,
      },
    ]);
  });

  afterEach(() => {
    vi.mocked(getReferences).mockReset();
  });

  it("uses displayName when available, falls back to translation otherwise", async () => {
    await renderStrip();
    // displayName wins for c1
    expect(screen.getByRole("img", { name: /CUSTOM-Anadolu/i })).toBeInTheDocument();
    // translation fallback wins for c5 (displayName is null)
    expect(screen.getByRole("img", { name: /Nord/i })).toBeInTheDocument();
  });
});
