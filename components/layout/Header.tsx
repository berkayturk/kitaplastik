import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "./Container";
import { KitaLogo } from "./KitaLogo";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const tCta = useTranslations("common.cta");

  return (
    <header className="bg-bg-primary/95 sticky top-0 z-40 border-b border-[var(--color-border-subtle-dark)] backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label={t("home")}>
            <KitaLogo className="text-text-primary h-8 w-auto" />
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
              href="/referanslar"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {t("references")}
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
              href="/iletisim"
              className="rounded-sm bg-[var(--color-accent-red)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {tCta("requestQuote")}
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
