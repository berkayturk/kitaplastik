import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

// i18n navigation mock pattern established in Task 4
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

import { ReferencesStrip } from "@/components/home/ReferencesStrip";

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

function renderStrip() {
  return render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <ReferencesStrip />
    </NextIntlClientProvider>,
  );
}

describe("ReferencesStrip", () => {
  it("renders eyebrow and title", () => {
    renderStrip();
    expect(screen.getByText("Güvenilen partner")).toBeInTheDocument();
    expect(screen.getByText("Bizi seçen markalar")).toBeInTheDocument();
  });

  it("renders all 8 client logos with alt text", () => {
    renderStrip();
    expect(screen.getByRole("img", { name: /Anadolu/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Cosmo/i })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(8);
  });

  it("has link to full references page", () => {
    renderStrip();
    const link = screen.getByRole("link", { name: /Tümü/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("/referanslar"));
  });
});
