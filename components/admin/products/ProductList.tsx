"use client";
import { useState } from "react";
import Link from "next/link";
import type { ProductRow as ProductRowData } from "@/lib/admin/products";
import { ProductRow } from "./ProductRow";

interface SectorMap {
  [id: string]: string;
}

interface Props {
  activeProducts: ProductRowData[];
  deletedProducts: ProductRowData[];
  sectors: SectorMap;
  softDelete: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  hardDelete: (id: string) => Promise<void>;
}

export function ProductList({
  activeProducts,
  deletedProducts,
  sectors,
  softDelete,
  restore,
  hardDelete,
}: Props) {
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const [search, setSearch] = useState("");

  const source = tab === "active" ? activeProducts : deletedProducts;
  const filtered = search.trim()
    ? (() => {
        const q = search.trim().toLowerCase();
        return source.filter(
          (p) =>
            (p.name.tr ?? "").toLowerCase().includes(q) ||
            p.slug.includes(q) ||
            (p.code ?? "").toLowerCase().includes(q),
        );
      })()
    : source;

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ürünler</h1>
        <Link
          href="/admin/products/new"
          className="rounded-sm bg-[var(--color-accent-cobalt)] px-3 py-1.5 text-sm font-medium text-white"
        >
          + Yeni Ürün Ekle
        </Link>
      </header>

      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-sm px-3 py-1 text-sm ${tab === "active" ? "bg-bg-secondary font-medium" : "text-text-secondary"}`}
        >
          Yayında ({activeProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("deleted")}
          className={`rounded-sm px-3 py-1 text-sm ${tab === "deleted" ? "bg-bg-secondary font-medium" : "text-text-secondary"}`}
        >
          Silinmiş ({deletedProducts.length})
        </button>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Ürün adı, slug veya kod"
          className="bg-bg-primary/60 ml-auto w-64 rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-sm"
        />
      </div>

      <div>
        {filtered.length === 0 && (
          <p className="text-text-tertiary py-8 text-center text-sm">Ürün yok.</p>
        )}
        {filtered.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            sectorName={p.sector_id ? (sectors[p.sector_id] ?? null) : null}
            onDelete={() => softDelete(p.id)}
            onRestore={() => restore(p.id)}
            onHardDelete={() => hardDelete(p.id)}
          />
        ))}
      </div>
    </section>
  );
}
