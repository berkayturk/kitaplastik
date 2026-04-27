import type { ReactNode } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { getCompany } from "@/lib/company";
import { ContactForm } from "@/components/contact/ContactForm";
import { TelegramGlyph, WhatsAppGlyph } from "@/components/contact/WhatsAppButton";
import { ClockIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from "@/components/contact/ContactIcons";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/contact", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

type IconTint = "red" | "emerald" | "violet" | "blue" | "amber" | "cyan";

// Literal class strings so Tailwind's static analyzer can collect every variant.
const ICON_TINT_STYLES: Record<IconTint, string> = {
  red: "bg-red-500/15 text-red-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  violet: "bg-violet-500/15 text-violet-400",
  blue: "bg-blue-500/15 text-blue-400",
  amber: "bg-amber-500/15 text-amber-400",
  cyan: "bg-cyan-500/15 text-cyan-400",
};

interface InfoRowData {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tint: IconTint;
  href?: string;
  external?: boolean;
}

export default async function IletisimPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");
  const tWa = await getTranslations("pages.contact.whatsapp");
  const tTg = await getTranslations("pages.contact.telegram");
  const company = await getCompany();

  const whatsappUrl = `https://wa.me/${company.whatsapp.wa}?text=${encodeURIComponent(tWa("prefill"))}`;
  const telegramUrl = `https://t.me/${company.telegram.handle}?text=${encodeURIComponent(tTg("prefill"))}`;

  const infoRows: ReadonlyArray<InfoRowData> = [
    {
      label: t("details.addressLabel"),
      value: t("details.address"),
      icon: <MapPinIcon className="h-4 w-4" />,
      tint: "red",
      href: company.address.maps,
      external: true,
    },
    {
      label: t("details.phoneLabel"),
      icon: <PhoneIcon className="h-4 w-4" />,
      tint: "emerald",
      value: (
        <>
          <a
            href={`tel:${company.phone.tel}`}
            aria-label={`${t("details.phoneLabel")} ${company.phone.display}`}
            className="hover:underline"
          >
            {company.phone.display}
          </a>
          <span className="text-text-secondary/60 mx-1.5">/</span>
          <a
            href={`tel:${company.cellPhone.tel}`}
            aria-label={`${t("details.cellPhoneLabel")} ${company.cellPhone.display}`}
            className="hover:underline"
          >
            {company.cellPhone.display}
          </a>
        </>
      ),
    },
    {
      label: t("details.emailLabel"),
      value: company.email.primary,
      icon: <EnvelopeIcon className="h-4 w-4" />,
      tint: "blue",
      href: `mailto:${company.email.primary}`,
    },
    {
      label: t("details.hoursLabel"),
      value: t("details.hours"),
      icon: <ClockIcon className="h-4 w-4" />,
      tint: "cyan",
    },
  ];

  return (
    <section className="container mx-auto px-6 py-8 md:py-10">
      <header className="mb-6 max-w-3xl md:mb-8">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="text-text-primary mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("hero.title")}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
        <aside className="space-y-5 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <MessagingCard
              href={whatsappUrl}
              ariaLabel={tWa("fabLabel")}
              title={tWa("title")}
              icon={<WhatsAppGlyph className="h-4 w-4 sm:h-5 sm:w-5" />}
              tint="whatsapp"
            />
            <MessagingCard
              href={telegramUrl}
              ariaLabel={tTg("fabLabel")}
              title={tTg("title")}
              icon={<TelegramGlyph className="h-4 w-4 sm:h-5 sm:w-5" />}
              tint="telegram"
            />
          </div>

          <ul role="list" className="space-y-3 pt-1">
            {infoRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </ul>
        </aside>

        <div className="bg-bg-secondary/30 rounded-lg border border-[var(--color-border-subtle-dark)] p-5 md:p-6 lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon, label, value, tint, href, external }: InfoRowData) {
  const externalProps = external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};
  const content = (
    <div className="flex items-start gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-white/5 ring-inset ${ICON_TINT_STYLES[tint]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-text-secondary">{label}</p>
        <p className="text-text-primary mt-0.5 text-sm leading-snug break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          {...externalProps}
          className="-mx-1 block rounded-md px-1 py-0.5 transition hover:bg-white/[0.03]"
        >
          {content}
        </a>
      ) : (
        <div className="-mx-1 px-1 py-0.5">{content}</div>
      )}
    </li>
  );
}

interface MessagingCardProps {
  href: string;
  ariaLabel: string;
  title: string;
  icon: ReactNode;
  tint: "whatsapp" | "telegram";
}

function MessagingCard({ href, ariaLabel, title, icon, tint }: MessagingCardProps) {
  const palette =
    tint === "whatsapp"
      ? {
          border: "border-[#25D366]/40",
          bg: "bg-[#25D366]/10",
          hoverBorder: "hover:border-[#25D366]/70",
          hoverBg: "hover:bg-[#25D366]/15",
          outline: "focus-visible:outline-[#25D366]",
          iconBg: "bg-[#25D366]",
        }
      : {
          border: "border-[#229ED9]/40",
          bg: "bg-[#229ED9]/10",
          hoverBorder: "hover:border-[#229ED9]/70",
          hoverBg: "hover:bg-[#229ED9]/15",
          outline: "focus-visible:outline-[#229ED9]",
          iconBg: "bg-[#229ED9]",
        };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`group flex items-center justify-center gap-2 rounded-lg border sm:gap-3 ${palette.border} ${palette.bg} px-3 py-3 transition sm:px-4 sm:py-3.5 ${palette.hoverBorder} ${palette.hoverBg} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${palette.outline}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8 ${palette.iconBg} text-white shadow-sm`}
      >
        {icon}
      </span>
      <span className="text-text-primary text-xs font-semibold whitespace-nowrap sm:text-sm">
        {title}
      </span>
    </a>
  );
}
