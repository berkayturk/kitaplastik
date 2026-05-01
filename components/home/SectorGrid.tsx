import { getTranslations } from "next-intl/server";
import { Container } from "../layout/Container";
import { SectorPreviewGrid } from "@/components/public/sectors/SectorPreviewGrid";

export async function SectorGrid() {
  const t = await getTranslations("home.sectors");

  return (
    <section className="py-14 md:py-20" aria-label={t("eyebrow")}>
      <Container>
        <header className="max-w-2xl">
          <p className="eyebrow">
            {t("eyebrow")} · <span className="font-mono opacity-60">01 — 03</span>
          </p>
          <h2
            className="font-display mt-4 text-[32px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[40px]"
            style={{ fontOpticalSizing: "auto" }}
          >
            {t("title")}
          </h2>
        </header>

        <div className="mt-10">
          <SectorPreviewGrid namespace="home.sectors" />
        </div>
      </Container>
    </section>
  );
}
