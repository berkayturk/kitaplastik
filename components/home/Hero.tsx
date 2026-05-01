import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "../layout/Container";
import { buttonVariants } from "@/components/ui";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section
      aria-labelledby="hero-title"
      className="relative border-b border-[var(--color-border-hairline)]"
    >
      <Container>
        <div className="pt-8 pb-14 md:pt-10 md:pb-16 lg:pt-12 lg:pb-20">
          <p className="eyebrow">{t("eyebrow")}</p>

          <h1
            id="hero-title"
            className="font-display mt-3 max-w-3xl text-[36px] leading-[1.04] font-medium tracking-[-0.02em] text-[var(--color-text-primary)] md:text-[48px] lg:text-[60px]"
            style={{ fontOpticalSizing: "auto" }}
          >
            {t("titleLead")}{" "}
            <span className="text-[var(--color-accent-cobalt)] italic">{t("titleAccent")}</span>
          </h1>

          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.55] text-[var(--color-text-secondary)] md:text-[17px]">
            {t("subtitle")}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/request-quote"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {t("primaryCta")} →
            </Link>
            <Link href="/products" className={buttonVariants({ variant: "secondary", size: "md" })}>
              {t("secondaryCta")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
