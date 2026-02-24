import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/portone";
import { PLANS } from "@/lib/premium";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const { paymentId, plan } = await request.json();

  const planConfig = PLANS[plan as keyof typeof PLANS];
  if (!planConfig) {
    return Response.json({ error: apiMsg("invalidPlan", request) }, { status: 400 });
  }

  // Verify with Portone
  let verified;
  try {
    verified = await verifyPayment(paymentId);
  } catch (err) {
    console.error("[payment/verify] Portone error:", err);
    return Response.json(
      { error: apiMsg("paymentVerificationFailed", request) },
      { status: 502 }
    );
  }

  if (verified.status !== "PAID") {
    return Response.json(
      { error: apiMsg("paymentNotConfirmed", request) },
      { status: 400 }
    );
  }

  if (verified.amount?.total !== planConfig.price) {
    return Response.json(
      { error: apiMsg("amountMismatch", request) },
      { status: 400 }
    );
  }

  // Validate customData.userId matches authenticated user
  const customData = JSON.parse(verified.customData || "{}");
  const giftTo: string | null = customData.giftTo || null;

  if (customData.userId !== user.id) {
    console.error(
      `[payment/verify] userId mismatch: customData=${customData.userId}, auth=${user.id}`
    );
    return Response.json(
      { error: apiMsg("paymentVerificationFailed", request) },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const subscriptionUserId = giftTo || user.id;

  // Record payment (idempotent — webhook may have already inserted)
  await admin.from("payments").upsert(
    {
      user_id: user.id,
      portone_payment_id: paymentId,
      portone_tx_id: verified.txId ?? null,
      method: verified.method?.type || "unknown",
      amount: verified.amount.total,
      status: "paid",
      plan,
      gift_to: giftTo,
      raw_data: verified,
    },
    { onConflict: "portone_payment_id" }
  );

  // Check if subscription already exists for this payment (prevent duplicates)
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("portone_payment_id", paymentId)
    .single();

  if (existingSub) {
    return Response.json({ ok: true, alreadyProcessed: true });
  }

  // Create subscription
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays);

  // Expire existing active subscriptions for the recipient
  await admin
    .from("subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", subscriptionUserId)
    .eq("status", "active");

  await admin.from("subscriptions").insert({
    user_id: subscriptionUserId,
    plan,
    status: "active",
    portone_payment_id: paymentId,
    amount: verified.amount.total,
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    gifted_by: giftTo ? user.id : null,
  });

  // Notify gift recipient
  if (giftTo) {
    const { data: sender } = await admin
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();
    const senderName = sender?.nickname || "누군가";
    await admin.from("notifications").insert({
      user_id: giftTo,
      type: "gift_received",
      message: `${senderName}님이 프리미엄 구독을 선물했다냥! 👑`,
    });
    sendPushToUser(giftTo, { title: "nyanQuest 👑", body: `${senderName}님이 프리미엄을 선물했다냥!` });
  }

  // Reward referrer if this user was referred (only for self-purchase)
  if (!giftTo) {
    await admin.rpc("reward_referrer_premium", { p_referred_id: user.id });
  }

  return Response.json({ ok: true, giftTo });
}
