import type { Locale } from "@/i18n/routing";

export type SectorKey = "camYikama" | "kapak" | "tekstil";

export interface Reference {
  id: string;
  key: string;
  logoPath: string; // public URL (dual-read resolved)
  sectorKey: SectorKey;
  displayName: Partial<Record<Locale, string>> | null; // NEW — H1 fix
}
