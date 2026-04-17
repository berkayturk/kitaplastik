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
  const t = await getTranslations({ locale, namespace: "pages.contact.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/iletisim`,
      languages: buildAlternates("/iletisim", origin).languages,
    },
  };
}

export default async function IletisimPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");

  const rows: ReadonlyArray<{ label: string; value: string; href?: string }> = [
    { label: t("details.addressLabel"), value: t("details.address") },
    { label: t("details.phoneLabel"), value: t("details.phone"), href: "tel:+90224" },
    {
      label: t("details.emailLabel"),
      value: t("details.email"),
      href: "mailto:info@kitaplastik.com",
    },
    { label: t("details.hoursLabel"), value: t("details.hours") },
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

      <dl className="mt-16 max-w-2xl divide-y divide-[var(--color-border-subtle-dark)]">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 gap-4 py-4">
            <dt className="text-text-secondary font-mono text-xs tracking-wider uppercase">
              {row.label}
            </dt>
            <dd className="text-text-primary col-span-2">
              {row.href ? (
                <a href={row.href} className="underline underline-offset-4">
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <aside className="bg-bg-secondary/30 mt-12 max-w-2xl rounded-lg border border-[var(--color-border-subtle-dark)] p-6">
        <p className="text-text-secondary text-sm">{t("formNotice")}</p>
      </aside>
    </section>
  );
}
