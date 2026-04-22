// app/catalog-template/[sector]/[lang]/layout.tsx
//
// Root layout for the internal Puppeteer render target. Produces its own
// <html>/<body> (the project's app/layout.tsx is pass-through). Two guards:
//   1. Middleware excludes /catalog-template/* (no intl prefix).
//   2. In production, requests must carry x-catalog-template-secret matching
//      CATALOG_TEMPLATE_SECRET; missing/mismatched → notFound(). Puppeteer
//      sets this header via page.setExtraHTTPHeaders() before goto(). This
//      keeps crawlers and curious visitors from seeing the raw template.
// In local dev without a secret set, the guard is bypassed so designers can
// iterate against /catalog-template/kapak/tr in a browser.

import "../../globals.css";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  robots: { index: false, follow: false },
};

type Lang = "tr" | "en" | "ru" | "ar";
const VALID_LANGS: readonly Lang[] = ["tr", "en", "ru", "ar"];

interface CatalogTemplateLayoutProps {
  children: ReactNode;
  params: Promise<{ sector: string; lang: string }>;
}

async function assertInternalRequest(): Promise<void> {
  const secret = serverEnv.CATALOG_TEMPLATE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") notFound();
    return;
  }
  const h = await headers();
  const presented = h.get("x-catalog-template-secret");
  if (presented !== secret) notFound();
}

export default async function CatalogTemplateLayout({
  children,
  params,
}: CatalogTemplateLayoutProps) {
  await assertInternalRequest();
  const { lang } = await params;
  const safeLang = (VALID_LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "tr";
  const dir = safeLang === "ar" ? "rtl" : "ltr";
  return (
    <html lang={safeLang} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
