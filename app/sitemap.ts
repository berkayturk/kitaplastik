import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { PUBLIC_ROUTES, buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";

  return PUBLIC_ROUTES.flatMap((route) =>
    locales.map((locale) => {
      const alt = buildAlternates(route, origin);
      return {
        url: alt.languages[locale],
        changeFrequency: "monthly" as const,
        priority: route === "/" ? 1 : 0.7,
        alternates: {
          languages: alt.languages,
        },
      };
    }),
  );
}
