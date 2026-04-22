import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "./Container";
import { KitaLogo } from "./KitaLogo";
import { COMPANY } from "@/lib/company";

export function Footer() {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("common.footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-32 bg-[var(--color-bg-ink)] text-[var(--color-text-inverse)]">
      <Container>
        <div className="grid gap-12 py-24 md:grid-cols-4">
          {/* Brand + address */}
          <div className="space-y-6 md:col-span-1">
            <KitaLogo className="h-8 w-auto text-[var(--color-text-inverse)]" />
            <address className="space-y-0.5 text-[14px] leading-[1.65] text-[rgba(250,250,247,0.75)] not-italic">
              <p className="font-mono text-[12px] tracking-[0.08em] text-[rgba(250,250,247,0.5)] uppercase">
                {tFooter("since")}
              </p>
              <p className="mt-3">{tFooter("legalName")}</p>
              <p>{COMPANY.address.city}</p>
            </address>
            <div className="space-y-1 font-mono text-[13px] text-[rgba(250,250,247,0.75)]">
              <p>{COMPANY.phone.display}</p>
              <p>{COMPANY.email.primary}</p>
            </div>
          </div>

          {/* Sektörler */}
          <FooterColumn title={tNav("sectors")}>
            <FooterLink href="/sectors/bottle-washing">Cam Yıkama</FooterLink>
            <FooterLink href="/sectors/caps">Kapak</FooterLink>
            <FooterLink href="/sectors/textile">Tekstil</FooterLink>
          </FooterColumn>

          {/* Şirket */}
          <FooterColumn title={tCommon("brand.name")}>
            <FooterLink href="/about">{tNav("about")}</FooterLink>
            <FooterLink href="/references">{tNav("references")}</FooterLink>
          </FooterColumn>

          {/* İletişim */}
          <FooterColumn title={tNav("contact")}>
            <FooterLink href="/contact">{tNav("contact")}</FooterLink>
            <FooterLink href="/request-quote">{tCommon("cta.requestQuote")}</FooterLink>
            <FooterLink href="/products">{tNav("products")}</FooterLink>
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-3 border-t border-[rgba(250,250,247,0.1)] py-6 text-[13px] text-[rgba(250,250,247,0.5)] md:flex-row md:items-center md:justify-between">
          <p className="font-mono">{tFooter("copyright", { year: currentYear })}</p>
          <p>{tCommon("brand.tagline")}</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="font-display text-[18px] leading-[1.3] font-medium text-[var(--color-text-inverse)]"
        style={{ fontOpticalSizing: "auto" }}
      >
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-[14px]">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: ComponentProps<typeof Link>["href"];
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-[rgba(250,250,247,0.7)] transition-colors duration-200 ease-out hover:text-[var(--color-text-inverse)]"
      >
        {children}
      </Link>
    </li>
  );
}
