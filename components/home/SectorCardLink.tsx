"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { trackPlausible } from "@/lib/analytics/plausible";

type SectorSlug = "bottle-washing" | "automotive" | "textile";

interface SectorCardLinkProps {
  pathname: `/products/${SectorSlug}`;
  slug: SectorSlug;
  children: ReactNode;
  className?: string;
}

export function SectorCardLink({ pathname, slug, children, className }: SectorCardLinkProps) {
  return (
    <Link
      href={pathname}
      className={className}
      onClick={() => trackPlausible({ name: "Sector Clicked", props: { slug } })}
    >
      {children}
    </Link>
  );
}
