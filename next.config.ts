import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://challenges.cloudflare.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://cloudflareinsights.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    // Same-origin proxy for Plausible script + event endpoint. Defeats
    // adblock filter lists targeting plausible.* domains and /js/script.js
    // + /api/event paths. Empty array when _HOST unset (dev, CI) so the
    // PlausibleScript component's env guard is the single source of truth
    // for "is Plausible enabled".
    const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST?.replace(/\/$/, "");
    if (!plausibleHost) return [];
    return {
      beforeFiles: [
        { source: "/pa/script.js", destination: `${plausibleHost}/js/script.js` },
        { source: "/pa/event", destination: `${plausibleHost}/api/event` },
      ],
    };
  },
  async redirects() {
    return [
      // Plan 3 legacy TR deep links → new TR canonical (catalog) 1-hop
      {
        source: "/tr/teklif-iste",
        destination: "/tr/katalog",
        permanent: true,
      },
      {
        source: "/tr/teklif-iste/:rest*",
        destination: "/tr/katalog",
        permanent: true,
      },
      // Plan 4a legacy EN-canonical → new per-locale native (TR)
      { source: "/tr/products", destination: "/tr/urunler", permanent: true },
      { source: "/tr/about", destination: "/tr/hakkimizda", permanent: true },
      { source: "/tr/contact", destination: "/tr/iletisim", permanent: true },
      { source: "/tr/references", destination: "/tr/referanslar", permanent: true },
      { source: "/tr/request-quote", destination: "/tr/katalog", permanent: true },
      {
        source: "/tr/request-quote/:sub(custom|standard)",
        destination: "/tr/katalog",
        permanent: true,
      },
      // 2026-05-01: /sectors → /products kategori yapısı taşıması
      // Eski sektör hub'ı ve detayları artık /products altında — TR locale
      { source: "/tr/sectors", destination: "/tr/urunler", permanent: true },
      { source: "/tr/sektorler", destination: "/tr/urunler", permanent: true },
      {
        source: "/tr/sectors/bottle-washing",
        destination: "/tr/urunler/cam-yikama",
        permanent: true,
      },
      {
        source: "/tr/sektorler/cam-yikama",
        destination: "/tr/urunler/cam-yikama",
        permanent: true,
      },
      {
        source: "/tr/sectors/automotive",
        destination: "/tr/urunler/otomotiv",
        permanent: true,
      },
      { source: "/tr/sektorler/otomotiv", destination: "/tr/urunler/otomotiv", permanent: true },
      {
        source: "/tr/sectors/textile",
        destination: "/tr/urunler/tekstil",
        permanent: true,
      },
      { source: "/tr/sektorler/tekstil", destination: "/tr/urunler/tekstil", permanent: true },
      // /sectors/caps deprecated 2026-04-30 (preserved)
      { source: "/tr/sectors/caps", destination: "/tr/urunler", permanent: true },
      { source: "/tr/sektorler/kapak", destination: "/tr/urunler", permanent: true },

      // Plan 4a legacy EN-canonical → new per-locale native (RU)
      { source: "/ru/products", destination: "/ru/produktsiya", permanent: true },
      { source: "/ru/about", destination: "/ru/o-nas", permanent: true },
      { source: "/ru/contact", destination: "/ru/kontakty", permanent: true },
      { source: "/ru/references", destination: "/ru/otzyvy", permanent: true },
      { source: "/ru/request-quote", destination: "/ru/katalog", permanent: true },
      {
        source: "/ru/request-quote/:sub(custom|standard)",
        destination: "/ru/katalog",
        permanent: true,
      },
      // 2026-05-01: /sectors → /products taşıması (RU)
      { source: "/ru/sectors", destination: "/ru/produktsiya", permanent: true },
      { source: "/ru/otrasli", destination: "/ru/produktsiya", permanent: true },
      {
        source: "/ru/sectors/bottle-washing",
        destination: "/ru/produktsiya/moyka-butylok",
        permanent: true,
      },
      {
        source: "/ru/otrasli/moyka-butylok",
        destination: "/ru/produktsiya/moyka-butylok",
        permanent: true,
      },
      {
        source: "/ru/sectors/automotive",
        destination: "/ru/produktsiya/avtoprom",
        permanent: true,
      },
      { source: "/ru/otrasli/avtoprom", destination: "/ru/produktsiya/avtoprom", permanent: true },
      {
        source: "/ru/sectors/textile",
        destination: "/ru/produktsiya/tekstil",
        permanent: true,
      },
      { source: "/ru/otrasli/tekstil", destination: "/ru/produktsiya/tekstil", permanent: true },
      { source: "/ru/sectors/caps", destination: "/ru/produktsiya", permanent: true },
      { source: "/ru/otrasli/kryshki", destination: "/ru/produktsiya", permanent: true },

      // Plan 4a legacy EN-canonical → new per-locale native (AR)
      { source: "/ar/products", destination: "/ar/al-muntajat", permanent: true },
      { source: "/ar/about", destination: "/ar/man-nahnu", permanent: true },
      { source: "/ar/contact", destination: "/ar/ittisal", permanent: true },
      { source: "/ar/references", destination: "/ar/maraji", permanent: true },
      { source: "/ar/request-quote", destination: "/ar/al-katalog", permanent: true },
      {
        source: "/ar/request-quote/:sub(custom|standard)",
        destination: "/ar/al-katalog",
        permanent: true,
      },
      // 2026-05-01: /sectors → /products taşıması (AR)
      { source: "/ar/sectors", destination: "/ar/al-muntajat", permanent: true },
      { source: "/ar/al-qitaat", destination: "/ar/al-muntajat", permanent: true },
      {
        source: "/ar/sectors/bottle-washing",
        destination: "/ar/al-muntajat/ghasil-zujajat",
        permanent: true,
      },
      {
        source: "/ar/al-qitaat/ghasil-zujajat",
        destination: "/ar/al-muntajat/ghasil-zujajat",
        permanent: true,
      },
      {
        source: "/ar/sectors/automotive",
        destination: "/ar/al-muntajat/al-sayyarat",
        permanent: true,
      },
      {
        source: "/ar/al-qitaat/al-sayyarat",
        destination: "/ar/al-muntajat/al-sayyarat",
        permanent: true,
      },
      {
        source: "/ar/sectors/textile",
        destination: "/ar/al-muntajat/al-mansujat",
        permanent: true,
      },
      {
        source: "/ar/al-qitaat/al-mansujat",
        destination: "/ar/al-muntajat/al-mansujat",
        permanent: true,
      },
      { source: "/ar/sectors/caps", destination: "/ar/al-muntajat", permanent: true },
      { source: "/ar/al-qitaat/al-aghtiya", destination: "/ar/al-muntajat", permanent: true },

      // EN locale: /sectors taşıma (yeni — daha önce yoktu)
      { source: "/en/sectors", destination: "/en/products", permanent: true },
      {
        source: "/en/sectors/bottle-washing",
        destination: "/en/products/bottle-washing",
        permanent: true,
      },
      {
        source: "/en/sectors/automotive",
        destination: "/en/products/automotive",
        permanent: true,
      },
      {
        source: "/en/sectors/textile",
        destination: "/en/products/textile",
        permanent: true,
      },
      { source: "/en/sectors/caps", destination: "/en/products", permanent: true },

      // Admin (preserved from Plan 4a)
      {
        source: "/admin/ayarlar/bildirimler",
        destination: "/admin/settings/notifications",
        permanent: true,
      },
    ];
  },
};

// Existing withNextIntl wrap composed with Sentry's webpack plugin.
// Source map upload runs at build time when SENTRY_AUTH_TOKEN is set.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: "kitaplastik",
  project: "web",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: false,
});
