import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("[auth/callback] params:", {
    hasCode: !!code,
    next,
    error: searchParams.get("error"),
    errorDesc: searchParams.get("error_description"),
    allParams: Object.fromEntries(searchParams.entries()),
  });

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

  if (code) {
    const cookieStore = await cookies();
    const existingCookies = cookieStore.getAll();
    console.log("[auth/callback] Existing cookies:", existingCookies.map(c => c.name));

    // Collect cookies that Supabase wants to set
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookies) {
            console.log("[auth/callback] setAll called with cookies:", cookies.map(c => c.name));
            cookiesToSet.push(...cookies);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("[auth/callback] Exchange result:", {
      success: !error,
      error: error?.message,
      cookiesCollected: cookiesToSet.length,
      cookieNames: cookiesToSet.map(c => c.name),
    });

    if (!error) {
      const redirectUrl = `${origin}${next}`;
      console.log("[auth/callback] Redirecting to:", redirectUrl);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      for (const { name, value, options } of cookiesToSet) {
        redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2]);
      }
      console.log("[auth/callback] Set cookies on response:", cookiesToSet.map(c => c.name));
      return redirectResponse;
    }

    console.error("[auth/callback] Code exchange failed:", error.message);
  }

  console.error("[auth/callback] Falling through to error redirect");
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
