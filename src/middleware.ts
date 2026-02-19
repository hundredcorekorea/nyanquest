import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware (locale detection, redirects, rewrites)
  const intlResponse = intlMiddleware(request);

  // If next-intl issued a redirect (e.g., / -> /ko/), return it with auth cookies
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // 2. Run Supabase session refresh on the intl response
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    "/((?!api|auth/callback|_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
