import Link from "next/link";
import { Container } from "./Container";

const NAV_ITEMS = [
  { href: "/sektorler", label: "Sektörler" },
  { href: "/urunler", label: "Ürünler" },
  { href: "/muhendislik", label: "Mühendislik" },
  { href: "/atolye", label: "Atölye" },
  { href: "/kalite", label: "Kalite" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function Header() {
  return (
    <header className="bg-bg-primary/95 sticky top-0 z-40 border-b border-[var(--color-border-subtle-dark)] backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Kıta Plastik anasayfa">
            <span className="text-2xl font-black tracking-tight text-[var(--color-accent-red)]">
              KITA
            </span>
            <span className="text-text-secondary hidden text-xs font-medium tracking-widest uppercase sm:inline">
              Plastik · Tekstil
            </span>
          </Link>
          <nav aria-label="Ana menü" className="hidden items-center gap-6 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/teklif-iste"
            className="rounded-sm bg-[var(--color-accent-red)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Teklif İste
          </Link>
        </div>
      </Container>
    </header>
  );
}
