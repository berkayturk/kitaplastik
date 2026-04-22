// components/catalog/ProductList.tsx
//
// Paginates a sector's products into body pages at 3 rows/page. Each page
// carries the section header (eyebrow + serif title + italic subtitle) so
// "the reader always knows where they are" — the spec is explicit that
// the section identity repeats on every list page.

import type { CatalogLocale, SectorGroup } from "@/lib/catalog/types";
import type { CatalogChrome } from "@/lib/catalog/i18n";
import { ProductRow } from "./ProductRow";

interface ProductListProps {
  chrome: CatalogChrome;
  locale: CatalogLocale;
  group: SectorGroup;
  /** First physical page number for this list section (continues from
   * the opener). Advances by 1 per produced page. */
  pageStart: number;
}

const ROWS_PER_PAGE = 3;

export function ProductList({ chrome, locale, group, pageStart }: ProductListProps) {
  const serifFamily = locale === "ar" ? "var(--kp-font-arabic)" : "var(--kp-font-serif)";
  const sectorNo = String(group.number).padStart(2, "0");

  // Chunk products into pages of 3.
  const pages: (typeof group.products)[] = [];
  for (let i = 0; i < group.products.length; i += ROWS_PER_PAGE) {
    pages.push(group.products.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <>
      {pages.map((rows, pageIdx) => {
        const pageNo = String(pageStart + pageIdx).padStart(3, "0");
        return (
          <section
            key={pageIdx}
            className="kp-page"
            style={{ background: "var(--kp-white)", padding: "0 28px" }}
          >
            <div className="kp-strip-top">
              <span>
                {chrome.sectorWord.toUpperCase()} {sectorNo} / {group.title.toUpperCase()}
              </span>
              <span className="kp-ltr kp-blue">{pageNo}</span>
            </div>

            {/* Section header — repeats on every list page. */}
            <header
              style={{
                position: "absolute",
                top: "64px",
                left: "28px",
                right: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span className="kp-mono kp-blue" style={{ fontSize: "9.5px" }}>
                {chrome.sectionEyebrow(group.title)}
              </span>
              <h2
                style={{
                  fontFamily: serifFamily,
                  fontSize: "24px",
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: "-0.008em",
                  color: "var(--kp-navy)",
                  margin: 0,
                }}
              >
                {group.subtitle}
              </h2>
            </header>

            {/* Rows region — 3 per page, each 118px-square thumb + info grid. */}
            <div
              style={{
                position: "absolute",
                top: "140px",
                left: "28px",
                right: "28px",
                bottom: "60px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {rows.map((product, rIdx) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  index={pageIdx * ROWS_PER_PAGE + rIdx + 1}
                  chrome={chrome}
                  locale={locale}
                />
              ))}
            </div>

            <div className="kp-strip-bottom">
              <span className="kp-muted">{chrome.runningFooter}</span>
              <span className="kp-ltr kp-blue">{pageNo}</span>
            </div>
          </section>
        );
      })}
    </>
  );
}
