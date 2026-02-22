import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Supabase redirected with an error (provider-level failure)
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (errorParam) {
    console.error("[auth/callback] Provider error:", errorParam, errorDescription);
    const params = new URLSearchParams({
      error: errorParam,
      ...(errorDescription && { error_description: errorDescription }),
    });
    return NextResponse.redirect(`${origin}/?${params.toString()}`);
  }

  let exchangeError: string | null = null;

  if (code) {
    const cookieStore = await cookies();

    // Collect cookies that Supabase wants to set
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieEncoding: "base64url",
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookies) {
            cookiesToSet.push(...cookies);
          },
        },
      }
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        const redirectResponse = NextResponse.redirect(`${origin}${next}`);
        for (const { name, value, options } of cookiesToSet) {
          redirectResponse.cookies.set(name, value, {
            ...(options as Record<string, unknown>),
            httpOnly: false,
          } as Parameters<typeof redirectResponse.cookies.set>[2]);
        }
        return redirectResponse;
      }

      exchangeError = error.message;
      console.error("[auth/callback] Code exchange failed:", error.message);
    } catch (e) {
      exchangeError = e instanceof Error ? e.message : String(e);
      console.error("[auth/callback] Exception:", exchangeError);
    }
  }

  const errorParams = new URLSearchParams({ error: "auth_callback_failed" });
  if (exchangeError) errorParams.set("detail", exchangeError);
  return NextResponse.redirect(`${origin}/?${errorParams.toString()}`);
}
