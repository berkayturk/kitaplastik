import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://challenges.cloudflare.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com",
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
  async redirects() {
    return [
      // Public route'lar — locale-prefixed (tr|en|ru|ar)
      {
        source: "/:locale(tr|en|ru|ar)/urunler",
        destination: "/:locale/products",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/urunler/:rest*",
        destination: "/:locale/products/:rest*",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler/cam-yikama",
        destination: "/:locale/sectors/bottle-washing",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler/kapak",
        destination: "/:locale/sectors/caps",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler/tekstil",
        destination: "/:locale/sectors/textile",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler",
        destination: "/:locale/sectors",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/hakkimizda",
        destination: "/:locale/about",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/iletisim",
        destination: "/:locale/contact",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/referanslar",
        destination: "/:locale/references",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/teklif-iste/ozel-uretim",
        destination: "/:locale/request-quote/custom",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/teklif-iste/standart",
        destination: "/:locale/request-quote/standard",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/teklif-iste",
        destination: "/:locale/request-quote",
        permanent: true,
      },
      // Admin route
      {
        source: "/admin/ayarlar/bildirimler",
        destination: "/admin/settings/notifications",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
