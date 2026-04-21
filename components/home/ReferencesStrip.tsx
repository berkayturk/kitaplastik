import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "../layout/Container";
import { getReferences } from "@/lib/references/data";

export async function ReferencesStrip() {
  const tHome = await getTranslations("home.references");
  const tClients = await getTranslations("references.clients");
  const references = await getReferences();

  return (
    <section
      aria-labelledby="references-strip-title"
      className="border-y border-[var(--color-border-hairline)] bg-[var(--color-bg-subtle)] py-12 md:py-16"
    >
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{tHome("eyebrow")}</p>
            <h2
              id="references-strip-title"
              className="font-display mt-3 text-[22px] leading-[1.2] font-medium tracking-[-0.01em] md:text-[26px]"
              style={{ fontOpticalSizing: "auto" }}
            >
              {tHome("title")}
            </h2>
          </div>
          <Link
            href="/references"
            className="text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-200 ease-out hover:text-[var(--color-accent-cobalt)]"
          >
            {tHome("viewAll")} →
          </Link>
        </div>

        <ul
          role="list"
          className="grid grid-cols-2 items-center gap-x-10 gap-y-8 sm:grid-cols-4 lg:grid-cols-8"
        >
          {references.map((ref) => {
            const name = tClients(`${ref.key}.name`);
            return (
              <li key={ref.id} className="flex items-center justify-center">
                <Image
                  src={ref.logoPath}
                  alt={name}
                  width={140}
                  height={48}
                  className="h-9 w-auto opacity-55 brightness-50 grayscale transition-opacity duration-200 ease-out hover:opacity-100 hover:brightness-100 hover:grayscale-0"
                />
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
