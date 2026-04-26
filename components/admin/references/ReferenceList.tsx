"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { HardDeleteDialog } from "@/components/admin/HardDeleteDialog";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface Actions {
  softDelete: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  hardDelete: (id: string) => Promise<void>;
  moveUp: (id: string) => Promise<void>;
  moveDown: (id: string) => Promise<void>;
}

interface Props {
  activeRefs: Client[];
  deletedRefs: Client[];
  sectors: Record<string, string>;
  actions: Actions;
}

function toPublicUrl(logoPath: string): string {
  if (logoPath.startsWith("/")) return logoPath;
  if (logoPath.startsWith("http")) return logoPath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${logoPath}`;
}

export function ReferenceList({ activeRefs, deletedRefs, sectors, actions }: Props) {
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const rows = tab === "active" ? activeRefs : deletedRefs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-4 py-2 ${tab === "active" ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          >
            Aktif ({activeRefs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("deleted")}
            className={`px-4 py-2 ${tab === "deleted" ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          >
            Silinmiş ({deletedRefs.length})
          </button>
        </div>
        <Link
          href="/admin/references/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Yeni
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-gray-500">
          {tab === "active" ? "Henüz referans yok" : "Silinmiş kayıt yok"}
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm">
              <th className="p-3">Sıra</th>
              <th className="p-3">Logo</th>
              <th className="p-3">Anahtar</th>
              <th className="p-3">TR Ad</th>
              <th className="p-3">Sektör</th>
              {tab === "active" && <th className="p-3">Sırala</th>}
              <th className="p-3">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const trName = (r.display_name as Record<string, string> | null)?.tr?.trim() || "—";
              const sectorName = r.sector_id ? (sectors[r.sector_id] ?? "?") : "—";
              const isFirst = idx === 0;
              const isLast = idx === rows.length - 1;
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-3">{r.display_order}</td>
                  <td className="p-3">
                    <Image
                      src={toPublicUrl(r.logo_path)}
                      alt={r.key}
                      width={80}
                      height={30}
                      className="h-8 w-auto"
                    />
                  </td>
                  <td className="p-3 font-mono text-sm">{r.key}</td>
                  <td className="p-3">{trName}</td>
                  <td className="p-3">{sectorName}</td>
                  {tab === "active" && (
                    <td className="p-3">
                      <form action={() => actions.moveUp(r.id)} className="inline">
                        <button
                          type="submit"
                          aria-label="Sıralamayı yukarı taşı"
                          disabled={isFirst}
                          className="px-2 py-1 disabled:opacity-30"
                        >
                          ⬆
                        </button>
                      </form>
                      <form action={() => actions.moveDown(r.id)} className="inline">
                        <button
                          type="submit"
                          aria-label="Sıralamayı aşağı taşı"
                          disabled={isLast}
                          className="px-2 py-1 disabled:opacity-30"
                        >
                          ⬇
                        </button>
                      </form>
                    </td>
                  )}
                  <td className="space-x-3 p-3 text-sm">
                    <Link
                      href={`/admin/references/${r.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Düzenle
                    </Link>
                    {tab === "active" ? (
                      <form action={() => actions.softDelete(r.id)} className="inline">
                        <button type="submit" className="text-red-600 hover:underline">
                          Sil
                        </button>
                      </form>
                    ) : (
                      <span className="inline-flex items-center gap-3">
                        <form action={() => actions.restore(r.id)} className="inline">
                          <button type="submit" className="text-emerald-600 hover:underline">
                            Geri yükle
                          </button>
                        </form>
                        <HardDeleteDialog
                          entityLabel={r.key}
                          confirmToken={r.key}
                          action={() => actions.hardDelete(r.id)}
                        />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
