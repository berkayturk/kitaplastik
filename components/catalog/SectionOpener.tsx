// components/catalog/SectionOpener.tsx
//
// Full-width white opener for each sector. Top strip ("SEKTÖR 02 / KAPAK"
// + page number), large serif headline, italic subtitle, 2-3 overview
// paragraphs, and a 4-cell stats grid at the bottom.

import type { CatalogLocale } from "@/lib/catalog/types";
import type { CatalogChrome } from "@/lib/catalog/i18n";
import type { SectorGroup } from "@/lib/catalog/types";

interface SectionOpenerProps {
  chrome: CatalogChrome;
  locale: CatalogLocale;
  group: SectorGroup;
  pageNumber: number;
}

export function SectionOpener({ chrome, locale, group, pageNumber }: SectionOpenerProps) {
  const serifFamily = locale === "ar" ? "var(--kp-font-arabic)" : "var(--kp-font-serif)";
  const sectorNo = String(group.number).padStart(2, "0");
  const pageNo = String(pageNumber).padStart(3, "0");

  return (
    <section className="kp-page" style={{ background: "var(--kp-white)", padding: "0 28px" }}>
      <div className="kp-strip-top">
        <span>
          {chrome.sectorWord.toUpperCase()} {sectorNo} / {group.title.toUpperCase()}
        </span>
        <span className="kp-ltr kp-blue">{pageNo}</span>
      </div>

      {/* Body block */}
      <div
        style={{
          position: "absolute",
          top: "96px",
          left: "28px",
          right: "28px",
          bottom: "140px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <h2
          style={{
            fontFamily: serifFamily,
            fontSize: "44px",
            fontWeight: 500,
            lineHeight: 1.04,
            letterSpacing: "-0.012em",
            color: "var(--kp-navy)",
            margin: 0,
            maxWidth: "500px",
          }}
        >
          {group.title}
        </h2>
        <p
          style={{
            fontFamily: serifFamily,
            fontStyle: "italic",
            fontSize: "15px",
            color: "var(--kp-muted)",
            margin: 0,
            maxWidth: "420px",
          }}
        >
          {group.subtitle}
        </p>
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "460px",
          }}
        >
          {group.overview.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--kp-font-sans)",
                fontSize: "12.5px",
                lineHeight: 1.6,
                color: "var(--kp-navy)",
                margin: 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Stats grid at bottom */}
      <div
        style={{
          position: "absolute",
          left: "28px",
          right: "28px",
          bottom: "60px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "18px",
          paddingTop: "14px",
          borderTop: "0.5px solid var(--kp-hairline)",
        }}
      >
        {group.stats.map((stat, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span className="kp-mono" style={{ color: "var(--kp-muted)", fontSize: "8.5px" }}>
              {stat.label}
            </span>
            <span
              style={{
                fontFamily: "var(--kp-font-sans)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--kp-navy)",
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="kp-strip-bottom">
        <span className="kp-muted">{chrome.runningFooter}</span>
        <span className="kp-ltr kp-blue">{pageNo}</span>
      </div>
    </section>
  );
}
