import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.workshop.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/atolye`,
      languages: buildAlternates("/atolye", origin).languages,
    },
  };
}

export default async function AtolyePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.workshop");

  const stats = [
    { label: "area", value: t("stats.area") },
    { label: "machines", value: t("stats.machines") },
    { label: "capacity", value: t("stats.capacity") },
    { label: "staff", value: t("stats.staff") },
  ];

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-text-secondary font-mono text-xs tracking-wider uppercase">
          {t("hero.eyebrow")}
        </p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <dl className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-bg-secondary/60 rounded-lg border border-[var(--color-border-subtle-dark)] p-6"
          >
            <dt className="text-text-secondary font-mono text-xs tracking-wider uppercase">
              {s.label}
            </dt>
            <dd className="text-text-primary mt-2 text-2xl font-semibold tracking-tight">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
