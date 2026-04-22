"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { trackPlausible } from "@/lib/analytics/plausible";

const LABEL: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  ru: "RU",
  ar: "AR",
};

/**
 * Locale switcher using plain `<a>` anchors (full-page navigation) rather
 * than next-intl's `<Link>` with `locale` prop. Rationale:
 *
 *   1. Route-scoped Link locale switching has a known quirk where clicks
 *      from the root path (`usePathname() === "/"`) stay on the current
 *      locale in v3.x — a Playwright probe confirmed it against v3.26.5.
 *   2. Switching language is a rare, deliberate action; a full reload
 *      resets messages, metadata, next-intl context, and any client-side
 *      cache cleanly. There is no UX benefit to shallow client nav.
 *   3. The anchor is visible in the HTML (no hydration required), so it
 *      works even when JavaScript is disabled.
 */
export function LocaleSwitcher() {
  const current = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");
  // `usePathname` from @/i18n/navigation strips the locale prefix. Root → "/"
  // for which we want targets like "/en"; for "/contact" we want "/en/contact".
  const pathTail = pathname === "/" ? "" : pathname;

  return (
    <nav aria-label={t("language")} className="flex items-center font-mono text-[13px]">
      {locales.map((locale, i) => {
        const active = locale === current;
        return (
          <Fragment key={locale}>
            {i > 0 && (
              <span aria-hidden="true" className="mx-1 text-[var(--color-text-tertiary)]">
                ·
              </span>
            )}
            <a
              href={`/${locale}${pathTail}`}
              hrefLang={locale}
              aria-current={active ? "true" : undefined}
              onMouseDown={() => {
                if (!active) trackPlausible({ name: "Locale Changed", props: { to: locale } });
              }}
              className={cn(
                "tracking-[0.08em] transition-colors duration-200 ease-out",
                active
                  ? "text-[var(--color-text-primary)] underline decoration-[var(--color-accent-cobalt)] decoration-2 underline-offset-[6px]"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {LABEL[locale]}
            </a>
          </Fragment>
        );
      })}
    </nav>
  );
}
