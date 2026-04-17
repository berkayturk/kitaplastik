import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getReferences } from "@/lib/references/data";
import { cn } from "@/lib/utils";

export function ReferencesStrip() {
  const tHome = useTranslations("home.references");
  const tClients = useTranslations("references.clients");
  const references = getReferences();

  return (
    <section
      aria-labelledby="references-strip-title"
      className="bg-bg-primary/80 border-y border-[var(--color-border-subtle-dark)] py-10 backdrop-blur-sm md:py-14"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{tHome("eyebrow")}</p>
            <h2
              id="references-strip-title"
              className="text-text-primary mt-1 text-lg font-semibold tracking-tight md:text-xl"
            >
              {tHome("title")}
            </h2>
          </div>
          <Link
            href="/referanslar"
            className="text-text-secondary hover:text-text-primary text-sm underline underline-offset-4"
          >
            {tHome("viewAll")} →
          </Link>
        </div>

        <ul
          role="list"
          className={cn(
            "grid grid-cols-2 items-center gap-x-8 gap-y-6",
            "sm:grid-cols-4 lg:grid-cols-8",
            "text-text-secondary",
          )}
        >
          {references.map((ref) => {
            const name = tClients(`${ref.key}.name`);
            return (
              <li key={ref.id} className="flex items-center justify-center">
                <Image
                  src={ref.logoPath}
                  alt={name}
                  width={150}
                  height={60}
                  className="h-12 w-auto opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
