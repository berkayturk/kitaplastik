// components/catalog/Cover.tsx
//
// Full-bleed navy cover page. Top strip wordmark + establishment line,
// centred title block ("Ürün Kataloğu 2026." — final period painted
// blue as an editorial detail), bottom strip with sector list + locale
// toggle, decorative concentric-circle motif top-right at 8% opacity.

import type { CatalogLocale } from "@/lib/catalog/types";
import type { CatalogChrome } from "@/lib/catalog/i18n";

interface CoverProps {
  chrome: CatalogChrome;
  locale: CatalogLocale;
  sectorTitle: string | null;
  sectorNumber: number | null;
}

export function Cover({ chrome, locale, sectorTitle, sectorNumber }: CoverProps) {
  // Split the title on the final period so we can tint it blue.
  const title = chrome.coverTitle;
  const finalDotIndex = title.lastIndexOf(".");
  const titleBody = finalDotIndex === title.length - 1 ? title.slice(0, finalDotIndex) : title;
  const titleTail = finalDotIndex === title.length - 1 ? "." : "";
  const sectorWord = chrome.sectorWord;
  const serifFamily = locale === "ar" ? "var(--kp-font-arabic)" : "var(--kp-font-serif)";

  return (
    <section
      className="kp-page"
      style={{
        background: "var(--kp-navy)",
        color: "var(--kp-white)",
        padding: "28px",
      }}
    >
      {/* Top strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingBottom: "10px",
          borderBottom: "0.5px solid rgba(255,255,255,0.24)",
        }}
      >
        <span style={{ fontFamily: serifFamily, fontSize: "15px", letterSpacing: "-0.01em" }}>
          <span style={{ fontWeight: 500 }}>kıta</span>
          <span style={{ fontWeight: 400 }}>PLASTİK</span>
        </span>
        <span className="kp-mono" style={{ color: "rgba(255,255,255,0.6)" }}>
          {chrome.establishment}
        </span>
      </div>

      {/* Decorative concentric circles (top-right, opacity 0.08) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        style={{
          position: "absolute",
          top: "40px",
          right: "-80px",
          width: "280px",
          height: "280px",
          opacity: 0.08,
          pointerEvents: "none",
        }}
      >
        {[30, 60, 90, 120, 150, 180].map((r) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke="var(--kp-white)"
            strokeWidth="0.8"
          />
        ))}
        <circle cx="200" cy="200" r="12" fill="var(--kp-blue)" />
      </svg>

      {/* Centre block — vertically centred via flexbox */}
      <div
        style={{
          position: "absolute",
          inset: "0",
          padding: "0 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "14px",
        }}
      >
        <span className="kp-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
          {chrome.volume}
        </span>
        <h1
          style={{
            fontFamily: serifFamily,
            fontSize: "54px",
            fontWeight: 500,
            lineHeight: 0.96,
            letterSpacing: "-0.018em",
            margin: 0,
            maxWidth: "420px",
          }}
        >
          {titleBody}
          {titleTail && <span style={{ color: "var(--kp-blue)" }}>{titleTail}</span>}
        </h1>
        <p
          style={{
            fontFamily: serifFamily,
            fontStyle: "italic",
            fontSize: "15px",
            lineHeight: 1.45,
            opacity: 0.88,
            maxWidth: "280px",
            margin: 0,
          }}
        >
          {chrome.coverTagline}
        </p>
        {sectorTitle && sectorNumber !== null && (
          <span className="kp-mono" style={{ color: "rgba(255,255,255,0.48)", marginTop: "6px" }}>
            — {sectorWord} {String(sectorNumber).padStart(2, "0")} / {sectorTitle}
          </span>
        )}
      </div>

      {/* Bottom strip */}
      <div
        style={{
          position: "absolute",
          left: "28px",
          right: "28px",
          bottom: "28px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingTop: "10px",
          borderTop: "0.5px solid rgba(255,255,255,0.24)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="kp-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
            {chrome.coverMeta}
          </span>
          <span
            style={{
              fontFamily: "var(--kp-font-sans)",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {chrome.coverSectors}
          </span>
        </div>
        <div
          className="kp-mono"
          style={{
            color: "rgba(255,255,255,0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "2px",
            fontSize: "9px",
          }}
        >
          <span>TR</span>
          <span>EN</span>
          <span>RU</span>
          <span>AR</span>
        </div>
      </div>
    </section>
  );
}
