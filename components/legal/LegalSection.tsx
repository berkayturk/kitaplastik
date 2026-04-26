import type { ReactNode } from "react";

interface LegalSectionProps {
  heading: string;
  children: ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="mt-10">
      <h2 className="text-text-primary text-[22px] leading-[1.3] font-semibold md:text-[26px]">
        {heading}
      </h2>
      <div className="text-text-secondary mt-3 space-y-3 text-[15px] leading-[1.7]">{children}</div>
    </section>
  );
}
