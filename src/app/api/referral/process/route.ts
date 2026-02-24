import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { referralCode } = await request.json();
  if (!referralCode || typeof referralCode !== "string") {
    return Response.json({ error: "Missing referral code" }, { status: 400 });
  }

  const code = referralCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,8}$/.test(code)) {
    return Response.json({ error: "Invalid code format" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("process_referral", {
    p_referred_id: user.id,
    p_referral_code: code,
  });

  if (error) {
    console.error("[referral] RPC error:", error);
    return Response.json({ error: "Failed to process referral" }, { status: 500 });
  }

  return Response.json(data);
}
