import Image from "next/image";
import type { Reference } from "@/lib/references/types";

interface ReferenceCardProps {
  reference: Reference;
  clientName: string;
  sectorLabel: string;
}

export function ReferenceCard({ reference, clientName, sectorLabel }: ReferenceCardProps) {
  return (
    <article className="bg-bg-secondary/40 flex flex-col gap-4 rounded-lg border border-[var(--color-border-subtle-dark)] p-6">
      <div className="bg-bg-secondary/60 text-text-secondary flex h-24 items-center justify-center rounded-md">
        <Image
          src={reference.logoPath}
          alt={clientName}
          width={160}
          height={64}
          className="h-14 w-auto"
        />
      </div>
      <div>
        <h3 className="text-text-primary text-base font-semibold">{clientName}</h3>
        <p className="eyebrow mt-1">{sectorLabel}</p>
      </div>
    </article>
  );
}
