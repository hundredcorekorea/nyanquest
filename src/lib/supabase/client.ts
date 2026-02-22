// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-based storage adapter for supabase-js auth.
 * Required for PKCE flow: stores code_verifier in a cookie so the
 * server-side callback can read it during code exchange.
 */
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${key}=`));
    return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=3600; SameSite=Lax; Secure`;
  },
  removeItem: (key: string): void => {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax; Secure`;
  },
};

function getSessionFromCookies(): {
  access_token: string;
  refresh_token: string;
} | null {
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

  if (json?.access_token && json?.refresh_token) {
    return {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
    };
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: SupabaseClient<any, "public", any> | null = null;
let sessionSet = false;

export function createClient() {
  if (instance) return instance;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance = createSupabaseClient<any, "public", any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: cookieStorage,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  // Hydrate session from server-managed cookies
  if (!sessionSet) {
    sessionSet = true;
    try {
      const session = getSessionFromCookies();
      if (session) {
        instance.auth.setSession(session);
      }
    } catch {
      // Cookie parsing failed — no session
    }
  }

  return instance;
}
