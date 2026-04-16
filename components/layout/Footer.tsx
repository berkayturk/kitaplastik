import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-secondary mt-24 border-t border-[var(--color-border-subtle-dark)]">
      <Container>
        <div className="grid gap-8 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-accent-blue font-mono text-xs tracking-widest uppercase">
              — 1989'dan beri Bursa
            </div>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-[var(--color-accent-red)]">
              KITA
            </h3>
            <p className="text-text-secondary mt-4 max-w-md text-sm">
              Plastik enjeksiyonun mühendislik partneri. Cam yıkama, kapak ve tekstil sektörlerine
              üretim.
            </p>
          </div>
          <div>
            <div className="text-text-secondary font-mono text-xs tracking-widest uppercase">
              Site
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/sektorler" className="hover:text-text-primary">
                  Sektörler
                </Link>
              </li>
              <li>
                <Link href="/urunler" className="hover:text-text-primary">
                  Ürünler
                </Link>
              </li>
              <li>
                <Link href="/muhendislik" className="hover:text-text-primary">
                  Mühendislik
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="hover:text-text-primary">
                  Hakkımızda
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-text-secondary font-mono text-xs tracking-widest uppercase">
              İletişim
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/iletisim" className="hover:text-text-primary">
                  İletişim sayfası
                </Link>
              </li>
              <li>
                <Link href="/teklif-iste" className="hover:text-text-primary">
                  Teklif iste
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-text-secondary border-t border-[var(--color-border-subtle-dark)] py-6 text-xs">
          <p>KITA PLASTİK ve TEKSTİL SAN. TİC. LTD. ŞTİ. — Bursa, Türkiye</p>
          <p className="mt-1 font-mono">© 1989—{currentYear} · Tüm hakları saklıdır</p>
        </div>
      </Container>
    </footer>
  );
}
