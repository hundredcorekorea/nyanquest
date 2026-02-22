"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "TIMEOUT"> {
  return Promise.race([
    promise,
    new Promise<"TIMEOUT">((resolve) => setTimeout(() => resolve("TIMEOUT"), ms)),
  ]);
}

export default function AuthDebug() {
  const [info, setInfo] = useState<string>("starting...");

  useEffect(() => {
    const check = async () => {
      try {
        const lines: string[] = [];

        // Step 1: Cookie check
        const cookies = document.cookie;
        const authCookies = cookies.split(";").filter(c => c.trim().startsWith("sb-"));
        lines.push(`cookies: ${authCookies.length}`);

        // Step 2: Direct API test (bypasses Supabase client)
        const prefix = "sb-gkqodrrlfifachndgfdt-auth-token";
        const chunks: Record<string, string> = {};
        cookies.split(";").forEach(c => {
          const t = c.trim();
          if (t.startsWith(prefix)) {
            const [k, ...v] = t.split("=");
            chunks[k] = v.join("=");
          }
        });
        const raw = decodeURIComponent((chunks[`${prefix}.0`] ?? "") + (chunks[`${prefix}.1`] ?? ""));
        if (raw.startsWith("base64-")) {
          const parsed = JSON.parse(atob(raw.slice(7)));
          lines.push(`direct: ${parsed.user?.email} (${parsed.user?.app_metadata?.provider})`);
        }

        // Step 3: Test createClient() with timeout
        setInfo(lines.join("\n") + "\ntesting createClient()...");
        const supabase = createClient();

        // Test getSession with 3s timeout
        const sessResult = await withTimeout(
          supabase.auth.getSession(),
          3000
        );
        if (sessResult === "TIMEOUT") {
          lines.push("getSession: TIMEOUT (3s) - STILL BROKEN");
          setInfo(lines.join("\n"));
          return;
        }
        const { data: { session }, error: sessErr } = sessResult;
        lines.push(`getSession: ${session ? "OK (" + session.user.email + ")" : "null"} err: ${sessErr?.message ?? "none"}`);

        // Test getUser with 3s timeout
        const userResult = await withTimeout(
          supabase.auth.getUser(),
          3000
        );
        if (userResult === "TIMEOUT") {
          lines.push("getUser: TIMEOUT (3s)");
          setInfo(lines.join("\n"));
          return;
        }
        const { data: { user }, error: userErr } = userResult;
        lines.push(`getUser: ${user ? "OK (" + user.email + ")" : "null"} err: ${userErr?.message ?? "none"}`);

        setInfo(lines.join("\n"));
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
