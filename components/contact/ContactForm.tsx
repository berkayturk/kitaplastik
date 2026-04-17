"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";

type SubjectKey = "general" | "quote" | "support" | "other";
const SUBJECT_KEYS: readonly SubjectKey[] = ["general", "quote", "support", "other"];

type Status = "idle" | "opening" | "opened";

export function ContactForm() {
  const t = useTranslations("pages.contact.form");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const subjectKey = String(data.get("subject") ?? "general").trim() as SubjectKey;
    const message = String(data.get("message") ?? "").trim();

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      setError(t("invalidEmail"));
      return;
    }
    if (message.length < 10) {
      setError(t("minMessage"));
      return;
    }

    const subjectLabel = t(`subjectOptions.${subjectKey}`);
    const subjectLine = `[Web] ${subjectLabel} — ${name}`;
    const bodyLines: (string | false)[] = [
      `Ad / Name: ${name}`,
      company ? `Firma / Company: ${company}` : false,
      `E-posta / Email: ${email}`,
      phone ? `Telefon / Phone: ${phone}` : false,
      `Konu / Subject: ${subjectLabel}`,
      "",
      message,
    ];
    const body = bodyLines.filter((line): line is string => line !== false).join("\n");

    const href = `mailto:${COMPANY.email.primary}?subject=${encodeURIComponent(
      subjectLine,
    )}&body=${encodeURIComponent(body)}`;

    setStatus("opening");
    window.location.href = href;
    window.setTimeout(() => setStatus("opened"), 400);
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

      {error && (
        <p role="alert" className="text-sm text-[var(--color-accent-red)]">
          {error}
        </p>
      )}

      {status === "opened" && (
        <p role="status" className="text-text-secondary text-sm">
          {t("submitted")}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "opening"}
          className={cn(
            "rounded-sm bg-[var(--color-accent-red)] px-5 py-2.5 text-sm font-semibold text-white",
            "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {status === "opening" ? t("submitting") : t("submit")}
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
