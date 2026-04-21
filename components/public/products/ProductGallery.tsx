"use client";
import { useState } from "react";
import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env.client";
import { getImageAltText } from "@/lib/products/alt-text";

interface Img {
  path: string;
  order: number;
  alt_text: Record<Locale, string>;
}

interface Props {
  images: Img[];
  name: Record<Locale, string>;
  locale: Locale;
  imageLabel: string;
}

export function ProductGallery({ images, name, locale, imageLabel }: Props) {
  const [active, setActive] = useState(0);
  const base = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images`;
  const first = images[0];
  if (!first) return null;
  const main = images[active] ?? first;
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-border-subtle-dark)]">
        <Image
          src={`${base}/${main.path}`}
          alt={getImageAltText({ name, locale, order: main.order, imageLabel })}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
          unoptimized
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 ${
                i === active ? "border-[var(--color-accent-cobalt)]" : "border-transparent"
              }`}
              aria-label={`Galeri ${i + 1}`}
              aria-pressed={i === active}
            >
              <Image
                src={`${base}/${img.path}`}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
