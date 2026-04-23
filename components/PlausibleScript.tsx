// components/PlausibleScript.tsx
//
// Env-guarded Plausible tracker served via SAME-ORIGIN PROXY. Script and
// event endpoint both resolve to /pa/* on kitaplastik.com; next.config.ts
// beforeFiles rewrites forward /pa/script.js and /pa/event to the
// NEXT_PUBLIC_PLAUSIBLE_HOST upstream. Same-origin path bypasses common
// adblock filter lists that target external /js/script.js + /api/event.
// host env is still used as a "is Plausible configured?" presence gate;
// the actual value is read by next.config.ts for the rewrite destination.

import Script from "next/script";

export function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST;

  if (!domain || !host) return null;

  return (
    <Script
      defer
      data-domain={domain}
      data-api="/pa/event"
      src="/pa/script.js"
      strategy="afterInteractive"
    />
  );
}
