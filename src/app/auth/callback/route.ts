import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
