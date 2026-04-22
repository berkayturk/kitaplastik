// app/catalog-template/[sector]/[lang]/page.tsx
//
// Internal render target that Puppeteer opens via page.goto(). Must be
// server-rendered (no client JS) so page.pdf() captures the fully painted
// DOM. All layout/chrome is derived from the query — no session, no
// cookies. The layout.tsx above owns the <html>/<body> elements and the
// shared-secret guard; this page returns CatalogDocument only.

import { notFound } from "next/navigation";
import { fetchCatalogData } from "@/lib/catalog/fetch-products";
import {
  isCatalogLocale,
  isCatalogSector,
  type CatalogLocale,
  type CatalogSector,
} from "@/lib/catalog/types";
import { CatalogDocument } from "@/components/catalog/CatalogDocument";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ sector: string; lang: string }>;
}

export default async function CatalogTemplatePage({ params }: PageProps) {
  const { sector, lang } = await params;
  if (!isCatalogSector(sector) || !isCatalogLocale(lang)) notFound();
  const data = await fetchCatalogData(sector as CatalogSector, lang as CatalogLocale);

  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const qrTarget =
    data.sector === "all"
      ? `${origin}/${lang}/request-quote`
      : `${origin}/${lang}/products?sector=${data.sector}`;

  return <CatalogDocument data={data} qrTarget={qrTarget} />;
}
