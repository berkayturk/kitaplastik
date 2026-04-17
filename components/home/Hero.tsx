import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "../layout/Container";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[72dvh] items-center overflow-hidden border-b border-[var(--color-border-subtle-dark)] bg-transparent"
    >
      <Container>
        <div className="relative py-24 md:py-32 lg:py-40">
          <div className="eyebrow text-accent-cyan">{t("eyebrow")}</div>
          <h1
            id="hero-title"
            className="mt-6 max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl"
          >
            {t("titleLead")}{" "}
            <span className="text-[var(--color-accent-cyan)]">{t("titleAccent")}</span>
          </h1>
          <p className="text-text-secondary mt-6 max-w-xl text-lg">{t("subtitle")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/iletisim"
              className="rounded-sm bg-[var(--color-accent-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("primaryCta")}
            </Link>
            <Link
              href="/sektorler"
              className="rounded-sm border border-[var(--color-accent-blue)] px-6 py-3 text-sm font-semibold text-[var(--color-accent-blue)] transition-colors hover:bg-[var(--color-accent-blue)]/10"
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
