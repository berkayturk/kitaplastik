import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { ReferenceCard } from "@/components/references/ReferenceCard";
import { getReferences } from "@/lib/references/data";
import { safeTranslate } from "@/lib/utils/safe-translate";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "references.page" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("hero.title")} | Kıta Plastik`,
    description: t("hero.subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/references`,
      languages: buildAlternates("/references", origin).languages,
    },
  };
}

const SECTOR_NS_KEY = {
  camYikama: "hub.camYikama.title",
  kapak: "hub.kapak.title",
  tekstil: "hub.tekstil.title",
} as const;

export default async function ReferencesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tPage = await getTranslations("references.page");
  const tClients = await getTranslations("references.clients");
  const tSectors = await getTranslations("sectors");

  const references = await getReferences();

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{tPage("hero.eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {tPage("hero.title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{tPage("hero.subtitle")}</p>
      </header>

      <h2 className="text-text-primary mt-12 text-2xl font-semibold">{tPage("sectionTitle")}</h2>

      {references.length === 0 ? (
        <p className="text-text-secondary mt-6">{tPage("empty")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {references.map((ref) => {
            const clientName =
              ref.displayName?.[locale]?.trim() ||
              safeTranslate((k) => tClients(k), `${ref.key}.name`) ||
              ref.key;
            return (
              <ReferenceCard
                key={ref.id}
                reference={ref}
                clientName={clientName}
                sectorLabel={tSectors(SECTOR_NS_KEY[ref.sectorKey])}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
