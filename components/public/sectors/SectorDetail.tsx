import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ProductGrid } from "@/components/public/products/ProductGrid";
import type { PublicProduct } from "@/components/public/products/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type SectorRouteSlug = "bottle-washing" | "automotive" | "textile";
export type SectorDbSlug = "cam-yikama" | "otomotiv" | "tekstil";
export type SectorNsKey = "camYikama" | "otomotiv" | "tekstil";

export const SECTOR_ROUTE_TO_DB: Record<SectorRouteSlug, SectorDbSlug> = {
  "bottle-washing": "cam-yikama",
  automotive: "otomotiv",
  textile: "tekstil",
};

export const SECTOR_ROUTE_TO_NS: Record<SectorRouteSlug, SectorNsKey> = {
  "bottle-washing": "camYikama",
  automotive: "otomotiv",
  textile: "tekstil",
};

interface SectorBundle {
  products: PublicProduct[];
  sectorLabel: string | null;
}

async function loadSectorBundle(locale: Locale, dbSlug: SectorDbSlug): Promise<SectorBundle> {
  if (env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    return { products: [], sectorLabel: null };
  }
  const svc = await createClient();

  const { data: sector } = await svc
    .from("sectors")
    .select("id, name")
    .eq("slug", dbSlug)
    .eq("active", true)
    .maybeSingle();
  if (!sector) return { products: [], sectorLabel: null };

  const sectorLabel =
    (sector.name as Record<string, string>)?.[locale] ??
    (sector.name as Record<string, string>)?.tr ??
    null;

  const nameKey = `name->>${locale}`;
  const { data, error } = await svc
    .from("products")
    .select("slug, name, images, display_order")
    .eq("sector_id", sector.id)
    .eq("active", true)
    .not(nameKey, "is", null)
    .neq(nameKey, "")
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);

  const products: PublicProduct[] = (data ?? []).map((p) => ({
    slug: p.slug,
    sector_label: sectorLabel,
    name: p.name as Record<Locale, string>,
    images: (p.images as PublicProduct["images"]) ?? [],
  }));

  return { products, sectorLabel };
}

interface Props {
  locale: Locale;
  routeSlug: SectorRouteSlug;
}

export async function SectorDetail({ locale, routeSlug }: Props) {
  const nsKey = SECTOR_ROUTE_TO_NS[routeSlug];
  const dbSlug = SECTOR_ROUTE_TO_DB[routeSlug];
  const ns = `sectors.${nsKey}`;

  const [t, tCta, tCommon, tProducts, tHub, bundle] = await Promise.all([
    getTranslations({ locale, namespace: ns }),
    getTranslations({ locale, namespace: "common.cta" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "pages.products.sectorDetail" }),
    getTranslations({ locale, namespace: `sectors.hub.${nsKey}` }),
    loadSectorBundle(locale, dbSlug),
  ]);

  const solutions = t.raw("solutions.items") as ReadonlyArray<{
    title: string;
    description: string;
  }>;
  const materials = t.raw("materials.items") as ReadonlyArray<string>;
  const imageLabel = tCommon("productImageLabel");

  const sectorShortName = bundle.sectorLabel ?? tHub("title");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 xl:gap-16">
        {/* SOL: Ürün listesi (ana içerik) */}
        <div className="min-w-0">
          <header className="mb-10">
            <p className="eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="text-text-primary mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {sectorShortName}
            </h1>
          </header>

          <ProductGrid
            products={bundle.products}
            locale={locale}
            imageLabel={imageLabel}
            sectorRoute={routeSlug}
            emptyMessage={tProducts("emptyState")}
          />

          <div className="mt-16 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="rounded bg-[var(--color-accent-red)] px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              {tCta("requestQuote")}
            </Link>
            <Link
              href="/products"
              className="text-text-primary rounded border border-[var(--color-border-subtle-dark)] px-6 py-3 font-medium transition hover:border-[var(--color-accent-red)]"
            >
              ← {tProducts("backToHub")}
            </Link>
          </div>
        </div>

        {/* SAĞ: Sektör özeti (sticky sidebar) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-[var(--color-border-subtle-dark)] bg-[var(--color-bg-elevated)] p-6">
            <h2 className="text-text-primary text-xl font-semibold leading-tight">
              {t("hero.title")}
            </h2>
            <p className="text-text-secondary mt-3 text-sm leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="mt-6 border-t border-[var(--color-border-hairline)] pt-6">
              <h3 className="text-text-primary text-sm font-semibold uppercase tracking-wide">
                {t("solutions.title")}
              </h3>
              <ul role="list" className="mt-3 space-y-3">
                {solutions.map((item) => (
                  <li key={item.title}>
                    <p className="text-text-primary text-sm font-medium">{item.title}</p>
                    <p className="text-text-tertiary mt-0.5 text-xs leading-snug">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-[var(--color-border-hairline)] pt-6">
              <h3 className="text-text-primary text-sm font-semibold uppercase tracking-wide">
                {t("materials.title")}
              </h3>
              <ul role="list" className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
                {materials.map((mat) => (
                  <li
                    key={mat}
                    className="text-text-primary rounded border border-[var(--color-border-subtle-dark)] bg-[var(--color-bg-primary)] px-2.5 py-1"
                  >
                    {mat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
