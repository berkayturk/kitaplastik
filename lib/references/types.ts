export type SectorKey = "camYikama" | "kapak" | "tekstil";

export interface Reference {
  id: string;
  /** i18n key — messages/*\/references.json.clients.{key} */
  key: string;
  logoPath: string;
  sectorKey: SectorKey;
}
