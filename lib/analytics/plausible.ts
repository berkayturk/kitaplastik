// lib/analytics/plausible.ts
//
// Type-safe Plausible event dispatcher. Invokes window.plausible()
// injected by <PlausibleScript />. No-ops in SSR or if script absent
// (dev, CI, ad-blocked clients).
//
// Event catalog is a discriminated union — adding a new event requires
// extending PlausibleEvent and its consumer. Keeps props shape contracts
// tight across call sites.

export type PlausibleEvent =
  | { name: "Contact Submitted" }
  | { name: "Catalog Requested"; props: { locale: string; sector: string } }
  | { name: "Locale Changed"; props: { to: string } }
  | { name: "Sector Clicked"; props: { slug: string } };

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

export function trackPlausible(event: PlausibleEvent): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  const options = "props" in event ? { props: event.props } : undefined;
  window.plausible(event.name, options);
}
