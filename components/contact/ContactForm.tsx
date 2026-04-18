// components/contact/ContactForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TurnstileWidget } from "@/components/rfq/TurnstileWidget";

type SubjectKey = "general" | "quote" | "support" | "other";
const SUBJECT_KEYS: readonly SubjectKey[] = ["general", "quote", "support", "other"];

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("pages.contact.form");
  const locale = useLocale() as "tr" | "en" | "ru" | "ar";
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError(t("turnstileHint"));
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      subject: String(data.get("subject") ?? "general") as SubjectKey,
      message: String(data.get("message") ?? "").trim(),
      honeypot: String(data.get("website") ?? ""),
      locale,
      turnstileToken,
    };

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        const json = (await res.json().catch(() => ({}))) as { retryAfter?: number };
        const retryAfter = Number(json.retryAfter ?? 60);
        setError(t("errorRateLimit", { minutes: Math.max(1, Math.ceil(retryAfter / 60)) }));
        setStatus("error");
        return;
      }
      if (res.status === 403) {
        setError(t("errorTurnstile"));
        setStatus("error");
        return;
      }
      if (!res.ok) {
        setError(t("errorGeneric"));
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
      setTurnstileToken(null);
    } catch {
      setError(t("errorGeneric"));
      setStatus("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-3 py-2 text-sm text-text-primary",
    "placeholder:text-text-secondary/60",
    "focus:border-[var(--color-accent-blue)] focus:outline-none",
    "focus:ring-2 focus:ring-[var(--color-accent-blue)]/30",
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div>
        <h2 className="text-text-primary text-xl font-semibold">{t("title")}</h2>
        <p className="text-text-secondary mt-1 text-xs">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={t("nameLabel")} required>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            className={inputClass}
          />
        </Field>
        <Field label={t("companyLabel")}>
          <input
            type="text"
            name="company"
            autoComplete="organization"
            placeholder={t("companyPlaceholder")}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={t("emailLabel")} required>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className={inputClass}
          />
        </Field>
        <Field label={t("phoneLabel")}>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={t("subjectLabel")} required>
        <select name="subject" required defaultValue="general" className={inputClass}>
          {SUBJECT_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`subjectOptions.${key}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("messageLabel")} required>
        <textarea
          name="message"
          required
          minLength={10}
          rows={4}
          placeholder={t("messagePlaceholder")}
          className={cn(inputClass, "resize-y")}
        />
      </Field>

      {/* Honeypot: visually hidden, bots only */}
      <label aria-hidden="true" className="sr-only" tabIndex={-1}>
        <span>{t("honeypotLabel")}</span>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="pt-1">
        <TurnstileWidget
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          action="contact"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--color-accent-red)]">
          {error}
        </p>
      )}
      {status === "success" && (
        <p role="status" className="text-sm text-emerald-400">
          {t("submitted")}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-text-primary mb-1 block text-xs font-medium">
        {label}
        {required && <span className="ms-1 text-[var(--color-accent-red)]">*</span>}
      </span>
      {children}
    </label>
  );
}
