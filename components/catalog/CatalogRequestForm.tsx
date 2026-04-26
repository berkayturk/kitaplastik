// components/catalog/CatalogRequestForm.tsx
//
// Email + preferred-locale form. Submits to /api/catalog which delivers the
// locale-appropriate PDF to the user's mailbox. Default locale is the
// current UI locale; user can override (e.g. a TR visitor requesting EN).

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TurnstileWidget } from "@/components/rfq/TurnstileWidget";
import { trackPlausible } from "@/lib/analytics/plausible";
import { Link } from "@/i18n/navigation";

type Status = "idle" | "submitting" | "success" | "error";
type Locale = "tr" | "en" | "ru" | "ar";
type Sector = "all" | "cam-yikama" | "kapak" | "tekstil";
const LOCALES: readonly Locale[] = ["tr", "en", "ru", "ar"];
const SECTORS: readonly Sector[] = ["all", "cam-yikama", "kapak", "tekstil"];

export function CatalogRequestForm() {
  const t = useTranslations("catalog.form");
  const tLocale = useTranslations("catalog.locales");
  const tSector = useTranslations("catalog.sectors");
  const tShared = useTranslations("legal.shared");
  const uiLocale = useLocale() as Locale;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!turnstileToken) {
      setErr(t("errorTurnstile"));
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      email: String(data.get("email") ?? "").trim(),
      locale: String(data.get("locale") ?? uiLocale) as Locale,
      sector: String(data.get("sector") ?? "all") as Sector,
      turnstileToken,
      honeypot: String(data.get("website") ?? ""),
    };

    setStatus("submitting");
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        const j = (await res.json().catch(() => ({}))) as { retryAfter?: number };
        setErr(
          t("errorRateLimit", {
            minutes: Math.max(1, Math.ceil(Number(j.retryAfter ?? 60) / 60)),
          }),
        );
        setStatus("error");
        return;
      }
      if (res.status === 403) {
        setErr(t("errorTurnstile"));
        setStatus("error");
        return;
      }
      if (!res.ok) {
        setErr(t("errorGeneric"));
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
      setTurnstileToken(null);
      trackPlausible({
        name: "Catalog Requested",
        props: { locale: payload.locale, sector: payload.sector },
      });
    } catch {
      setErr(t("errorGeneric"));
      setStatus("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)]",
    "bg-[var(--color-bg-elevated)] text-text-primary px-3.5 py-2.5 text-[14px]",
    "placeholder:text-text-tertiary",
    "transition-colors duration-150 ease-out",
    "focus:border-[var(--color-accent-cobalt)] focus:outline-none",
    "focus:shadow-[var(--shadow-focus)]",
  );

  if (status === "success") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-md)]",
          "border border-[var(--color-border-hairline)]",
          "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-card)]",
          "px-6 py-10 text-center md:px-10",
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-jade)]/40 to-transparent"
        />
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-accent-jade)]/10"
        >
          <svg
            className="size-6 text-[var(--color-accent-jade)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-text-primary font-display text-[20px] font-medium">
          {t("successTitle")}
        </h2>
        <p className="text-text-secondary mt-2 text-sm">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-8 -bottom-4 -z-10 rounded-[var(--radius-md)] bg-gradient-to-b from-[var(--color-accent-cobalt)]/10 via-transparent to-[var(--color-accent-jade)]/5 blur-2xl"
      />
      <form
        onSubmit={onSubmit}
        noValidate
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-md)]",
          "border border-[var(--color-border-hairline)]",
          "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-card)]",
          "px-6 py-8 md:px-10 md:py-10",
          "space-y-6",
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-cobalt)]/40 to-transparent"
        />

        <label className="block">
          <span className="text-text-primary mb-1.5 block text-[12px] font-medium">
            {t("emailLabel")}
            <span className="ms-1 text-[var(--color-alert-red)]">*</span>
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-text-primary mb-1.5 block text-[12px] font-medium">
              {t("localeLabel")}
              <span className="ms-1 text-[var(--color-alert-red)]">*</span>
            </span>
            <select name="locale" required defaultValue={uiLocale} className={inputClass}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {tLocale(l)}
                </option>
              ))}
            </select>
            <span className="text-text-secondary mt-1.5 block text-[11px]">{t("localeHint")}</span>
          </label>

          <label className="block">
            <span className="text-text-primary mb-1.5 block text-[12px] font-medium">
              {t("sectorLabel")}
            </span>
            <select name="sector" defaultValue="all" className={inputClass}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {tSector(s)}
                </option>
              ))}
            </select>
            <span className="text-text-secondary mt-1.5 block text-[11px]">{t("sectorHint")}</span>
          </label>
        </div>

        {/* Honeypot */}
        <label aria-hidden="true" className="sr-only" tabIndex={-1}>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>

        <TurnstileWidget
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          action="catalog_request"
        />

        {err && (
          <p role="alert" className="text-sm text-[var(--color-alert-red)]">
            {err}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          variant="primary"
          disabled={status === "submitting" || !turnstileToken}
          isLoading={status === "submitting"}
          className="w-full sm:w-auto"
        >
          {status === "submitting" ? t("submitting") : t("submit")}
        </Button>

        <p className="text-text-secondary text-[12px] leading-[1.5]">
          {tShared.rich("formConsentNotice", {
            privacyLink: (chunks) => (
              <Link href="/legal/privacy" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </form>
    </div>
  );
}
