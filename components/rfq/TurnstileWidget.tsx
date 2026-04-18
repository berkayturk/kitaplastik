// components/rfq/TurnstileWidget.tsx
"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { env } from "@/lib/env";

interface Props {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  action?: string;
}

export function TurnstileWidget({ onSuccess, onExpire, action }: Props) {
  return (
    <Turnstile
      siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      options={{ theme: "dark", size: "normal", action: action ?? "submit" }}
      onSuccess={onSuccess}
      onExpire={onExpire}
    />
  );
}
