// lib/catalog/pdf-generator.ts
//
// Puppeteer wrapper that renders /catalog-template/[sector]/[lang] into a
// print-A4 PDF. A single Chromium process is reused across requests — the
// cost of launching is dominated by spinning up the renderer, so we keep
// one warm and create a fresh page per call.
//
// Deployment:
//   - Coolify / Nixpacks: PUPPETEER_EXECUTABLE_PATH points at the system
//     chromium installed via nixpacks.toml.
//   - Local dev: either set PUPPETEER_EXECUTABLE_PATH or let puppeteer-core
//     auto-discover a system Chrome (falls back to common paths).

import "server-only";
import type { Browser, LaunchOptions } from "puppeteer-core";
import { serverEnv, env } from "@/lib/env";

// Cached across requests in the same process. A Node 22 global hook
// stores it so hot-reload in dev doesn't leak ghost instances.
interface CatalogBrowserGlobal {
  __catalogBrowser?: Browser | null;
  __catalogBrowserPromise?: Promise<Browser> | null;
}
const g = globalThis as CatalogBrowserGlobal;

const FALLBACK_PATHS = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

async function resolveExecutablePath(): Promise<string> {
  if (serverEnv.PUPPETEER_EXECUTABLE_PATH && serverEnv.PUPPETEER_EXECUTABLE_PATH.length > 0) {
    return serverEnv.PUPPETEER_EXECUTABLE_PATH;
  }
  // Local dev helper only — probe a handful of common paths.
  const { access } = await import("node:fs/promises");
  for (const p of FALLBACK_PATHS) {
    try {
      await access(p);
      return p;
    } catch {
      // try next
    }
  }
  throw new Error(
    "PUPPETEER_EXECUTABLE_PATH not set and no Chromium/Chrome binary found in common paths. " +
      "Install chromium (Linux) or set the env var explicitly.",
  );
}

async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");
  const executablePath = await resolveExecutablePath();
  const opts: LaunchOptions = {
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  };
  return puppeteer.launch(opts);
}

export async function getBrowser(): Promise<Browser> {
  if (g.__catalogBrowser && g.__catalogBrowser.connected) return g.__catalogBrowser;
  if (!g.__catalogBrowserPromise) {
    g.__catalogBrowserPromise = launchBrowser().then((b) => {
      g.__catalogBrowser = b;
      g.__catalogBrowserPromise = null;
      b.on("disconnected", () => {
        g.__catalogBrowser = null;
      });
      return b;
    });
  }
  return g.__catalogBrowserPromise;
}

interface RenderPdfInput {
  /** Absolute URL the browser should navigate to. Must resolve inside
   * the same process for fastest rendering (loopback). */
  templateUrl: string;
  /** Shared-secret header injected so the template guard accepts us. */
  templateSecret: string | null;
}

export interface RenderPdfResult {
  buffer: Buffer;
  renderedInMs: number;
}

export async function renderCatalogPdf(input: RenderPdfInput): Promise<RenderPdfResult> {
  const start = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    if (input.templateSecret) {
      await page.setExtraHTTPHeaders({ "x-catalog-template-secret": input.templateSecret });
    }
    // Match print media so @media print / @page rules apply during paint.
    await page.emulateMediaType("print");
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.goto(input.templateUrl, { waitUntil: "networkidle0", timeout: 30_000 });
    // Ensure web fonts are ready before snapshotting. `document.fonts.ready`
    // resolves when the FontFaceSet is stable.
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });
    return { buffer: Buffer.from(pdf), renderedInMs: Date.now() - start };
  } finally {
    await page.close().catch(() => {});
  }
}

/** Build the absolute URL Puppeteer should open. Prefers localhost loopback
 * when available (fastest; no TLS), falls back to the public site URL. */
export function buildTemplateUrl(sector: string, lang: string): string {
  const port = process.env.PORT ?? "3000";
  const inContainer = process.env.NODE_ENV === "production";
  if (!inContainer) {
    return `http://127.0.0.1:${port}/catalog-template/${sector}/${lang}`;
  }
  // In production (Coolify), the Next.js server listens on $PORT on
  // localhost; hitting loopback avoids the external proxy entirely.
  const base = process.env.CATALOG_TEMPLATE_ORIGIN ?? `http://127.0.0.1:${port}`;
  return `${base}/catalog-template/${sector}/${lang}`;
}

/** Optional cleanup helper for graceful shutdown (e.g. SIGTERM handler). */
export async function closeBrowser(): Promise<void> {
  const b = g.__catalogBrowser;
  g.__catalogBrowser = null;
  g.__catalogBrowserPromise = null;
  if (b) await b.close().catch(() => {});
}

// Used by the /api/catalog POST endpoint when building the email link.
export function buildPublicCatalogUrl(sector: string, lang: string): string {
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return `${origin}/api/catalog/${sector}/${lang}`;
}
