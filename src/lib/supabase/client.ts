import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Read authenticated user directly from cookies.
 * Bypasses supabase.auth.getUser() which hangs due to navigator.locks
 * issue in @supabase/ssr 0.8.0 + supabase-js 2.95.3.
 */
export function getUserFromCookies(): User | null {
  if (typeof document === "undefined") return null;

  try {
    const prefix = "sb-gkqodrrlfifachndgfdt-auth-token";
    const chunks: Record<string, string> = {};
    document.cookie.split(";").forEach((c) => {
      const t = c.trim();
      if (t.startsWith(prefix + ".")) {
        const [k, ...v] = t.split("=");
        chunks[k] = v.join("=");
      }
    });

    let combined = "";
    let i = 0;
    while (chunks[`${prefix}.${i}`] !== undefined) {
      combined += chunks[`${prefix}.${i}`];
      i++;
    }
    if (!combined) return null;

    const raw = decodeURIComponent(combined);
    const json = raw.startsWith("base64-")
      ? JSON.parse(atob(raw.slice(7)))
      : JSON.parse(raw);

    return json?.user ?? null;
  } catch {
    return null;
  }
}
