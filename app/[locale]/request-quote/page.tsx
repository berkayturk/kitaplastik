// app/[locale]/teklif-iste/page.tsx
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rfq.hub" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("customDescription"),
    alternates: {
      canonical: `${origin}/${locale}/teklif-iste`,
      languages: buildAlternates("/teklif-iste", origin).languages,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rfq.hub");
  return (
    <section className="container mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-text-primary mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/teklif-iste/ozel-uretim"
          className="bg-bg-secondary/40 block rounded-lg border border-[var(--color-border-subtle-dark)] p-6 transition hover:border-[var(--color-accent-red)]/50"
        >
          <h2 className="text-text-primary text-xl font-semibold">{t("customTitle")}</h2>
          <p className="text-text-secondary mt-2 text-sm">{t("customDescription")}</p>
        </Link>
        <Link
          href="/teklif-iste/standart"
          className="bg-bg-secondary/40 block rounded-lg border border-[var(--color-border-subtle-dark)] p-6 transition hover:border-[var(--color-accent-blue)]/50"
        >
          <h2 className="text-text-primary text-xl font-semibold">{t("standartTitle")}</h2>
          <p className="text-text-secondary mt-2 text-sm">{t("standartDescription")}</p>
        </Link>
      </div>
    </section>
  );
}
