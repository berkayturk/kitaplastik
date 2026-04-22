// components/catalog/ProductRow.tsx
//
// Single product row on a list page. Left square thumbnail
// (surface-grey background, contained product photo, mono 01/02/03
// index in lower corner), right body with mono product code, serif
// product name, and a two-column info grid labelled in mono small caps.

import type { CatalogProduct } from "@/lib/catalog/types";
import type { CatalogChrome } from "@/lib/catalog/i18n";
import type { CatalogLocale } from "@/lib/catalog/types";

interface ProductRowProps {
  product: CatalogProduct;
  index: number; // 1-based within its page (01 / 02 / 03)
  chrome: CatalogChrome;
  locale: CatalogLocale;
}

const EM_DASH = "—";

function renderValue(value: string | null): string {
  return value && value.length > 0 ? value : EM_DASH;
}

export function ProductRow({ product, index, chrome, locale }: ProductRowProps) {
  const serifFamily = locale === "ar" ? "var(--kp-font-arabic)" : "var(--kp-font-serif)";
  const badge = String(index).padStart(2, "0");

  return (
    <article className="product-row">
      <div className="product-row__thumb">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" loading="eager" decoding="sync" />
        ) : (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--kp-muted)",
              fontFamily: "var(--kp-font-mono)",
              fontSize: "9px",
              letterSpacing: "0.1em",
            }}
          >
            NO IMAGE
          </div>
        )}
        <span className="product-row__index kp-ltr">{badge}</span>
      </div>
      <div className="product-row__body">
        <span className="product-row__code kp-ltr">{product.code}</span>
        <h3 className="product-row__name" style={{ fontFamily: serifFamily }}>
          {product.name}
        </h3>
        <dl className="product-row__info">
          <dt>{chrome.labels.material}</dt>
          <dd>{renderValue(product.material)}</dd>
          <dt>{chrome.labels.dimension}</dt>
          <dd className="kp-ltr">{renderValue(product.dimension)}</dd>
          <dt>{chrome.labels.usage}</dt>
          <dd>{renderValue(product.usage)}</dd>
          <dt>{chrome.labels.weight}</dt>
          <dd className="kp-ltr">{renderValue(product.weight)}</dd>
        </dl>
      </div>
    </article>
  );
}
