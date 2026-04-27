import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/about", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

export default async function HakkimizdaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.about");

  const values = t.raw("values.items") as ReadonlyArray<{
    title: string;
    description: string;
  }>;

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <article className="prose-invert mt-16 max-w-3xl">
        <h2 className="text-text-primary text-2xl font-semibold">{t("story.title")}</h2>
        <p className="text-text-secondary mt-4 text-lg leading-relaxed">{t("story.body")}</p>
      </article>

      <section className="mt-16">
        <h2 className="text-text-primary text-2xl font-semibold">{t("values.title")}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-lg border border-[var(--color-border-subtle-dark)] p-6"
            >
              <h3 className="text-text-primary font-semibold">{v.title}</h3>
              <p className="text-text-secondary mt-2 text-sm">{v.description}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
