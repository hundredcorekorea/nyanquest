"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
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
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Parse token from cookies
        const prefix = "sb-gkqodrrlfifachndgfdt-auth-token";
        const chunks: Record<string, string> = {};
        document.cookie.split(";").forEach(c => {
          const t = c.trim();
          if (t.startsWith(prefix)) {
            const [k, ...v] = t.split("=");
            chunks[k] = v.join("=");
          }
        });
        const raw = decodeURIComponent((chunks[`${prefix}.0`] ?? "") + (chunks[`${prefix}.1`] ?? ""));
        let accessToken = "";
        let refreshToken = "";
        if (raw.startsWith("base64-")) {
          const parsed = JSON.parse(atob(raw.slice(7)));
          accessToken = parsed.access_token ?? "";
          refreshToken = parsed.refresh_token ?? "";
          lines.push(`cookie: ${parsed.user?.email} (${parsed.user?.app_metadata?.provider})`);
        } else {
          lines.push("no base64 token");
        }

        // Test 1: Non-singleton createBrowserClient
        setInfo(lines.join("\n") + "\ntest1: non-singleton...");
        const client1 = createBrowserClient(url, key, {
          cookieEncoding: "base64url",
          isSingleton: false,
        });
        const r1 = await withTimeout(client1.auth.getSession(), 3000);
        lines.push(`test1 (non-singleton): ${r1 === "TIMEOUT" ? "TIMEOUT" : r1.data.session ? "OK " + r1.data.session.user.email : "null"}`);
        setInfo(lines.join("\n"));

        // Test 2: Raw supabase-js client + setSession
        if (accessToken && refreshToken) {
          setInfo(lines.join("\n") + "\ntest2: raw client...");
          const client2 = createRawClient(url, key, {
            auth: { persistSession: false },
          });
          const { data, error } = await client2.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          lines.push(`test2 (raw+setSession): ${error ? "ERR " + error.message : data.user ? "OK " + data.user.email : "null"}`);
        }

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
