import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { ProductDetail } from "@/components/public/products/ProductDetail";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

async function loadProduct(locale: Locale, slug: string) {
  const svc = createServiceClient();
  const nameKey = `name->>${locale}`;
  const { data, error } = await svc
    .from("products")
    .select("slug, name, description, images, specs, active")
    .eq("slug", slug)
    .eq("active", true)
    .not(nameKey, "is", null)
    .neq(nameKey, "")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await loadProduct(locale, slug);
  if (!product) return { title: "Ürün bulunamadı" };
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const name = (product.name as Record<string, string>)[locale];
  const description = (product.description as Record<string, string> | null)?.[locale];
  return {
    title: `${name} | Kıta Plastik`,
    description: description?.slice(0, 160),
    alternates: {
      canonical: `${origin}/${locale}/products/${slug}`,
      languages: buildAlternates(`/products/${slug}`, origin).languages,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await loadProduct(locale, slug);
  if (!product) notFound();

  const [tCta, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "common.cta" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <ProductDetail
        product={{
          slug: product.slug,
          name: product.name as Record<Locale, string>,
          description: (product.description as Record<Locale, string> | null) ?? {
            tr: "",
            en: "",
            ru: "",
            ar: "",
          },
          images:
            (product.images as Array<{
              path: string;
              order: number;
              alt_text: Record<Locale, string>;
            }> | null) ?? [],
          specs: (product.specs as Array<{ preset_id: string; value: string }> | null) ?? [],
        }}
        locale={locale}
        ctaLabel={tCta("requestQuote")}
        imageLabel={tCommon("productImageLabel")}
      />
    </section>
  );
}
