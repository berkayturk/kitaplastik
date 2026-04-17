import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

const ROUTE = "/sektorler/cam-yikama";
const NS = "sectors.camYikama";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${NS}.hero` });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}${ROUTE}`,
      languages: buildAlternates(ROUTE, origin).languages,
    },
  };
}

export default async function CamYikamaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(NS);
  const tCta = await getTranslations("common.cta");

  const solutions = t.raw("solutions.items") as ReadonlyArray<{
    title: string;
    description: string;
  }>;
  const materials = t.raw("materials.items") as ReadonlyArray<string>;

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

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-text-primary text-2xl font-semibold">{t("solutions.title")}</h2>
          <ul role="list" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {solutions.map((item) => (
              <li
                key={item.title}
                className="rounded-lg border border-[var(--color-border-subtle-dark)] p-5"
              >
                <h3 className="text-text-primary font-semibold">{item.title}</h3>
                <p className="text-text-secondary mt-1 text-sm">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside>
          <h2 className="text-text-primary text-2xl font-semibold">{t("materials.title")}</h2>
          <ul role="list" className="mt-6 space-y-2 font-mono text-sm">
            {materials.map((mat) => (
              <li
                key={mat}
                className="text-text-primary rounded border border-[var(--color-border-subtle-dark)] px-3 py-2"
              >
                {mat}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="mt-16 flex flex-wrap gap-4">
        <Link
          href="/iletisim"
          className="rounded bg-[var(--color-accent-red)] px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          {tCta("requestQuote")}
        </Link>
        <Link
          href="/sektorler"
          className="text-text-primary rounded border border-[var(--color-border-subtle-dark)] px-6 py-3 font-medium transition hover:border-[var(--color-accent-red)]"
        >
          ← {tCta("exploreSectors")}
        </Link>
      </div>
    </section>
  );
}
