import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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
