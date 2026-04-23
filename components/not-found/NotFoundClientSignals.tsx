"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendNotFoundBreadcrumb } from "@/lib/sentry/not-found";

const MAX_ECHO_LEN = 250;

interface Props {
  label: string;
}

export function NotFoundClientSignals({ label }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;
    sendNotFoundBreadcrumb(pathname, referrer);
  }, [pathname]);

  if (!pathname) return null;

  const display = pathname.length > MAX_ECHO_LEN ? `${pathname.slice(0, MAX_ECHO_LEN)}…` : pathname;

  return (
    <p className="text-text-tertiary mt-6 font-mono text-sm">
      {label} <span className="break-all">{display}</span>
    </p>
  );
}
