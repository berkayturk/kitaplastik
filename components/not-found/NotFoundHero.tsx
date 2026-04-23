import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { BlueprintIllustration } from "./BlueprintIllustration";
import { NotFoundClientSignals } from "./NotFoundClientSignals";

export function NotFoundHero() {
  const t = useTranslations("common.notFound");

  return (
    <section className="border-b border-[var(--color-border-hairline)]">
      <Container>
        <div className="grid items-center gap-10 py-20 lg:grid-cols-12 lg:gap-8 lg:py-28">
          <div className="lg:col-span-8">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="font-display mt-6 text-[44px] leading-[1.02] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] md:text-[56px] lg:text-[64px]">
              {t("title")}
            </h1>
            <p className="text-text-secondary mt-6 max-w-xl text-lg">{t("description")}</p>
            <NotFoundClientSignals label={t("urlEchoLabel")} />
          </div>
          <div className="flex justify-center lg:col-span-4 lg:justify-end">
            <BlueprintIllustration />
          </div>
        </div>
      </Container>
    </section>
  );
}
