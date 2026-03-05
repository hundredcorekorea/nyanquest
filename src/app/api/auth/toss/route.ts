import { NextRequest } from "next/server";
export { OPTIONS } from "@/lib/api-cors";
import { corsJson } from "@/lib/api-cors";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/toss
 *
 * Receives Toss authorizationCode from the client,
 * maps Toss user to a Supabase user, and returns a session.
 *
 * Flow:
 * 1. Client calls appLogin() → gets authorizationCode
 * 2. Client POST this route with { authorizationCode }
 * 3. Server exchanges code with Toss OAuth server → gets tossUserId
 * 4. Server upserts Supabase user with toss_<tossUserId> identity
 * 5. Returns session token to client
 */
export async function POST(request: NextRequest) {
  try {
    const { authorizationCode, referrer } = await request.json();

    if (!authorizationCode) {
      return corsJson({ error: "Missing authorizationCode" }, { status: 400 });
    }

    // --- Toss OAuth token exchange ---
    let tossUserId: string;

    const clientId = process.env.TOSS_CLIENT_ID;
    const clientSecret = process.env.TOSS_CLIENT_SECRET;

    if (clientId && clientSecret) {
      // Production: exchange authorizationCode with Toss OAuth server
      const tokenRes = await fetch("https://oauth.toss.im/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authorizationCode,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text().catch(() => "");
        console.error("[Toss Auth] OAuth exchange failed:", tokenRes.status, errText);
        return corsJson({ error: "Toss OAuth failed" }, { status: 401 });
      }

      const tokenData = await tokenRes.json();
      // Toss returns: { access_token, token_type, expires_in, scope, user_id, ... }
      tossUserId = `toss_${tokenData.user_id || tokenData.sub || authorizationCode.slice(0, 32)}`;
    } else {
      // Dev fallback: use authorizationCode as temporary identifier
      console.warn("[Toss Auth] No TOSS_CLIENT_ID/SECRET — using dev fallback");
      tossUserId = `toss_${authorizationCode.slice(0, 32)}`;
    }

    const tossEmail = `${tossUserId}@toss.miniapp`;

    // Upsert user in Supabase via admin client
    const supabase = createAdminClient();

    // Check if user exists
    const { data: existingUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("toss_user_id", tossUserId)
      .limit(1);

    let userId: string;

    if (existingUsers && existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      // Create new user via admin API
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: tossEmail,
          email_confirm: true,
          user_metadata: {
            provider: "toss",
            toss_user_id: tossUserId,
            referrer,
          },
        });

      if (createError || !newUser.user) {
        console.error("[Toss Auth] User creation failed:", createError);
        return corsJson({ error: "User creation failed" }, { status: 500 });
      }

      userId = newUser.user.id;

      // Create profile with toss_user_id
      const catNames = ["냥탐험가", "냥모험가", "냥용사", "냥전사", "냥마법사", "냥도적", "냥힐러"];
      const nickname = catNames[Math.floor(Math.random() * catNames.length)] + Math.floor(Math.random() * 1000);
      await supabase.from("profiles").upsert({
        id: userId,
        toss_user_id: tossUserId,
        nickname,
        cat_type: "tabby",
        cat_exp: 0,
      });
    }

    // Generate a session token for the user
    const { data: session, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: tossEmail,
      });

    if (sessionError) {
      console.error("[Toss Auth] Session generation failed:", sessionError);
      return corsJson({ error: "Session generation failed" }, { status: 500 });
    }

    return corsJson({
      userId,
      token: session.properties?.hashed_token,
      redirectUrl: session.properties?.action_link,
    });
  } catch (error) {
    console.error("[Toss Auth] Unexpected error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 });
  }
}
