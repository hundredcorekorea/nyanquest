"use client";

import { useEffect, useState } from "react";

export default function AuthDebug() {
  const [info, setInfo] = useState<string>("starting...");

  useEffect(() => {
    const check = async () => {
      try {
        const lines: string[] = [];

        // Step 1: Read auth cookies
        const cookies = document.cookie;
        const authCookies: Record<string, string> = {};
        cookies.split(";").forEach(c => {
          const trimmed = c.trim();
          if (trimmed.startsWith("sb-")) {
            const [key, ...rest] = trimmed.split("=");
            authCookies[key] = rest.join("=");
          }
        });
        const cookieNames = Object.keys(authCookies);
        lines.push(`cookies: ${cookieNames.length}`);

        // Step 2: Parse base64-encoded chunked token
        const prefix = "sb-gkqodrrlfifachndgfdt-auth-token";
        const chunk0 = authCookies[`${prefix}.0`] ?? "";
        const chunk1 = authCookies[`${prefix}.1`] ?? "";
        const raw = decodeURIComponent(chunk0 + chunk1);

        let accessToken = "";
        let tokenInfo = "";

        if (raw.startsWith("base64-")) {
          const decoded = atob(raw.slice(7)); // strip "base64-" prefix
          const parsed = JSON.parse(decoded);
          accessToken = parsed.access_token ?? "";
          const expiresAt = parsed.expires_at;
          const now = Math.floor(Date.now() / 1000);
          tokenInfo = `expires: ${expiresAt} (now: ${now}, ${expiresAt > now ? "VALID" : "EXPIRED"})`;
          lines.push(`email: ${parsed.user?.email ?? "none"}`);
          lines.push(`provider: ${parsed.user?.app_metadata?.provider ?? "none"}`);
          lines.push(tokenInfo);
          lines.push(`token: ${accessToken.slice(0, 30)}...`);
        } else {
          lines.push(`raw cookie format: ${raw.slice(0, 30)}...`);
        }

        // Step 3: Direct API call
        if (accessToken) {
          setInfo(lines.join("\n") + "\ncalling API...");
          const resp = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              },
            }
          );
          if (resp.ok) {
            const user = await resp.json();
            lines.push(`API: OK - ${user.email}`);
          } else {
            const body = await resp.text();
            lines.push(`API: ${resp.status} - ${body.slice(0, 80)}`);
          }
        }

        // Step 4: Navigator locks
        if (navigator.locks) {
          const locks = await navigator.locks.query();
          const sbHeld = locks.held?.filter(l => l.name?.includes("supabase")) ?? [];
          const sbPending = locks.pending?.filter(l => l.name?.includes("supabase")) ?? [];
          lines.push(`locks: held=${sbHeld.length} pending=${sbPending.length}`);
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
