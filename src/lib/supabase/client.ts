// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

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

/**
 * Raw supabase-js client for queries and session reading.
 * Do NOT use for signInWithOAuth — use createAuthClient() instead.
 */
export function createClient() {
  if (instance) return instance;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance = createSupabaseClient<any, "public", any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
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

/**
 * SSR browser client for auth actions only (signInWithOAuth, signOut).
 * This client uses @supabase/ssr's cookie storage which properly stores
 * the PKCE code_verifier. Do NOT call getSession()/getUser() on this —
 * it hangs due to a navigator.locks issue in @supabase/ssr 0.8.0.
 */
let authInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createAuthClient() {
  if (authInstance) return authInstance;
  authInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieEncoding: "base64url" }
  );
  return authInstance;
}
