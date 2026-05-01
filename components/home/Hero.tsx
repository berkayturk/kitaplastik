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
        <div className="grid items-center gap-16 py-24 md:py-32 lg:grid-cols-12 lg:gap-8 lg:py-40">
          {/* Left: typographic voice */}
          <div className="lg:col-span-7">
            <p className="eyebrow">{t("eyebrow")}</p>

            <h1
              id="hero-title"
              className="font-display mt-8 max-w-3xl text-[44px] leading-[1.02] font-medium tracking-[-0.02em] text-[var(--color-text-primary)] md:text-[64px] lg:text-[76px]"
              style={{ fontOpticalSizing: "auto" }}
            >
              {t("titleLead")}{" "}
              <span className="text-[var(--color-accent-cobalt)] italic">{t("titleAccent")}</span>
            </h1>

            <p className="mt-8 max-w-[520px] text-[17px] leading-[1.55] text-[var(--color-text-secondary)] md:text-[18px]">
              {t("subtitle")}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/request-quote"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                {t("primaryCta")} →
              </Link>
              <Link
                href="/products"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                {t("secondaryCta")}
              </Link>
            </div>
          </div>

          {/* Right: KPI stack — concrete numbers (research §3.4 Hermle pattern) */}
          <aside
            aria-label="Üretim özeti"
            className="flex flex-col gap-8 border-s border-[var(--color-border-hairline)] ps-8 lg:col-span-5 lg:ps-10"
          >
            <Kpi value="36" unit="yıl" label="süreklilik · 1989'dan beri Bursa'da" />
            <Kpi value="3" unit="sektör" label="cam yıkama · otomotiv · tekstil" />
            <Kpi value="4" unit="dil" label="TR · EN · RU · AR küresel tedarik" />
            <Kpi value="±0.02" unit="mm" label="teslim toleransı" />
          </aside>
        </div>
      </Container>
    </section>
  );
}

function Kpi({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[40px] leading-none font-medium tracking-[-0.02em] text-[var(--color-text-primary)] tabular-nums md:text-[48px]">
          {value}
        </span>
        <span className="font-mono text-[13px] font-medium tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
          {unit}
        </span>
      </div>
      <p className="mt-2 text-[14px] leading-[1.45] text-[var(--color-text-secondary)]">{label}</p>
    </div>
  );
}
