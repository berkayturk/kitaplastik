import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { RecoveryCards } from "@/components/not-found/RecoveryCards";

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
}));

const messages = {
  common: {
    notFound: {
      recoveryTitle: "BELKİ BUNLAR?",
      cards: {
        products: { title: "Ürünler", desc: "Tüm ürün ailesini inceleyin" },
        sectors: { title: "Sektörler", desc: "Cam yıkama · kapak · tekstil" },
        catalog: { title: "Katalog iste", desc: "PDF katalog talep formu" },
        contact: { title: "İletişim", desc: "Bize ulaşın" },
      },
    },
  },
};

function renderCards() {
  return render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <RecoveryCards />
    </NextIntlClientProvider>,
  );
}

describe("<RecoveryCards />", () => {
  it("renders exactly 4 recovery links", () => {
    renderCards();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("wires each card href to the correct internal route", () => {
    renderCards();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/products", "/sectors", "/request-quote", "/contact"]);
  });

  it("renders translated titles and descriptions for the tr locale", () => {
    renderCards();
    expect(screen.getByText("Ürünler")).toBeInTheDocument();
    expect(screen.getByText("Sektörler")).toBeInTheDocument();
    expect(screen.getByText("Katalog iste")).toBeInTheDocument();
    expect(screen.getByText("İletişim")).toBeInTheDocument();
    expect(screen.getByText("PDF katalog talep formu")).toBeInTheDocument();
  });

  it("labels the nav region with the translated recovery title", () => {
    renderCards();
    const nav = screen.getByRole("navigation", { name: "BELKİ BUNLAR?" });
    expect(nav).toBeInTheDocument();
  });
});
