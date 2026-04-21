// app/[locale]/request-quote/custom/page.tsx
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { CustomRfqForm } from "@/components/rfq/CustomRfqForm";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rfq.custom" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/request-quote/custom`,
      languages: buildAlternates("/request-quote/custom", origin).languages,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rfq.custom");
  return (
    <section className="container mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-text-primary text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-text-secondary mt-2 text-sm md:text-base">{t("subtitle")}</p>
      </header>
      <CustomRfqForm />
    </section>
  );
}
