import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// next/font/local is a Next.js SWC-transformed import. In the Vitest (pure Vite)
// environment it returns undefined by default, so stub it with a minimal shape
// that matches how the layout consumes it (`.variable`).
vi.mock("next/font/local", () => ({
  default: () => ({ variable: "mock-font-var" }),
}));

// getMessages would try to import message JSONs via the request config. The
// placeholder locale JSONs are empty (`{}`), which is fine, but the layout only
// needs a structural check — stub it for determinism.
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getMessages: vi.fn(async () => ({})),
}));

import LocaleLayout from "@/app/[locale]/layout";

describe("LocaleLayout", () => {
  it("renders children for a valid locale", async () => {
    const element = await LocaleLayout({
      children: <div data-testid="child">hi</div>,
      params: Promise.resolve({ locale: "ar" }),
    });
    const { container } = render(element as ReactElement);
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
