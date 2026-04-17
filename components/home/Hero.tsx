import Link from "next/link";
import { Container } from "../layout/Container";

export function Hero() {
  return (
    <section
      aria-label="Anasayfa hero"
      className="relative flex min-h-[72dvh] items-center overflow-hidden border-b border-[var(--color-border-subtle-dark)] bg-transparent"
    >
      <Container>
        <div className="relative py-24 md:py-32 lg:py-40">
          <div className="eyebrow text-accent-cyan">— 1989'dan beri / Bursa, Türkiye</div>
          <h1
            id="hero-title"
            className="mt-6 max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl"
          >
            Plastik enjeksiyonun{" "}
            <span className="text-[var(--color-accent-cyan)]">mühendislik partneri.</span>
          </h1>
          <p className="text-text-secondary mt-6 max-w-xl text-lg">
            36 yıllık üretim deneyimi · 3 sektör · 4 dilde küresel B2B tedarik. Bursa atölyemizden
            cam yıkama, kapak ve tekstil sektörlerine üretim ve özel mühendislik.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/teklif-iste/ozel-uretim"
              className="rounded-sm bg-[var(--color-accent-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Özel Üretim Teklifi
            </Link>
            <Link
              href="/teklif-iste/standart"
              className="rounded-sm border border-[var(--color-accent-blue)] px-6 py-3 text-sm font-semibold text-[var(--color-accent-blue)] transition-colors hover:bg-[var(--color-accent-blue)]/10"
            >
              Standart Ürün Talebi
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
