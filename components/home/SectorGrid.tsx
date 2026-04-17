import Link from "next/link";
import { Container } from "../layout/Container";

const SECTORS = [
  {
    slug: "cam-yikama",
    title: "Cam Yıkama",
    description: "Endüstriyel cam yıkama makineleri için yüksek dayanıklı bileşenler.",
    color: "var(--color-sector-cam)",
  },
  {
    slug: "kapak",
    title: "Kapak",
    description: "Endüstriyel ve ambalaj sektörü için plastik kapaklar.",
    color: "var(--color-sector-kapak)",
  },
  {
    slug: "tekstil",
    title: "Tekstil",
    description: "Tekstil makinaları ve aksesuarları için özel plastik parçalar.",
    color: "var(--color-sector-tekstil)",
  },
];

export function SectorGrid() {
  return (
    <section className="py-20" aria-label="Sektörler">
      <Container>
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-accent-blue font-mono text-xs tracking-widest uppercase">
              Sector / 01—03
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Üç sektör. Tek atölye.
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {SECTORS.map((sector) => (
            <Link
              key={sector.slug}
              href={`/sektorler/${sector.slug}`}
              className="group bg-bg-primary/80 block rounded-sm border border-[var(--color-border-subtle-dark)] p-6 backdrop-blur-sm transition-colors hover:border-[var(--color-accent-blue)]"
            >
              <div
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: sector.color }}
              >
                Sector
              </div>
              <h3 className="mt-3 text-2xl font-semibold">{sector.title}</h3>
              <p className="text-text-secondary mt-3 text-sm">{sector.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-blue)] transition-transform group-hover:translate-x-1">
                Detaya git →
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
