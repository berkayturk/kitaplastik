// components/rfq/StandartRfqForm.tsx
"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ProductPicker, type ItemRow } from "./ProductPicker";
import { TurnstileWidget } from "./TurnstileWidget";

const INCOTERMS = ["EXW", "FOB", "CIF", "DAP"] as const;
type Status = "idle" | "submitting" | "success" | "error";

export function StandartRfqForm() {
  const t = useTranslations("rfq.standart");
  const locale = useLocale() as "tr" | "en" | "ru" | "ar";
  const [items, setItems] = useState<ItemRow[]>([{ productSlug: "", variant: "", qty: 100 }]);
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
      kind: "standart" as const,
      contact: {
        name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        company: String(data.get("company") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        country: String(data.get("country") ?? "TR").trim(),
      },
      items: items.filter((r) => r.productSlug.trim().length > 0),
      deliveryCountry: String(data.get("deliveryCountry") ?? ""),
      incoterm: (String(data.get("incoterm") ?? "") || undefined) as
        | "EXW"
        | "FOB"
        | "CIF"
        | "DAP"
        | undefined,
      notes: String(data.get("notes") ?? ""),
      urgent: data.get("urgent") === "on",
      kvkkConsent: data.get("consent") === "on" ? true : false,
      locale,
      turnstileToken,
      honeypot: String(data.get("website") ?? ""),
    };

    setStatus("submitting");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        const j = (await res.json().catch(() => ({}))) as { retryAfter?: number };
        setErr(
          t("errorRateLimit", { minutes: Math.max(1, Math.ceil(Number(j.retryAfter ?? 60) / 60)) }),
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
      setItems([{ productSlug: "", variant: "", qty: 100 }]);
      setTurnstileToken(null);
    } catch {
      setErr(t("errorGeneric"));
      setStatus("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-3 py-2 text-sm text-text-primary",
    "focus:border-[var(--color-accent-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]/30",
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("itemsSection")}</legend>
        <ProductPicker value={items} onChange={setItems} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("contactSection")}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="name"
            required
            placeholder={t("namePlaceholder")}
            className={inputClass}
            autoComplete="name"
          />
          <input
            name="company"
            required
            placeholder={t("companyPlaceholder")}
            className={inputClass}
            autoComplete="organization"
          />
          <input
            name="email"
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            className={inputClass}
            autoComplete="email"
          />
          <input
            name="phone"
            type="tel"
            required
            placeholder={t("phonePlaceholder")}
            className={inputClass}
            autoComplete="tel"
          />
          <input
            name="country"
            defaultValue="TR"
            maxLength={4}
            required
            placeholder={t("countryPlaceholder")}
            className={inputClass}
          />
          <input
            name="deliveryCountry"
            maxLength={4}
            placeholder={t("deliveryCountryLabel")}
            className={inputClass}
          />
          <select name="incoterm" defaultValue="" className={inputClass}>
            <option value="">{t("incotermPlaceholder")}</option>
            {INCOTERMS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <label className="block">
        <span className="text-text-primary mb-1 block text-xs font-medium">{t("notesLabel")}</span>
        <textarea name="notes" maxLength={1000} rows={4} className={inputClass} />
      </label>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="urgent" /> {t("urgentLabel")}
      </label>

      <label aria-hidden="true" className="sr-only" tabIndex={-1}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="text-text-primary flex items-start gap-2 text-xs">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>{t("consent")}</span>
      </label>

      <TurnstileWidget
        onSuccess={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        action="rfq_standart"
      />

      {err && (
        <p role="alert" className="text-sm text-[var(--color-accent-red)]">
          {err}
        </p>
      )}
      {status === "success" && (
        <p role="status" className="text-sm text-emerald-400">
          {t("success")}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || !turnstileToken}
        className={cn(
          "rounded-sm bg-[var(--color-accent-red)] px-5 py-2.5 text-sm font-semibold text-white",
          "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
