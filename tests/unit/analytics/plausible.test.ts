import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("trackPlausible", () => {
  beforeEach(() => {
    // window.plausible is optional on the Window interface (declared in the wrapper).
    (globalThis as { window: Window }).window.plausible = vi.fn();
  });

  afterEach(() => {
    delete (globalThis as { window: Window }).window.plausible;
  });

  it("calls window.plausible with event name for no-props event", async () => {
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    trackPlausible({ name: "Contact Submitted" });
    expect(window.plausible).toHaveBeenCalledWith("Contact Submitted", undefined);
  });

  it("calls window.plausible with name and props payload", async () => {
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    trackPlausible({ name: "Locale Changed", props: { to: "en" } });
    expect(window.plausible).toHaveBeenCalledWith("Locale Changed", {
      props: { to: "en" },
    });
  });

  it("no-ops safely when window.plausible is undefined", async () => {
    delete (globalThis as { window: Window }).window.plausible;
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    // should not throw
    expect(() => trackPlausible({ name: "Contact Submitted" })).not.toThrow();
  });

  it("no-ops in SSR context when window is undefined", async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    expect(() => trackPlausible({ name: "Contact Submitted" })).not.toThrow();
    // restore
    globalThis.window = originalWindow;
  });
});
