// components/catalog/BackCover.tsx
//
// Full-bleed navy back cover. Contact block (serif titles + sans values),
// simple QR placeholder rendered as an SVG grid (deterministic from the
// target URL — not a real QR scanner payload; the URL is printed below
// as fallback), and copyright notice at the base.

import type { CatalogLocale } from "@/lib/catalog/types";
import type { CatalogChrome } from "@/lib/catalog/i18n";

interface BackCoverProps {
  chrome: CatalogChrome;
  locale: CatalogLocale;
  /** Absolute URL encoded into the QR code (catalog download page). */
  qrTarget: string;
}

interface Cell {
  x: number;
  y: number;
}

function buildQrCells(text: string): Cell[] {
  // Minimal deterministic pseudo-QR — enough to feel "like" a QR code on
  // the back cover without shipping a QR dependency. The URL is printed
  // below for real scanning. Swap for the `qrcode` package in a later
  // iteration if a scannable code becomes a requirement.
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  const cells: Cell[] = [];
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const corner = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const cornerFilled =
        corner &&
        (x === 0 ||
          x === 6 ||
          x === 14 ||
          x === 20 ||
          y === 0 ||
          y === 6 ||
          y === 14 ||
          y === 20 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= 16 && x <= 18 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= 16 && y <= 18));
      const bit = (y * 21 + x) % 32;
      const filled = corner ? cornerFilled : ((hash >> bit) ^ (hash * (x + 1) + y)) & 1;
      if (filled) cells.push({ x, y });
    }
  }
  return cells;
}

export function BackCover({ chrome, locale, qrTarget }: BackCoverProps) {
  const serifFamily = locale === "ar" ? "var(--kp-font-arabic)" : "var(--kp-font-serif)";
  const qrCells = buildQrCells(qrTarget);

  type ContactRow = { label: string; value: string; ltr?: boolean };
  const contactRows: ContactRow[] = (
    [
      { label: chrome.backCover.addressLabel, value: chrome.backCover.address },
      { label: chrome.backCover.phoneLabel, value: chrome.backCover.phone, ltr: true },
      { label: chrome.backCover.emailLabel, value: chrome.backCover.email, ltr: true },
      { label: chrome.backCover.webLabel, value: chrome.backCover.web, ltr: true },
    ] as ContactRow[]
  ).filter((r) => r.value.trim().length > 0);

  return (
    <section
      className="kp-page"
      style={{
        background: "var(--kp-navy)",
        color: "var(--kp-white)",
        padding: "52px 40px",
      }}
    >
      {/* Contact block */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "420px" }}>
        <span className="kp-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
          {chrome.backCover.contactTitle.toUpperCase()}
        </span>
        <h3
          style={{
            fontFamily: serifFamily,
            fontSize: "32px",
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: "-0.012em",
            margin: 0,
          }}
        >
          kıtaPLASTİK
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr",
            rowGap: "10px",
            columnGap: "16px",
          }}
        >
          {contactRows.map((row, i) => (
            <div key={i} style={{ display: "contents" }}>
              <span
                className="kp-mono"
                style={{ color: "rgba(255,255,255,0.55)", fontSize: "9px" }}
              >
                {row.label.toUpperCase()}
              </span>
              <span
                className={row.ltr ? "kp-ltr" : undefined}
                style={{
                  fontFamily: "var(--kp-font-sans)",
                  fontSize: "13px",
                  color: "var(--kp-white)",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* QR block */}
      <div
        style={{
          position: "absolute",
          right: "40px",
          bottom: "88px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            background: "var(--kp-white)",
            padding: "10px",
          }}
        >
          <svg
            viewBox="0 0 21 21"
            shapeRendering="crispEdges"
            style={{ width: "100%", height: "100%" }}
          >
            {qrCells.map(({ x, y }) => (
              <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill="#0B2545" />
            ))}
          </svg>
        </div>
        <span
          className="kp-mono kp-ltr"
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "8.5px",
            maxWidth: "160px",
            wordBreak: "break-all",
            textAlign: "right",
          }}
        >
          {qrTarget}
        </span>
      </div>

      {/* Copyright footer */}
      <div
        style={{
          position: "absolute",
          left: "40px",
          right: "40px",
          bottom: "36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "14px",
          borderTop: "0.5px solid rgba(255,255,255,0.18)",
          fontFamily: "var(--kp-font-mono)",
          fontSize: "8.5px",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
        }}
      >
        <span>{chrome.backCover.copyright}</span>
        <span className="kp-ltr">{chrome.runningFooter}</span>
      </div>
    </section>
  );
}
