// app/api/catalog/[sector]/[lang]/route.ts
//
// Public dynamic catalog PDF endpoint. Flow:
//   1) validate sector + lang
//   2) compute dataHash from the current product set
//   3) check Supabase Storage cache; hit -> stream
//   4) miss -> render template through Puppeteer, upload, stream
// The cache key includes dataHash, so any product update implicitly
// invalidates all older variants.

import { NextResponse, type NextRequest } from "next/server";
import {
  isCatalogLocale,
  isCatalogSector,
  type CatalogLocale,
  type CatalogSector,
} from "@/lib/catalog/types";
import { fetchCatalogData } from "@/lib/catalog/fetch-products";
import { cacheKey, readCached, writeCached } from "@/lib/catalog/cache";
import { buildTemplateUrl, renderCatalogPdf } from "@/lib/catalog/pdf-generator";
import { serverEnv } from "@/lib/env";
import { catalogPdfLimiter, ipFromHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Generation is bounded by Puppeteer render time (~10 s cold, <1 s cache hit).
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ sector: string; lang: string }>;
}

function buildPdfResponse(pdf: Buffer, filename: string, cacheStatus: "HIT" | "MISS"): Response {
  // Response BodyInit accepts ArrayBuffer; slice the Buffer's backing
  // store to a fresh copy so no Node-specific types leak into the Web API.
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": String(pdf.byteLength),
      "content-disposition": `inline; filename="${filename}"`,
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "x-catalog-cache": cacheStatus,
    },
  });
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  const { sector, lang } = await ctx.params;

  if (!isCatalogSector(sector) || !isCatalogLocale(lang)) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const ip = ipFromHeaders(request.headers);
  const rl = catalogPdfLimiter.check(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  try {
    const data = await fetchCatalogData(sector as CatalogSector, lang as CatalogLocale);

    if (data.groups.length === 0 || data.dataHash === "") {
      return NextResponse.json({ ok: false, error: "empty_catalog" }, { status: 404 });
    }

    const filename = `kitaplastik-${sector}-${lang}.pdf`;
    const key = cacheKey(sector, lang, data.dataHash);

    // Cache hit?
    const cached = await readCached(key);
    if (cached) {
      return buildPdfResponse(cached, filename, "HIT");
    }

    // Cache miss → render. Template is fetched from localhost (no TLS).
    const templateUrl = buildTemplateUrl(sector, lang);
    const { buffer } = await renderCatalogPdf({
      templateUrl,
      templateSecret: serverEnv.CATALOG_TEMPLATE_SECRET ?? null,
    });

    // Best-effort cache write — never fail the user response if upload fails.
    try {
      await writeCached(key, buffer);
    } catch (e) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(e, {
        tags: { route: "api/catalog/[sector]/[lang]", phase: "cache_write", sector, lang },
      });
    }

    return buildPdfResponse(buffer, filename, "MISS");
  } catch (error) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      tags: { route: "api/catalog/[sector]/[lang]", phase: "render", sector, lang },
    });
    return NextResponse.json({ ok: false, error: "render_failed" }, { status: 500 });
  }
}
