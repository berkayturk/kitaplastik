import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "./Container";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const t = useTranslations("nav");

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
          <nav aria-label={t("primary")} className="hidden items-center gap-6 lg:flex">
            <Link
              href="/sektorler"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("sectors")}
            </Link>
            <Link
              href="/urunler"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("products")}
            </Link>
            <Link
              href="/muhendislik"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("engineering")}
            </Link>
            <Link
              href="/atolye"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("workshop")}
            </Link>
            <Link
              href="/kalite"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("quality")}
            </Link>
            <Link
              href="/hakkimizda"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("about")}
            </Link>
            <Link
              href="/iletisim"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("contact")}
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <Link
              href="/teklif-iste"
              className="rounded-sm bg-[var(--color-accent-red)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Teklif İste
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
