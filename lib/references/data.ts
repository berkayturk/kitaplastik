import type { Reference, SectorKey } from "./types";

const REFERENCES: ReadonlyArray<Reference> = [
  { id: "c1", key: "c1", logoPath: "/references/c1.svg", sectorKey: "camYikama" },
  { id: "c2", key: "c2", logoPath: "/references/c2.svg", sectorKey: "kapak" },
  { id: "c3", key: "c3", logoPath: "/references/c3.svg", sectorKey: "tekstil" },
  { id: "c4", key: "c4", logoPath: "/references/c4.svg", sectorKey: "camYikama" },
  { id: "c5", key: "c5", logoPath: "/references/c5.svg", sectorKey: "kapak" },
  { id: "c6", key: "c6", logoPath: "/references/c6.svg", sectorKey: "tekstil" },
  { id: "c7", key: "c7", logoPath: "/references/c7.svg", sectorKey: "camYikama" },
  { id: "c8", key: "c8", logoPath: "/references/c8.svg", sectorKey: "kapak" },
];

export function getReferences(): ReadonlyArray<Reference> {
  return REFERENCES;
}

export function getReferencesBySector(sector: SectorKey): ReadonlyArray<Reference> {
  return REFERENCES.filter((r) => r.sectorKey === sector);
}
