import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CardEyebrow } from "@/components/ui";
import { SectorCardLink } from "@/components/home/SectorCardLink";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

type SectorRouteSlug = "bottle-washing" | "automotive" | "textile";
type SectorDbSlug = "cam-yikama" | "otomotiv" | "tekstil";

const SECTOR_ROUTE_TO_DB: Record<SectorRouteSlug, SectorDbSlug> = {
  "bottle-washing": "cam-yikama",
  automotive: "otomotiv",
  textile: "tekstil",
};

interface SectorDef {
  pathname: `/products/${SectorRouteSlug}`;
  routeSlug: SectorRouteSlug;
  nsKey: "camYikama" | "otomotiv" | "tekstil";
  number: string;
  spec: string;
}

const SECTORS: readonly SectorDef[] = [
  {
    pathname: "/products/bottle-washing",
    routeSlug: "bottle-washing",
    nsKey: "camYikama",
    number: "01",
    spec: "Ø 80–320 mm · 12–480 g",
  },
  {
    pathname: "/products/automotive",
    routeSlug: "automotive",
    nsKey: "otomotiv",
    number: "02",
    spec: "ABS · PC · PP · TPE — EV güvenlik aksesuarları",
  },
  {
    pathname: "/products/textile",
    routeSlug: "textile",
    nsKey: "tekstil",
    number: "03",
    spec: "POM · PA6 · abrasif aşınmaya dayanıklı",
  },
];

interface SectorPreview {
  routeSlug: SectorRouteSlug;
  imageUrl: string | null;
}

async function loadSectorPreviews(): Promise<Map<SectorRouteSlug, SectorPreview>> {
  const empty = new Map<SectorRouteSlug, SectorPreview>(
    SECTORS.map((s) => [s.routeSlug, { routeSlug: s.routeSlug, imageUrl: null }]),
  );
  if (env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) return empty;

  const svc = await createClient();
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");

  const previews = await Promise.all(
    SECTORS.map(async (s): Promise<SectorPreview> => {
      const dbSlug = SECTOR_ROUTE_TO_DB[s.routeSlug];
      const { data: sector } = await svc
        .from("sectors")
        .select("id")
        .eq("slug", dbSlug)
        .eq("active", true)
        .maybeSingle();
      if (!sector) return { routeSlug: s.routeSlug, imageUrl: null };

      const { data: product } = await svc
        .from("products")
        .select("images")
        .eq("sector_id", sector.id)
        .eq("active", true)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      const first = (product?.images as Array<{ path: string }> | null)?.[0];
      if (!first) return { routeSlug: s.routeSlug, imageUrl: null };

      return {
        routeSlug: s.routeSlug,
        imageUrl: `${baseUrl}/storage/v1/object/public/product-images/${first.path}`,
      };
    }),
  );

  return new Map(previews.map((p) => [p.routeSlug, p]));
}

interface Props {
  namespace: "home.sectors" | "sectors.hub";
}

export async function SectorPreviewGrid({ namespace }: Props) {
  const t = await getTranslations(namespace);
  const tCta = await getTranslations("common.cta");
  const previews = await loadSectorPreviews();

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {SECTORS.map((sector) => {
        const preview = previews.get(sector.routeSlug);
        const sectorTitle = t(`${sector.nsKey}.title`);
        return (
          <SectorCardLink
            key={sector.pathname}
            pathname={sector.pathname}
            slug={sector.routeSlug}
            className="group block focus-visible:outline-none"
          >
            <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-hairline)] bg-[var(--color-bg-elevated)] transition-colors duration-200 ease-out group-hover:border-[var(--color-border-default)] group-hover:shadow-[var(--shadow-card)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                {preview?.imageUrl ? (
                  <Image
                    src={preview.imageUrl}
                    alt={sectorTitle}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-8">
                <CardEyebrow>
                  <span className="text-[var(--color-accent-cobalt)]">Sektör</span>
                  <span className="mx-1 opacity-50">/</span>
                  <span className="font-mono">{sector.number}</span>
                </CardEyebrow>
                <h3
                  className="font-display mt-3 text-[26px] leading-[1.2] font-medium tracking-[-0.01em]"
                  style={{ fontOpticalSizing: "auto" }}
                >
                  {sectorTitle}
                </h3>
                <p className="mt-3 flex-1 text-[15px] leading-[1.55] text-[var(--color-text-secondary)]">
                  {t(`${sector.nsKey}.description`)}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-border-hairline)] pt-4">
                  <span className="font-mono text-[12px] tracking-[0.02em] text-[var(--color-text-tertiary)]">
                    {sector.spec}
                  </span>
                  <span className="ms-auto text-[14px] font-medium text-[var(--color-accent-cobalt)] transition-transform duration-200 ease-out group-hover:translate-x-1">
                    {tCta("learnMore")} →
                  </span>
                </div>
              </div>
            </article>
          </SectorCardLink>
        );
      })}
    </div>
  );
}
