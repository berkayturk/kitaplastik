import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "./Container";
import { KitaLogo } from "./KitaLogo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { buttonVariants } from "@/components/ui";

export function Header() {
  const t = useTranslations("nav");
  const tCta = useTranslations("common.cta");

  return (
    <header
      className="sticky top-0 z-40 border-b bg-[var(--color-bg-primary)]"
      style={{ borderColor: "var(--color-border-hairline)" }}
    >
      <Container>
        <div className="flex h-[72px] items-center justify-between gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={t("home")}>
            <KitaLogo className="h-7 w-auto text-[var(--color-text-primary)]" />
          </Link>

          <nav aria-label={t("primary")} className="hidden items-center gap-8 lg:flex">
            <HeaderLink href="/sektorler">{t("sectors")}</HeaderLink>
            <HeaderLink href="/urunler">{t("products")}</HeaderLink>
            <HeaderLink href="/referanslar">{t("references")}</HeaderLink>
            <HeaderLink href="/hakkimizda">{t("about")}</HeaderLink>
            <HeaderLink href="/iletisim">{t("contact")}</HeaderLink>
          </nav>

          <div className="flex items-center gap-5">
            <LocaleSwitcher />
            <Link
              href="/teklif-iste"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              {tCta("requestQuote")}
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[15px] font-medium text-[var(--color-text-secondary)] transition-colors duration-200 ease-out hover:text-[var(--color-text-primary)]"
    >
      {children}
    </Link>
  );
}
