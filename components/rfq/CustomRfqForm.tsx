// components/rfq/CustomRfqForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FileUploader, type UploadedFile } from "./FileUploader";
import { TurnstileWidget } from "./TurnstileWidget";

const SECTORS = ["cam-yikama", "kapak", "tekstil", "diger"] as const;
const VOLUMES = ["1k", "5k", "10k", "50k", "100k+", "unknown"] as const;
const TOLERANCES = ["low", "medium", "high"] as const;
const MATERIALS = ["PP", "PE", "ABS", "POM", "PA", "PC", "PET", "Other"] as const;

type Status = "idle" | "submitting" | "success" | "error";

export function CustomRfqForm() {
  const t = useTranslations("rfq.custom");
  const locale = useLocale() as "tr" | "en" | "ru" | "ar";
  const rfqDraftId = useMemo(() => crypto.randomUUID(), []);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [materials, setMaterials] = useState<string[]>([]);
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
      kind: "custom" as const,
      contact: {
        name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        company: String(data.get("company") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        country: String(data.get("country") ?? "TR").trim(),
      },
      sector: String(data.get("sector") ?? "diger"),
      description: String(data.get("description") ?? "").trim(),
      materials,
      annualVolume: String(data.get("annualVolume") ?? "unknown"),
      tolerance: String(data.get("tolerance") ?? "medium") || undefined,
      targetDate: String(data.get("targetDate") ?? ""),
      ndaRequired: data.get("nda") === "on",
      kvkkConsent: data.get("consent") === "on" ? true : false,
      attachments,
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
      setAttachments([]);
      setMaterials([]);
      setTurnstileToken(null);
    } catch {
      setErr(t("errorGeneric"));
      setStatus("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-3 py-2 text-sm text-text-primary",
    "placeholder:text-text-secondary/60 focus:outline-none",
    "focus:border-[var(--color-accent-blue)] focus:ring-2 focus:ring-[var(--color-accent-blue)]/30",
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("contactSection")}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <L label={t("nameLabel")} required>
            <input name="name" required className={inputClass} autoComplete="name" />
          </L>
          <L label={t("companyLabel")} required>
            <input name="company" required className={inputClass} autoComplete="organization" />
          </L>
          <L label={t("emailLabel")} required>
            <input name="email" type="email" required className={inputClass} autoComplete="email" />
          </L>
          <L label={t("phoneLabel")} required>
            <input name="phone" type="tel" required className={inputClass} autoComplete="tel" />
          </L>
          <L label={t("countryLabel")} required>
            <input name="country" defaultValue="TR" maxLength={4} required className={inputClass} />
          </L>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("projectSection")}</legend>
        <L label={t("sectorLabel")} required>
          <select name="sector" required className={inputClass}>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {t(`sectorOptions.${s}`)}
              </option>
            ))}
          </select>
        </L>
        <L label={t("descriptionLabel")} required hint={t("descriptionHint")}>
          <textarea
            name="description"
            required
            minLength={50}
            maxLength={2000}
            rows={6}
            className={inputClass}
          />
        </L>
        <div className="grid gap-3 md:grid-cols-2">
          <L label={t("volumeLabel")} required>
            <select name="annualVolume" required className={inputClass}>
              {VOLUMES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </L>
          <L label={t("toleranceLabel")}>
            <select name="tolerance" defaultValue="medium" className={inputClass}>
              {TOLERANCES.map((x) => (
                <option key={x} value={x}>
                  {t(`toleranceOptions.${x}`)}
                </option>
              ))}
            </select>
          </L>
        </div>
        <L label={t("materialsLabel")}>
          <div className="flex flex-wrap gap-2">
            {MATERIALS.map((m) => (
              <label
                key={m}
                className="text-text-primary inline-flex cursor-pointer items-center gap-1 rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={materials.includes(m)}
                  onChange={(e) =>
                    setMaterials(
                      e.target.checked ? [...materials, m] : materials.filter((x) => x !== m),
                    )
                  }
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </L>
        <div className="grid gap-3 md:grid-cols-2">
          <L label={t("targetDateLabel")}>
            <input name="targetDate" type="date" className={inputClass} />
          </L>
          <L label={t("ndaLabel")}>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="nda" /> NDA
            </label>
          </L>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("filesSection")}</legend>
        <FileUploader rfqDraftId={rfqDraftId} value={attachments} onChange={setAttachments} />
      </fieldset>

      {/* Honeypot */}
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
        action="rfq_custom"
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

function L({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-text-primary mb-1 block text-xs font-medium">
        {label}
        {required && <span className="ms-1 text-[var(--color-accent-red)]">*</span>}
      </span>
      {children}
      {hint && <span className="text-text-secondary mt-1 block text-xs">{hint}</span>}
    </label>
  );
}
