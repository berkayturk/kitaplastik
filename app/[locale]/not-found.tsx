import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotFoundHero } from "@/components/not-found/NotFoundHero";
import { RecoveryCards } from "@/components/not-found/RecoveryCards";
import { Container } from "@/components/layout/Container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.notFound");
  return {
    title: `${t("title")} — Kıta Plastik`,
    robots: { index: false, follow: true },
  };
}

export default function NotFound() {
  return (
    <>
      <NotFoundHero />
      <Container>
        <div className="pb-24">
          <RecoveryCards />
        </div>
      </Container>
    </>
  );
}
