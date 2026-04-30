import { useTranslations } from "next-intl";
import { Container } from "../layout/Container";
import { Card, CardEyebrow, CardTitle, CardBody, CardFooter } from "@/components/ui";
import { SectorCardLink } from "./SectorCardLink";

type SectorPathname = "/sectors/bottle-washing" | "/sectors/automotive" | "/sectors/textile";

interface SectorDef {
  pathname: SectorPathname;
  nsKey: "camYikama" | "otomotiv" | "tekstil";
  number: string;
  spec: string;
}

const SECTORS: readonly SectorDef[] = [
  {
    pathname: "/sectors/bottle-washing",
    nsKey: "camYikama",
    number: "01",
    spec: "Ø 80–320 mm · 12–480 g",
  },
  {
    pathname: "/sectors/automotive",
    nsKey: "otomotiv",
    number: "02",
    spec: "ABS · PC · PP · TPE — EV güvenlik aksesuarları",
  },
  {
    pathname: "/sectors/textile",
    nsKey: "tekstil",
    number: "03",
    spec: "POM · PA6 · abrasif aşınmaya dayanıklı",
  },
];

export function SectorGrid() {
  const t = useTranslations("home.sectors");
  const tCta = useTranslations("common.cta");

  return (
    <section className="py-24 md:py-32" aria-label={t("eyebrow")}>
      <Container>
        <header className="max-w-2xl">
          <p className="eyebrow">
            {t("eyebrow")} · <span className="font-mono opacity-60">01 — 03</span>
          </p>
          <h2
            className="font-display mt-4 text-[36px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[44px]"
            style={{ fontOpticalSizing: "auto" }}
          >
            {t("title")}
          </h2>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SECTORS.map((sector) => (
            <SectorCardLink
              key={sector.pathname}
              pathname={sector.pathname}
              slug={
                sector.pathname.replace("/sectors/", "") as
                  | "bottle-washing"
                  | "automotive"
                  | "textile"
              }
              className="group block focus-visible:outline-none"
            >
              <Card interactive className="h-full">
                <CardEyebrow>
                  <span className="text-[var(--color-accent-cobalt)]">Sektör</span>
                  <span className="mx-1 opacity-50">/</span>
                  <span className="font-mono">{sector.number}</span>
                </CardEyebrow>
                <CardTitle>{t(`${sector.nsKey}.title`)}</CardTitle>
                <CardBody>{t(`${sector.nsKey}.description`)}</CardBody>
                <CardFooter>
                  <span className="font-mono text-[12px] tracking-[0.02em] text-[var(--color-text-tertiary)]">
                    {sector.spec}
                  </span>
                  <span className="ms-auto text-[14px] font-medium text-[var(--color-accent-cobalt)] transition-transform duration-200 ease-out group-hover:translate-x-1">
                    {tCta("learnMore")} →
                  </span>
                </CardFooter>
              </Card>
            </SectorCardLink>
          ))}
        </div>
      </Container>
    </section>
  );
}
