import type { ReactNode } from "react";

interface LegalLayoutProps {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}

export function LegalLayout({ title, intro, children }: LegalLayoutProps) {
  return (
    <section className="container mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="text-text-primary text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        <div className="text-text-secondary mt-5 text-[17px] leading-[1.65]">{intro}</div>
      </header>
      <article>{children}</article>
    </section>
  );
}
