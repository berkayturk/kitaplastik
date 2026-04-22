// components/PlausibleScript.tsx
//
// Env-guarded Plausible tracker. If either env is empty (dev, CI, test),
// renders null so no script is injected and no external call happens.
// Uses next/script with afterInteractive strategy for non-blocking load.

import Script from "next/script";

export function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST;

  if (!domain || !host) return null;

  const src = `${host.replace(/\/$/, "")}/js/script.js`;

  return <Script defer data-domain={domain} src={src} strategy="afterInteractive" />;
}
