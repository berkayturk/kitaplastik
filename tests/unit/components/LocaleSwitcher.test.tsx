import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

// The next-intl navigation wrappers transitively call `next/navigation`'s
// `usePathname`, which returns `null` outside of a Next.js runtime. Because
// next-intl ships as pre-bundled CJS, `vi.mock("next/navigation")` cannot
// intercept its internal requires. Mock our own navigation wrapper instead —
// this keeps the test focused on the component's behavior (rendering four
// locale links and marking the active one) without coupling to next-intl
// routing internals that only work server-side.
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

const messages = { nav: { language: "Dil" } };

function renderWithProvider(locale: "tr" | "en" | "ru" | "ar" = "tr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleSwitcher />
    </NextIntlClientProvider>,
  );
}

describe("LocaleSwitcher", () => {
  it("renders all 4 locales", () => {
    renderWithProvider();
    expect(screen.getByRole("link", { name: /TR/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RU/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AR/i })).toBeInTheDocument();
  });

  it("marks current locale with aria-current", () => {
    renderWithProvider("en");
    const active = screen.getByRole("link", { name: /EN/i });
    expect(active).toHaveAttribute("aria-current", "true");
  });
});
