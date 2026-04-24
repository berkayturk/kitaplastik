// app/admin/settings/company/page.tsx
import { requireAdminRole } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { getCompanyForAdmin } from "@/lib/admin/company";
import { CompanyForm } from "@/components/admin/settings/company/CompanyForm";
import { updateCompany } from "./actions";

interface PageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const user = await requireAdminRole();
  const company = await getCompanyForAdmin();
  const { success } = await searchParams;

  return (
    <Shell user={user} active="company">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-medium tracking-tight text-[var(--color-text-primary)]">
          Şirket Bilgileri
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Public site&apos;ta gösterilen iletişim ve marka bilgileri. Değişiklikler anında yayına
          alınır.
        </p>
      </header>
      {success === "updated" && (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-sm)] border border-[var(--color-accent-jade)]/40 bg-[var(--color-accent-jade)]/10 px-4 py-3 text-sm text-[var(--color-accent-jade)]"
        >
          Kaydedildi.
        </p>
      )}
      <CompanyForm defaultValues={company.data} action={updateCompany} />
    </Shell>
  );
}
