import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

const scriptSpy = vi.fn((_props: Record<string, unknown>) => null);
vi.mock("next/script", () => ({ default: (props: Record<string, unknown>) => scriptSpy(props) }));

describe("<PlausibleScript />", () => {
  const originalDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const originalHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST;

  beforeEach(() => {
    scriptSpy.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    if (originalDomain === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = originalDomain;
    if (originalHost === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_HOST;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_HOST = originalHost;
  });

  it("renders Script with same-origin proxy paths when envs are set", async () => {
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "kitaplastik.com";
    process.env.NEXT_PUBLIC_PLAUSIBLE_HOST = "https://plausible.kitaplastik.com";
    const { PlausibleScript } = await import("@/components/PlausibleScript");
    render(<PlausibleScript />);
    expect(scriptSpy).toHaveBeenCalledTimes(1);
    const [firstCall] = scriptSpy.mock.calls;
    expect(firstCall).toBeDefined();
    const [props] = firstCall!;
    expect(props).toMatchObject({
      src: "/pa/script.js",
      "data-domain": "kitaplastik.com",
      "data-api": "/pa/event",
      defer: true,
      strategy: "afterInteractive",
    });
  });

  it("renders null when domain env is unset", async () => {
    delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    process.env.NEXT_PUBLIC_PLAUSIBLE_HOST = "https://plausible.kitaplastik.com";
    const { PlausibleScript } = await import("@/components/PlausibleScript");
    const { container } = render(<PlausibleScript />);
    expect(container).toBeEmptyDOMElement();
    expect(scriptSpy).not.toHaveBeenCalled();
  });

  it("renders null when host env is unset", async () => {
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "kitaplastik.com";
    delete process.env.NEXT_PUBLIC_PLAUSIBLE_HOST;
    const { PlausibleScript } = await import("@/components/PlausibleScript");
    const { container } = render(<PlausibleScript />);
    expect(container).toBeEmptyDOMElement();
    expect(scriptSpy).not.toHaveBeenCalled();
  });
});
