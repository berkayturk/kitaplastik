// components/admin/settings/company/CompanyForm.tsx
"use client";

import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
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
    handleSubmit,
    getValues,
    formState: { isDirty, isValid, isSubmitting, errors },
  } = useForm<Company>({
    resolver: zodResolver(CompanySchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<Company> = async () => {
    const v = getValues();
    const fd = new FormData();
    fd.set("legalName", v.legalName);
    fd.set("brandName", v.brandName);
    fd.set("shortName", v.shortName);
    fd.set("founded", String(v.founded));
    fd.set("address", JSON.stringify(v.address));
    fd.set("phone", JSON.stringify(v.phone));
    fd.set("cellPhone", JSON.stringify(v.cellPhone));
    fd.set("fax", JSON.stringify(v.fax));
    fd.set("email", JSON.stringify(v.email));
    fd.set("whatsapp", JSON.stringify(v.whatsapp));
    fd.set("telegram", JSON.stringify(v.telegram));
    fd.set("web", JSON.stringify(v.web));
    await action(fd);
  };

  const errMsg = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-[var(--color-alert-red)]">{msg}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
        <div className="grid grid-cols-3 gap-3">
          <LabeledInput label="İlçe" {...register("address.district")} />
          <LabeledInput label="Şehir" {...register("address.city")} />
          <LabeledInput label="Ülke kodu (2 harf)" {...register("address.countryCode")} />
        </div>
        <LabeledInput label="Google Maps URL" {...register("address.maps")} />
        {errMsg(errors.address?.maps?.message)}

        <h3 className="font-display mt-4 text-[14px] font-medium text-[var(--color-text-secondary)]">
          Telefonlar
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Sabit hat (görünen)" {...register("phone.display")} />
          <LabeledInput label="Sabit hat (E.164)" {...register("phone.tel")} />
        </div>
        {errMsg(errors.phone?.tel?.message)}
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Cep (görünen)" {...register("cellPhone.display")} />
          <LabeledInput label="Cep (E.164)" {...register("cellPhone.tel")} />
        </div>
        {errMsg(errors.cellPhone?.tel?.message)}
        <LabeledInput label="Faks (görünen)" {...register("fax.display")} />

        <h3 className="font-display mt-4 text-[14px] font-medium text-[var(--color-text-secondary)]">
          E-posta
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Birincil" type="email" {...register("email.primary")} />
          <LabeledInput label="İkincil" type="email" {...register("email.secondary")} />
        </div>
        {errMsg(errors.email?.primary?.message)}
      </CompanySection>

      <CompanySection index={3} title="Mesajlaşma">
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="WhatsApp (görünen)" {...register("whatsapp.display")} />
          <LabeledInput label="WhatsApp (wa.me)" {...register("whatsapp.wa")} />
        </div>
        {errMsg(errors.whatsapp?.wa?.message)}
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Telegram handle" {...register("telegram.handle")} />
          <LabeledInput label="Telegram görünen" {...register("telegram.display")} />
        </div>
      </CompanySection>

      <CompanySection index={4} title="Web">
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Birincil URL" type="url" {...register("web.primary")} />
          <LabeledInput label="Alternatif URL" type="url" {...register("web.alt")} />
        </div>
        {errMsg(errors.web?.primary?.message)}
      </CompanySection>

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
