// components/admin/settings/company/CompanyForm.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CompanySchema, type Company } from "@/lib/admin/schemas/company";
import { CompanySection } from "./CompanySection";

interface CompanyFormProps {
  defaultValues: Company;
  action: (formData: FormData) => void | Promise<void>;
}

type LabeledInputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

const LabeledInput = React.forwardRef<HTMLInputElement, LabeledInputProps>(function LabeledInput(
  { label, id, ...rest },
  ref,
) {
  const inputId = id ?? (rest.name as string | undefined);
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-[12px] font-medium tracking-wide text-[var(--color-text-secondary)] uppercase">
        {label}
      </span>
      <input
        id={inputId}
        ref={ref}
        {...rest}
        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent-cobalt)] focus:outline-none"
      />
    </label>
  );
});

export function CompanyForm({ defaultValues, action }: CompanyFormProps) {
  const {
    register,
    watch,
    formState: { isDirty, isValid, isSubmitting, errors },
  } = useForm<Company>({
    resolver: zodResolver(CompanySchema),
    defaultValues,
    mode: "onChange",
  });

  // Watch nested objects so their JSON serialisation in the hidden inputs
  // below stays in sync with the user's current edits. Native <form action>
  // reads only what's in the DOM at submit time, so RHF's internal state
  // must be mirrored back into hidden fields.
  const address = watch("address");
  const phone = watch("phone");
  const cellPhone = watch("cellPhone");
  const fax = watch("fax");
  const email = watch("email");
  const whatsapp = watch("whatsapp");
  const telegram = watch("telegram");
  const web = watch("web");

  const errMsg = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-[var(--color-alert-red)]">{msg}</p> : null;

  return (
    <form action={action} className="space-y-6">
      {/* Scalar fields submitted as-is via their `name` attribute. Nested
          groups mirrored into hidden JSON inputs below (native <form>
          serialisation does not walk object shapes). */}
      <CompanySection index={1} title="Marka & Kimlik">
        <LabeledInput label="Marka adı" {...register("brandName")} />
        {errMsg(errors.brandName?.message)}
        <LabeledInput label="Tam ünvan (legal)" {...register("legalName")} />
        {errMsg(errors.legalName?.message)}
        <LabeledInput label="Kısa ad" {...register("shortName")} />
        {errMsg(errors.shortName?.message)}
        <LabeledInput
          label="Kuruluş yılı"
          type="number"
          {...register("founded", { valueAsNumber: true })}
        />
        {errMsg(errors.founded?.message)}
      </CompanySection>

      <CompanySection index={2} title="İletişim">
        <h3 className="font-display text-[14px] font-medium text-[var(--color-text-secondary)]">
          Adres
        </h3>
        <LabeledInput label="Sokak / No" {...register("address.street")} />
        {errMsg(errors.address?.street?.message)}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <LabeledInput label="İlçe" {...register("address.district")} />
            {errMsg(errors.address?.district?.message)}
          </div>
          <div>
            <LabeledInput label="Şehir" {...register("address.city")} />
            {errMsg(errors.address?.city?.message)}
          </div>
          <div>
            <LabeledInput label="Ülke kodu (2 harf)" {...register("address.countryCode")} />
            {errMsg(errors.address?.countryCode?.message)}
          </div>
        </div>
        <LabeledInput label="Google Maps URL" {...register("address.maps")} />
        {errMsg(errors.address?.maps?.message)}

        <h3 className="font-display mt-4 text-[14px] font-medium text-[var(--color-text-secondary)]">
          Telefonlar
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <LabeledInput label="Sabit hat (görünen)" {...register("phone.display")} />
            {errMsg(errors.phone?.display?.message)}
          </div>
          <div>
            <LabeledInput label="Sabit hat (E.164)" {...register("phone.tel")} />
            {errMsg(errors.phone?.tel?.message)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <LabeledInput label="Cep (görünen)" {...register("cellPhone.display")} />
            {errMsg(errors.cellPhone?.display?.message)}
          </div>
          <div>
            <LabeledInput label="Cep (E.164)" {...register("cellPhone.tel")} />
            {errMsg(errors.cellPhone?.tel?.message)}
          </div>
        </div>
        <LabeledInput label="Faks (görünen)" {...register("fax.display")} />
        {errMsg(errors.fax?.display?.message)}

        <h3 className="font-display mt-4 text-[14px] font-medium text-[var(--color-text-secondary)]">
          E-posta
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <LabeledInput label="Birincil" type="email" {...register("email.primary")} />
            {errMsg(errors.email?.primary?.message)}
          </div>
          <div>
            <LabeledInput label="İkincil" type="email" {...register("email.secondary")} />
            {errMsg(errors.email?.secondary?.message)}
          </div>
        </div>
      </CompanySection>

      <CompanySection index={3} title="Mesajlaşma">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <LabeledInput label="WhatsApp (görünen)" {...register("whatsapp.display")} />
            {errMsg(errors.whatsapp?.display?.message)}
          </div>
          <div>
            <LabeledInput label="WhatsApp (wa.me)" {...register("whatsapp.wa")} />
            {errMsg(errors.whatsapp?.wa?.message)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <LabeledInput label="Telegram handle" {...register("telegram.handle")} />
            {errMsg(errors.telegram?.handle?.message)}
          </div>
          <div>
            <LabeledInput label="Telegram görünen" {...register("telegram.display")} />
            {errMsg(errors.telegram?.display?.message)}
          </div>
        </div>
      </CompanySection>

      <CompanySection index={4} title="Web">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <LabeledInput label="Birincil URL" type="url" {...register("web.primary")} />
            {errMsg(errors.web?.primary?.message)}
          </div>
          <div>
            <LabeledInput label="Alternatif URL" type="url" {...register("web.alt")} />
            {errMsg(errors.web?.alt?.message)}
          </div>
        </div>
      </CompanySection>

      {/* Hidden inputs: nested objects serialised for native <form action>
          submission. updateCompany parseJson's each group name. */}
      <input type="hidden" name="address" value={JSON.stringify(address)} readOnly />
      <input type="hidden" name="phone" value={JSON.stringify(phone)} readOnly />
      <input type="hidden" name="cellPhone" value={JSON.stringify(cellPhone)} readOnly />
      <input type="hidden" name="fax" value={JSON.stringify(fax)} readOnly />
      <input type="hidden" name="email" value={JSON.stringify(email)} readOnly />
      <input type="hidden" name="whatsapp" value={JSON.stringify(whatsapp)} readOnly />
      <input type="hidden" name="telegram" value={JSON.stringify(telegram)} readOnly />
      <input type="hidden" name="web" value={JSON.stringify(web)} readOnly />

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/settings/company"
          className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          İptal
        </Link>
        <button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          className="rounded-[var(--radius-sm)] bg-[var(--color-accent-cobalt)] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
