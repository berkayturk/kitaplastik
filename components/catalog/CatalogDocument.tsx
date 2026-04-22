// components/catalog/CatalogDocument.tsx
//
// Top-level composer. Assembles the 1+N+1 page sequence:
//   Cover →
//   for each sector: [Opener, ProductList pages] →
//   BackCover
// For the "all" scope, we emit a single Cover (no sector annotation) and
// loop every sector's opener+list. For a single-sector PDF we annotate
// the cover with the sector label.

import type { CatalogData, CatalogLocale, SectorGroup } from "@/lib/catalog/types";
import { getCatalogChrome } from "@/lib/catalog/i18n";
import { Cover } from "./Cover";
import { SectionOpener } from "./SectionOpener";
import { ProductList } from "./ProductList";
import { BackCover } from "./BackCover";

interface CatalogDocumentProps {
  data: CatalogData;
  /** Absolute URL printed on the back cover as the QR target. */
  qrTarget: string;
}

const ROWS_PER_PAGE = 3;

function listPageCount(group: SectorGroup): number {
  if (group.products.length === 0) return 0;
  return Math.ceil(group.products.length / ROWS_PER_PAGE);
}

export function CatalogDocument({ data, qrTarget }: CatalogDocumentProps) {
  const chrome = getCatalogChrome(data.locale as CatalogLocale);

  // Determine sector annotation for the cover:
  //   - single-sector scope: show the sole group's title/number on the cover
  //   - "all" scope: no annotation
  const singleGroup = data.groups.length === 1 ? data.groups[0] : null;
  const coverSectorTitle = singleGroup ? singleGroup.title : null;
  const coverSectorNumber = singleGroup ? singleGroup.number : null;

  // Build sequential page numbering for the internal pages. Cover is
  // unnumbered. Opener is page 1 of the sector body; list pages follow.
  // For "all" we keep a running counter across sectors.
  let pageCursor = 0;
  const sectorBlocks = data.groups.map((group) => {
    pageCursor += 1;
    const openerPage = pageCursor;
    const numListPages = listPageCount(group);
    const listStart = pageCursor + 1;
    pageCursor += numListPages;
    return { group, openerPage, listStart, numListPages };
  });

  return (
    <>
      <Cover
        chrome={chrome}
        locale={data.locale as CatalogLocale}
        sectorTitle={coverSectorTitle}
        sectorNumber={coverSectorNumber}
      />
      {sectorBlocks.map(({ group, openerPage, listStart, numListPages }) => (
        <div key={group.slug} style={{ display: "contents" }}>
          <SectionOpener
            chrome={chrome}
            locale={data.locale as CatalogLocale}
            group={group}
            pageNumber={openerPage}
          />
          {numListPages > 0 && (
            <ProductList
              chrome={chrome}
              locale={data.locale as CatalogLocale}
              group={group}
              pageStart={listStart}
            />
          )}
        </div>
      ))}
      <BackCover chrome={chrome} locale={data.locale as CatalogLocale} qrTarget={qrTarget} />
    </>
  );
}
