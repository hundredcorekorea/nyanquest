"use client";

import { useEffect, useState } from "react";

export default function AuthDebug() {
  const [info, setInfo] = useState<string>("1. starting...");

  useEffect(() => {
    const check = async () => {
      try {
        // Step 1: Read auth cookies directly
        const cookies = document.cookie;
        const authCookies = cookies.split(";")
          .filter(c => c.trim().startsWith("sb-"))
          .reduce((acc, c) => {
            const [key, ...rest] = c.trim().split("=");
            acc[key] = rest.join("=");
            return acc;
          }, {} as Record<string, string>);

        const cookieNames = Object.keys(authCookies);
        const lines: string[] = [`cookies: ${cookieNames.length} [${cookieNames.join(", ")}]`];

        // Step 2: Try to parse the chunked auth token
        const prefix = "sb-gkqodrrlfifachndgfdt-auth-token";
        const chunk0 = authCookies[`${prefix}.0`];
        const chunk1 = authCookies[`${prefix}.1`];

        if (chunk0) {
          try {
            const raw = decodeURIComponent(chunk0 + (chunk1 ?? ""));
            const parsed = JSON.parse(raw);
            const accessToken = parsed.access_token;
            const expiresAt = parsed.expires_at;
            const now = Math.floor(Date.now() / 1000);
            const expired = expiresAt ? expiresAt < now : "unknown";

            lines.push(`token: ${accessToken ? "exists (" + accessToken.slice(0, 20) + "...)" : "null"}`);
            lines.push(`expires_at: ${expiresAt} (now: ${now}, expired: ${expired})`);
            lines.push(`user_email: ${parsed.user?.email ?? "none"}`);
            lines.push(`provider: ${parsed.user?.app_metadata?.provider ?? "none"}`);

            // Step 3: Try direct API call with the token
            if (accessToken) {
              setInfo(lines.join("\n") + "\nfetching /auth/v1/user...");

              const resp = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  },
                }
              );
              const body = await resp.text();
              lines.push(`API status: ${resp.status}`);
              if (resp.ok) {
                const user = JSON.parse(body);
                lines.push(`API user: ${user.email} (${user.id?.slice(0, 8)})`);
              } else {
                lines.push(`API error: ${body.slice(0, 100)}`);
              }
            }
          } catch (e) {
            lines.push(`parse error: ${e instanceof Error ? e.message : String(e)}`);
          }
        } else {
          lines.push("no auth token cookies found");
        }

        // Step 4: Check navigator.locks
        if (navigator.locks) {
          const locks = await navigator.locks.query();
          const sbLocks = locks.held?.filter(l => l.name?.includes("supabase")) ?? [];
          const pending = locks.pending?.filter(l => l.name?.includes("supabase")) ?? [];
          lines.push(`locks held: ${sbLocks.length}, pending: ${pending.length}`);
          if (sbLocks.length > 0) lines.push(`held names: ${sbLocks.map(l => l.name ?? "?").join(", ")}`);
          if (pending.length > 0) lines.push(`pending names: ${pending.map(l => l.name ?? "?").join(", ")}`);
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
