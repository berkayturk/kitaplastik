import type { ReactNode } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { LegalLayout, LegalSection, LegalTable, LegalDisclaimer } from "@/components/legal";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.cookies" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/legal/cookies", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: (t.raw("intro") as string).replace(/<[^>]+>/g, "").slice(0, 160),
    alternates: {
      canonical: alternates.languages[locale],
      languages: alternates.languages,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CookiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tMeta, tShared] = await Promise.all([
    getTranslations("legal.cookies"),
    getTranslations("legal.meta"),
    getTranslations("legal.shared"),
  ]);

  const richTags = {
    strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
    privacyLink: (chunks: ReactNode) => (
      <Link href="/legal/privacy" className="underline">
        {chunks}
      </Link>
    ),
  };

  return (
    <LegalLayout title={t("title")} intro={t.rich("intro", richTags)}>
      <LegalSection heading={t("sections.what.heading")}>
        <p>{t.rich("sections.what.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.approach.heading")}>
        <p>{t.rich("sections.approach.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.inventory.heading")}>
        <LegalTable
          caption={t("sections.inventory.heading")}
          cols={t.raw("sections.inventory.cols") as Record<string, string>}
          rows={t.raw("sections.inventory.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.control.heading")}>
        <p>{t.rich("sections.control.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.changes.heading")}>
        <p>{t.rich("sections.changes.body", richTags)}</p>
      </LegalSection>

      <p className="text-text-secondary mt-12 text-[14px]">
        {tShared.rich("formConsentNotice", {
          privacyLink: (chunks) => (
            <Link href="/legal/privacy" className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>

      <LegalDisclaimer
        publishedLabel={tMeta("publishedLabel")}
        publishedDate={tMeta("publishedDate")}
        updatedLabel={tMeta("updatedLabel")}
        lastUpdated={tMeta("lastUpdated")}
        text={tMeta("disclaimer")}
      />
    </LegalLayout>
  );
}
