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

  if (!code) {
    const errorParams = new URLSearchParams({
      error: "auth_callback_failed",
      detail: "no_code_param",
    });
    return NextResponse.redirect(`${origin}/?${errorParams.toString()}`);
  }

  const cookieStore = await cookies();
  const allCookieNames = cookieStore.getAll().map((c) => c.name);

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

    const errorParams = new URLSearchParams({
      error: "auth_callback_failed",
      detail: `exchange:${error.message}|cookies:${allCookieNames.join(",")}`,
    });
    return NextResponse.redirect(`${origin}/?${errorParams.toString()}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const errorParams = new URLSearchParams({
      error: "auth_callback_failed",
      detail: `exception:${msg}|cookies:${allCookieNames.join(",")}`,
    });
    return NextResponse.redirect(`${origin}/?${errorParams.toString()}`);
  }
}
