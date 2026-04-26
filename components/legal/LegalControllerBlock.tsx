import type { Company } from "@/lib/admin/schemas/company";

interface LegalControllerBlockProps {
  company: Company;
  labels: {
    legalName: string;
    address: string;
    phone: string;
    email: string;
    taxOffice: string;
    mersisNo: string;
    kep: string;
    verbisStatus: string;
    dpoStatus: string;
  };
  staticFacts: {
    taxOffice: string;
    mersisNo: string;
    kep?: string | null;
    verbisStatus: string;
    dpoStatus: string;
  };
}

export function LegalControllerBlock({ company, labels, staticFacts }: LegalControllerBlockProps) {
  const addressFull = `${company.address.street}, ${company.address.district} / ${company.address.city}`;
  const fields: { label: string; value: string }[] = [
    { label: labels.legalName, value: company.legalName },
    { label: labels.address, value: addressFull },
    { label: labels.phone, value: company.phone.display },
    { label: labels.email, value: company.email.primary },
    { label: labels.taxOffice, value: staticFacts.taxOffice },
    { label: labels.mersisNo, value: staticFacts.mersisNo },
    ...(staticFacts.kep ? [{ label: labels.kep, value: staticFacts.kep }] : []),
    { label: labels.verbisStatus, value: staticFacts.verbisStatus },
    { label: labels.dpoStatus, value: staticFacts.dpoStatus },
  ];

  return (
    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 text-[15px] sm:grid-cols-[max-content_1fr]">
      {fields.map((f) => (
        <div key={f.label} className="contents">
          <dt className="text-text-tertiary font-medium">{f.label}:</dt>
          <dd className="text-text-secondary">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
