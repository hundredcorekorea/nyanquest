"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | { timeout: true; label: string }> {
  return Promise.race([
    promise,
    new Promise<{ timeout: true; label: string }>((resolve) =>
      setTimeout(() => resolve({ timeout: true, label }), ms)
    ),
  ]);
}

export default function AuthDebug() {
  const [info, setInfo] = useState<string>("1. starting...");

  useEffect(() => {
    const check = async () => {
      try {
        // Step 1: Check cookies visible to JS (sync)
        const cookies = document.cookie;
        const authCookies = cookies.split(";").filter(c => c.trim().startsWith("sb-"));
        const cookieNames = authCookies.map(c => c.trim().split("=")[0]);

        setInfo(`cookies: ${authCookies.length} [${cookieNames.join(", ")}]\nchecking getUser (5s timeout)...`);

        // Step 2: Try getUser with timeout (what AuthButton uses)
        const supabase = createClient();
        const userResult = await withTimeout(
          supabase.auth.getUser(),
          5000,
          "getUser"
        );

        if (userResult && "timeout" in userResult) {
          setInfo(`cookies: ${authCookies.length} [${cookieNames.join(", ")}]\ngetUser: TIMEOUT (5s)\nThis means Supabase client is hanging.`);
          return;
        }

        const { data: { user }, error: userErr } = userResult as { data: { user: unknown }; error: { message: string } | null };
        const u = user as { id: string; email?: string; app_metadata?: { provider?: string } } | null;

        // Step 3: Check profile if user exists
        let profileInfo = "no user";
        if (u) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, nickname")
            .eq("id", u.id)
            .single();
          profileInfo = error ? `err: ${error.message}` : data ? (data as { nickname: string }).nickname : "null";
        }

        setInfo(JSON.stringify({
          cookies: { count: authCookies.length, names: cookieNames },
          user: u ? { id: u.id.slice(0, 8), email: u.email, provider: u.app_metadata?.provider } : null,
          userErr: userErr?.message ?? null,
          profile: profileInfo,
        }, null, 1));
      } catch (e) {
        setInfo(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    check();
  }, []);

  return (
    <details className="bg-gray-100 rounded p-2 text-xs font-mono mb-2" open>
      <summary className="cursor-pointer text-gray-500">auth debug</summary>
      <pre className="mt-1 whitespace-pre-wrap break-all text-gray-700">{info}</pre>
    </details>
  );
}
