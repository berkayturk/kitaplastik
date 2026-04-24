import Image from "next/image";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

interface Props {
  sectors: Sector[];
}

export function SectorList({ sectors }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm">
            <th className="p-3">Sıra</th>
            <th className="p-3">Slug</th>
            <th className="p-3">TR Ad</th>
            <th className="p-3">Hero</th>
            <th className="p-3">Durum</th>
            <th className="p-3">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((s) => {
            const hero = s.hero_image as { path?: string } | null;
            const heroUrl = hero?.path
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.path}`
              : null;
            const name = (s.name as Record<string, string> | null)?.tr ?? "";
            return (
              <tr key={s.id} className="border-b">
                <td className="p-3">{s.display_order}</td>
                <td className="p-3 font-mono text-sm">{s.slug}</td>
                <td className="p-3">{name}</td>
                <td className="p-3">
                  {heroUrl ? (
                    <Image src={heroUrl} alt="" width={64} height={40} className="rounded border" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-3">{s.active ? "✓" : "×"}</td>
                <td className="p-3">
                  <Link
                    href={`/admin/sectors/${s.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Düzenle
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
