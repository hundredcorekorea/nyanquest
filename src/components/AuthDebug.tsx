"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function AuthDebug() {
  const [info, setInfo] = useState<string>("loading...");

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();

      // Check getUser
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      // Check getSession
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();

      // Check cookies visible to JS
      const cookies = document.cookie;
      const authCookies = cookies.split(";").filter(c => c.trim().startsWith("sb-"));

      // Check profile if user exists
      let profileInfo = "no user";
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, nickname")
          .eq("id", user.id)
          .single();
        profileInfo = error ? `err: ${error.message}` : data ? `${data.nickname}` : "null";
      }

      setInfo(JSON.stringify({
        user: user ? { id: user.id.slice(0, 8), email: user.email, provider: user.app_metadata?.provider } : null,
        userErr: userErr?.message ?? null,
        session: session ? "exists" : null,
        sessErr: sessErr?.message ?? null,
        profile: profileInfo,
        authCookieCount: authCookies.length,
        authCookieNames: authCookies.map(c => c.trim().split("=")[0]),
      }, null, 1));
    };
    check();
  }, []);

  return (
    <details className="bg-gray-100 rounded p-2 text-xs font-mono mb-2">
      <summary className="cursor-pointer text-gray-500">auth debug</summary>
      <pre className="mt-1 whitespace-pre-wrap break-all text-gray-700">{info}</pre>
    </details>
  );
}
