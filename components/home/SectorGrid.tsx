import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "../layout/Container";

interface SectorKey {
  slug: string;
  nsKey: "camYikama" | "kapak" | "tekstil";
  color: string;
}

const SECTORS: readonly SectorKey[] = [
  { slug: "cam-yikama", nsKey: "camYikama", color: "var(--color-sector-cam)" },
  { slug: "kapak", nsKey: "kapak", color: "var(--color-sector-kapak)" },
  { slug: "tekstil", nsKey: "tekstil", color: "var(--color-sector-tekstil)" },
];

export function SectorGrid() {
  const t = useTranslations("home.sectors");
  const tCta = useTranslations("common.cta");
  const sectionLabel = t("eyebrow");

  return (
    <section className="py-20" aria-label={sectionLabel}>
      <Container>
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow text-accent-blue">
              {sectionLabel}
              <span className="mx-2 opacity-50" aria-hidden="true">
                /
              </span>
              <span className="opacity-50" aria-hidden="true">
                01–03
              </span>
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {SECTORS.map((sector) => (
            <Link
              key={sector.slug}
              href={`/sektorler/${sector.slug}`}
              className="group bg-bg-primary/80 block rounded-sm border border-[var(--color-border-subtle-dark)] p-6 backdrop-blur-sm transition-colors hover:border-[var(--color-accent-blue)]"
            >
              <span
                className="eyebrow block"
                style={{ color: sector.color, letterSpacing: "0.2em" }}
              >
                {sectionLabel}
              </span>
              <h3 className="mt-3 text-2xl font-semibold">{t(`${sector.nsKey}.title`)}</h3>
              <p className="text-text-secondary mt-3 text-sm">{t(`${sector.nsKey}.description`)}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-blue)] transition-transform group-hover:translate-x-1">
                {tCta("learnMore")} →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
