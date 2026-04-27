import type { ReactNode } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { getCompany } from "@/lib/company";
import {
  LegalLayout,
  LegalSection,
  LegalTable,
  LegalDisclaimer,
  LegalControllerBlock,
} from "@/components/legal";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/legal/privacy", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: (t.raw("intro") as string).replace(/<[^>]+>/g, "").slice(0, 160),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tMeta, tShared, company] = await Promise.all([
    getTranslations("legal.privacy"),
    getTranslations("legal.meta"),
    getTranslations("legal.shared"),
    getCompany(),
  ]);

  const richTags = {
    mail: (chunks: ReactNode) => (
      <a href={`mailto:${company.email.primary}`} className="underline">
        {chunks}
      </a>
    ),
    strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
    kvkk: (chunks: ReactNode) => (
      <a
        href="https://www.kvkk.gov.tr"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {chunks}
      </a>
    ),
  };

  const purposesBulletsRaw = t.raw("sections.purposes.bullets") as unknown;
  const purposesBullets = Array.isArray(purposesBulletsRaw) ? (purposesBulletsRaw as string[]) : [];

  const rightsBulletsRaw = t.raw("sections.rights.bullets") as unknown;
  const rightsBullets = Array.isArray(rightsBulletsRaw) ? (rightsBulletsRaw as string[]) : [];

  const staticFactsRaw = t.raw("staticFacts") as {
    taxOffice: string;
    mersisNo: string;
    kep?: string | null;
    verbisStatus: string;
    dpoStatus: string;
  };

  return (
    <LegalLayout title={t("title")} intro={t.rich("intro", richTags)}>
      <LegalSection heading={t("sections.controller.heading")}>
        <LegalControllerBlock
          company={company}
          labels={{
            legalName: t("sections.controller.fields.legalName"),
            address: t("sections.controller.fields.address"),
            phone: t("sections.controller.fields.phone"),
            email: t("sections.controller.fields.email"),
            taxOffice: t("sections.controller.fields.taxOffice"),
            mersisNo: t("sections.controller.fields.mersisNo"),
            kep: t("sections.controller.fields.kep"),
            verbisStatus: t("sections.controller.fields.verbisStatus"),
            dpoStatus: t("sections.controller.fields.dpoStatus"),
          }}
          staticFacts={{
            taxOffice: staticFactsRaw.taxOffice,
            mersisNo: staticFactsRaw.mersisNo,
            kep: staticFactsRaw.kep,
            verbisStatus: staticFactsRaw.verbisStatus,
            dpoStatus: staticFactsRaw.dpoStatus,
          }}
        />
      </LegalSection>

      <LegalSection heading={t("sections.purposes.heading")}>
        <ul className="ms-5 list-disc space-y-1.5">
          {purposesBullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection heading={t("sections.legalBasis.heading")}>
        <p>{t.rich("sections.legalBasis.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.categories.heading")}>
        <LegalTable
          caption={t("sections.categories.heading")}
          cols={t.raw("sections.categories.cols") as Record<string, string>}
          rows={t.raw("sections.categories.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.thirdParties.heading")}>
        <p>{t.rich("sections.thirdParties.body", richTags)}</p>
        <LegalTable
          caption={t("sections.thirdParties.heading")}
          cols={t.raw("sections.thirdParties.cols") as Record<string, string>}
          rows={t.raw("sections.thirdParties.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.retention.heading")}>
        <p>{t.rich("sections.retention.body", richTags)}</p>
        <LegalTable
          caption={t("sections.retention.heading")}
          cols={t.raw("sections.retention.cols") as Record<string, string>}
          rows={t.raw("sections.retention.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.rights.heading")}>
        <ul className="ms-5 list-disc space-y-1.5">
          {rightsBullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection heading={t("sections.application.heading")}>
        <p>{t.rich("sections.application.body", richTags)}</p>
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
