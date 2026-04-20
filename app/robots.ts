import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/design-debug"] }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
