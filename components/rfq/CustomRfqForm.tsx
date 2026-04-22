// components/rfq/CustomRfqForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CountrySelect } from "@/components/forms/CountrySelect";
import { PhoneField } from "@/components/forms/PhoneField";
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
    "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)]",
    "bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-[14px] text-text-primary",
    "placeholder:text-text-tertiary",
    "transition-colors duration-150 ease-out",
    "focus:outline-none focus:border-[var(--color-accent-cobalt)]",
    "focus:shadow-[var(--shadow-focus)]",
  );

  return (
    <div className="relative">
      {/* Premium elevation: soft cobalt-tinted glow beneath card */}
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
          "space-y-8",
        )}
      >
        {/* Top hairline accent */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-cobalt)]/40 to-transparent"
        />

        <FormSection index="01" label={t("contactSection")}>
          <div className="grid gap-4 md:grid-cols-2">
            <L label={t("nameLabel")} required>
              <input name="name" required className={inputClass} autoComplete="name" />
            </L>
            <L label={t("companyLabel")} required>
              <input name="company" required className={inputClass} autoComplete="organization" />
            </L>
            <L label={t("emailLabel")} required>
              <input
                name="email"
                type="email"
                required
                className={inputClass}
                autoComplete="email"
              />
            </L>
            <L label={t("phoneLabel")} required>
              <PhoneField name="phone" required />
            </L>
            <L label={t("countryLabel")} required>
              <CountrySelect name="country" required defaultValue="TR" />
            </L>
          </div>
        </FormSection>

        <FormSection index="02" label={t("projectSection")}>
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
          <div className="grid gap-4 md:grid-cols-2">
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
              {MATERIALS.map((m) => {
                const checked = materials.includes(m);
                return (
                  <label
                    key={m}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)]",
                      "border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out",
                      checked
                        ? "border-[var(--color-accent-cobalt)] bg-[var(--color-accent-cobalt)]/10 text-[var(--color-accent-cobalt)]"
                        : "text-text-primary border-[var(--color-border-default)] hover:border-[var(--color-accent-cobalt)]/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) =>
                        setMaterials(
                          e.target.checked ? [...materials, m] : materials.filter((x) => x !== m),
                        )
                      }
                    />
                    <span>{m}</span>
                  </label>
                );
              })}
            </div>
          </L>
          <div className="grid gap-4 md:grid-cols-2">
            <L label={t("targetDateLabel")}>
              <input name="targetDate" type="date" className={inputClass} />
            </L>
            <L label={t("ndaLabel")}>
              <label className="text-text-primary inline-flex cursor-pointer items-center gap-2 py-2.5 text-sm">
                <input
                  type="checkbox"
                  name="nda"
                  className="size-4 rounded-[var(--radius-sm)] border-[var(--color-border-default)] accent-[var(--color-accent-cobalt)]"
                />
                <span>NDA</span>
              </label>
            </L>
          </div>
        </FormSection>

        <FormSection index="03" label={t("filesSection")}>
          <FileUploader rfqDraftId={rfqDraftId} value={attachments} onChange={setAttachments} />
        </FormSection>

        {/* Honeypot */}
        <label aria-hidden="true" className="sr-only" tabIndex={-1}>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>

        <div className="space-y-5 border-t border-[var(--color-border-hairline)] pt-6">
          <label className="text-text-primary flex items-start gap-2 text-xs leading-relaxed">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-0.5 size-4 shrink-0 rounded-[var(--radius-sm)] border-[var(--color-border-default)] accent-[var(--color-accent-cobalt)]"
            />
            <span>{t("consent")}</span>
          </label>

          <TurnstileWidget
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            action="rfq_custom"
          />

          {err && (
            <p role="alert" className="text-sm text-[var(--color-alert-red)]">
              {err}
            </p>
          )}
          {status === "success" && (
            <p role="status" className="text-sm text-[var(--color-accent-jade)]">
              {t("success")}
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
        </div>
      </form>
    </div>
  );
}

function FormSection({
  index,
  label,
  children,
}: {
  index: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] font-medium tracking-widest text-[var(--color-accent-cobalt)]">
          {index}
        </span>
        <h2 className="text-text-primary font-display text-[18px] leading-tight font-medium tracking-tight">
          {label}
        </h2>
        <span aria-hidden="true" className="mx-1 h-px flex-1 bg-[var(--color-border-hairline)]" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
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
      <span className="text-text-primary mb-1.5 block text-[12px] font-medium">
        {label}
        {required && <span className="ms-1 text-[var(--color-alert-red)]">*</span>}
      </span>
      {children}
      {hint && <span className="text-text-secondary mt-1.5 block text-[11px]">{hint}</span>}
    </label>
  );
}
