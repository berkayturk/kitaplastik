// app/[locale]/request-quote/page.tsx
//
// Catalog request landing page. Users enter their email + preferred PDF
// locale; the /api/catalog endpoint delivers the catalog to their inbox.
// Path kept at /request-quote for SEO continuity after the RFQ -> catalog
// pivot (with pretty /teklif-iste redirect for TR).

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { CatalogRequestForm } from "@/components/catalog/CatalogRequestForm";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog.page" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/request-quote", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("description"),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog.page");
  return (
    <section className="container mx-auto max-w-3xl px-6 py-10 md:py-14">
      <header className="mb-8">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-text-primary mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-text-secondary mt-3 text-sm md:text-base">{t("description")}</p>
      </header>
      <CatalogRequestForm />
    </section>
  );
}
