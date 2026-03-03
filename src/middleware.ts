import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware (locale detection, redirects, rewrites)
  const intlResponse = intlMiddleware(request);

  // 2. Run Supabase session refresh — even on redirects so auth cookies persist
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    "/((?!api|auth/callback|_next/static|_next/image|favicon.ico|sw\\.js|bgm/|sfx/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html|txt|xml|mp3|wav|ogg|webm)$).*)",
  ],
};
