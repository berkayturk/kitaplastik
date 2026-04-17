import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Exclude static assets and API routes
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
