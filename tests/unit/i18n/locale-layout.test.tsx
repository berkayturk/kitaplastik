import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

// next/font/google cannot run under Vitest without Next's SWC transform — each
// exported font constructor (Fraunces, Hanken_Grotesk, JetBrains_Mono) must
// return a { variable, className } shape so layout's template-literal usage
// doesn't throw.
vi.mock("next/font/google", () => {
  const stub = () => ({ variable: "--font-stub", className: "font-stub" });
  return {
    Fraunces: stub,
    Hanken_Grotesk: stub,
    JetBrains_Mono: stub,
  };
});

// Retained for any legacy localFont imports that survive the redesign.
vi.mock("next/font/local", () => ({
  default: () => ({ variable: "--font-stub", className: "font-stub" }),
}));

// next-intl/server pulls in the request-config chain which needs an active request context.
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getMessages: vi.fn(async () => ({})),
}));

// next/navigation notFound throws to halt rendering — emulate that behavior so we can assert it.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// getCompany pulls lib/supabase/server.ts → lib/env.ts which validates env vars at import time;
// stub it with a deterministic fixture so the locale-layout unit test remains env-independent.
vi.mock("@/lib/company", () => ({
  getCompany: vi.fn(async () => ({
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
  })),
}));

// next-intl's navigation wrappers rely on a Next.js runtime; stub them so that
// Header/Footer/LocaleSwitcher render as plain links under Vitest.
vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  type LinkProps = {
    href: string;
    locale?: string;
    children?: React.ReactNode;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: string;
  };
  return {
    Link: ({ href, locale, children, ...rest }: LinkProps) =>
      React.createElement("a", { href: locale ? `/${locale}${href}` : href, ...rest }, children),
    usePathname: () => "/",
  };
});

import LocaleLayout from "@/app/[locale]/layout";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

describe("LocaleLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children and calls setRequestLocale for a valid locale", async () => {
    const element = (await LocaleLayout({
      children: <div data-testid="child">hi</div>,
      // Type assertion needed because the runtime receives a URL string, but the prop type is Locale.
      params: Promise.resolve({ locale: "ar" as const }),
    })) as ReactElement;

    const { container } = render(element);
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
    expect(setRequestLocale).toHaveBeenCalledOnce();
    expect(setRequestLocale).toHaveBeenCalledWith("ar");
  });

  it("invokes notFound() for an invalid locale and does not call setRequestLocale", async () => {
    await expect(
      LocaleLayout({
        children: <div />,
        // Cast to bypass the Locale type for this invalid-input test case.
        params: Promise.resolve({ locale: "xx" as unknown as "ar" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
    expect(setRequestLocale).not.toHaveBeenCalled();
  });
});
