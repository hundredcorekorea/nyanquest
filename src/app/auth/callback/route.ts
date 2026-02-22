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
    const params = new URLSearchParams({
      error: errorParam,
      ...(errorDescription && { error_description: errorDescription }),
    });
    return NextResponse.redirect(`${origin}/?${params.toString()}`);
  }

  if (code) {
    const cookieStore = await cookies();

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
            cookiesToSet.push(...cookies);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Create redirect response and explicitly set all auth cookies on it
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);
      for (const { name, value, options } of cookiesToSet) {
        redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2]);
      }
      return redirectResponse;
    }

    console.error("Code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
