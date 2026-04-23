import * as Sentry from "@sentry/nextjs";

export function sendNotFoundBreadcrumb(pathname: string, referrer: string | null): void {
  Sentry.addBreadcrumb({
    category: "navigation.404",
    level: "warning",
    message: `404: ${pathname}`,
    data: { referrer },
  });
}
