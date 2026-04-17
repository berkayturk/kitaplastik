import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "./Container";

export function Footer() {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("common.footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-secondary mt-24 border-t border-[var(--color-border-subtle-dark)]">
      <Container>
        <div className="grid gap-8 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="eyebrow text-accent-blue">— {tFooter("since")}</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-[var(--color-accent-red)]">
              KITA
            </h3>
            <p className="text-text-secondary mt-4 max-w-md text-sm">{tCommon("brand.tagline")}</p>
          </div>
          <div>
            <p className="eyebrow">{tFooter("links")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/sektorler" className="hover:text-text-primary">
                  {tNav("sectors")}
                </Link>
              </li>
              <li>
                <Link href="/urunler" className="hover:text-text-primary">
                  {tNav("products")}
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="hover:text-text-primary">
                  {tNav("about")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">{tNav("contact")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/iletisim" className="hover:text-text-primary">
                  {tNav("contact")}
                </Link>
              </li>
              <li>
                <Link href="/teklif-iste" className="hover:text-text-primary">
                  {tCommon("cta.requestQuote")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-text-secondary border-t border-[var(--color-border-subtle-dark)] py-6 text-xs">
          <p>{tFooter("legalName")}</p>
          <p className="mt-1">{tFooter("copyright", { year: currentYear })}</p>
        </div>
      </Container>
    </footer>
  );
}
