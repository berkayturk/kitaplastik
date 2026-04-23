import { describe, it, expect, vi, beforeEach } from "vitest";

const addBreadcrumb = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: (...args: unknown[]) => addBreadcrumb(...args),
}));

import { sendNotFoundBreadcrumb } from "@/lib/sentry/not-found";

describe("sendNotFoundBreadcrumb", () => {
  beforeEach(() => {
    addBreadcrumb.mockReset();
  });

  it("sends a warning-level breadcrumb with the pathname and referrer", () => {
    sendNotFoundBreadcrumb("/tr/urunler/eski-slug", "https://google.com/");

    expect(addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: "navigation.404",
      level: "warning",
      message: "404: /tr/urunler/eski-slug",
      data: { referrer: "https://google.com/" },
    });
  });

  it("passes a null referrer through verbatim", () => {
    sendNotFoundBreadcrumb("/ar/foo", null);

    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: "navigation.404",
      level: "warning",
      message: "404: /ar/foo",
      data: { referrer: null },
    });
  });
});
