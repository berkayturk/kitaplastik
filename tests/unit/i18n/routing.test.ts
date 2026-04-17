import { describe, it, expect } from "vitest";
import { routing, locales, defaultLocale } from "@/i18n/routing";

describe("i18n routing", () => {
  it("exposes 4 locales in order tr, en, ru, ar", () => {
    expect(locales).toEqual(["tr", "en", "ru", "ar"]);
  });
  it("has TR as default locale", () => {
    expect(defaultLocale).toBe("tr");
    expect(routing.defaultLocale).toBe("tr");
  });
  it("uses always-prefix strategy", () => {
    expect(routing.localePrefix).toBe("always");
  });
});
