import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

// next/font/local cannot run under Vitest without Next's SWC transform.
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
