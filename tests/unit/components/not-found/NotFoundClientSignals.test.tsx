import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const sendNotFoundBreadcrumb = vi.fn();
const usePathname = vi.fn();

vi.mock("@/lib/sentry/not-found", () => ({
  sendNotFoundBreadcrumb: (...args: unknown[]) => sendNotFoundBreadcrumb(...args),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

import { NotFoundClientSignals } from "@/components/not-found/NotFoundClientSignals";

describe("<NotFoundClientSignals />", () => {
  beforeEach(() => {
    sendNotFoundBreadcrumb.mockReset();
    usePathname.mockReset();
  });

  it("renders the URL echo with label + pathname when pathname present", () => {
    usePathname.mockReturnValue("/tr/urunler/eski");
    render(<NotFoundClientSignals label="Aradığınız:" />);
    expect(screen.getByText("Aradığınız:")).toBeInTheDocument();
    expect(screen.getByText("/tr/urunler/eski")).toBeInTheDocument();
  });

  it("truncates pathnames longer than 250 chars and appends an ellipsis", () => {
    const longPath = "/tr/" + "a".repeat(300);
    usePathname.mockReturnValue(longPath);
    render(<NotFoundClientSignals label="Aradığınız:" />);
    const rendered = screen.getByText(/a{5,}…$/);
    expect(rendered.textContent!.length).toBe(251); // 250 chars + "…"
  });

  it("fires sendNotFoundBreadcrumb exactly once on mount with pathname + referrer", () => {
    usePathname.mockReturnValue("/ar/foo-bar");
    Object.defineProperty(document, "referrer", {
      value: "https://src.example/",
      configurable: true,
    });
    render(<NotFoundClientSignals label="X" />);
    expect(sendNotFoundBreadcrumb).toHaveBeenCalledTimes(1);
    expect(sendNotFoundBreadcrumb).toHaveBeenCalledWith("/ar/foo-bar", "https://src.example/");
  });

  it("renders nothing and does not call breadcrumb when pathname is null", () => {
    usePathname.mockReturnValue(null);
    const { container } = render(<NotFoundClientSignals label="X" />);
    expect(container).toBeEmptyDOMElement();
    expect(sendNotFoundBreadcrumb).not.toHaveBeenCalled();
  });
});
