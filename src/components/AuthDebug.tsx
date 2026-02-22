"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function AuthDebug() {
  const [info, setInfo] = useState<string>("1. starting...");

  useEffect(() => {
    const check = async () => {
      try {
        // Step 1: Check cookies visible to JS
        const cookies = document.cookie;
        const authCookies = cookies.split(";").filter(c => c.trim().startsWith("sb-"));
        setInfo(`2. cookies: ${authCookies.length} auth cookies found`);

        // Step 2: Create client
        const supabase = createClient();
        setInfo(`3. client created, checking session...`);

        // Step 3: Check getSession (faster, reads from cookie/memory)
        const { data: { session }, error: sessErr } = await supabase.auth.getSession();
        setInfo(`4. session: ${session ? "exists" : "null"}, err: ${sessErr?.message ?? "none"}`);

        // Step 4: Check getUser (makes API call)
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        setInfo(`5. user: ${user ? user.id.slice(0, 8) : "null"}, err: ${userErr?.message ?? "none"}`);

        // Step 5: Check profile if user exists
        let profileInfo = "no user";
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, nickname")
            .eq("id", user.id)
            .single();
          profileInfo = error ? `err: ${error.message}` : data ? data.nickname : "null";
        }

        setInfo(JSON.stringify({
          authCookieCount: authCookies.length,
          authCookieNames: authCookies.map(c => c.trim().split("=")[0]),
          session: session ? "exists" : null,
          sessErr: sessErr?.message ?? null,
          user: user ? { id: user.id.slice(0, 8), email: user.email, provider: user.app_metadata?.provider } : null,
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
