import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.engineering.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/muhendislik`,
      languages: buildAlternates("/muhendislik", origin).languages,
    },
  };
}

export default async function MuhendislikPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.engineering");
  const tCta = await getTranslations("common.cta");

  const steps = t.raw("process.steps") as ReadonlyArray<{
    title: string;
    description: string;
  }>;
  const capabilities = t.raw("capabilities.items") as ReadonlyArray<{
    label: string;
    value: string;
  }>;

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

      <div className="mt-16">
        <h2 className="text-text-primary text-2xl font-semibold">{t("process.title")}</h2>
        <ol role="list" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.title}
              className="rounded-lg border border-[var(--color-border-subtle-dark)] p-5"
            >
              <h3 className="text-text-primary font-semibold">{step.title}</h3>
              <p className="text-text-secondary mt-2 text-sm">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-16">
        <h2 className="text-text-primary text-2xl font-semibold">{t("capabilities.title")}</h2>
        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {capabilities.map((cap) => (
            <div key={cap.label} className="border-b border-[var(--color-border-subtle-dark)] pb-3">
              <dt className="text-text-secondary font-mono text-xs tracking-wider uppercase">
                {cap.label}
              </dt>
              <dd className="text-text-primary mt-1 font-medium">{cap.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <aside className="bg-bg-secondary/30 mt-16 rounded-lg border border-[var(--color-border-subtle-dark)] p-6">
        <h2 className="text-text-primary text-lg font-semibold">{t("confidentiality.title")}</h2>
        <p className="text-text-secondary mt-2">{t("confidentiality.body")}</p>
      </aside>

      <div className="mt-16">
        <Link
          href="/iletisim"
          className="rounded bg-[var(--color-accent-red)] px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          {tCta("requestQuote")}
        </Link>
      </div>
    </section>
  );
}
