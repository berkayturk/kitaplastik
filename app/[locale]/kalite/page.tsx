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
  const t = await getTranslations({ locale, namespace: "pages.quality.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/kalite`,
      languages: buildAlternates("/kalite", origin).languages,
    },
  };
}

export default async function KalitePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.quality");

  const certificates = t.raw("certificates.items") as ReadonlyArray<{
    name: string;
    description: string;
  }>;
  const processItems = t.raw("process.items") as ReadonlyArray<string>;

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

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-text-primary text-2xl font-semibold">{t("certificates.title")}</h2>
          <ul role="list" className="mt-6 space-y-4">
            {certificates.map((cert) => (
              <li
                key={cert.name}
                className="rounded-lg border border-[var(--color-border-subtle-dark)] p-5"
              >
                <h3 className="text-text-primary font-semibold">{cert.name}</h3>
                <p className="text-text-secondary mt-1 text-sm">{cert.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-text-primary text-2xl font-semibold">{t("process.title")}</h2>
          <ol role="list" className="mt-6 space-y-3">
            {processItems.map((step, idx) => (
              <li key={step} className="flex gap-4">
                <span className="text-text-secondary font-mono text-sm">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-text-primary">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
