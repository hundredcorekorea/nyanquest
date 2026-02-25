import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrder } from "@/lib/lemonsqueezy";
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
    return Response.json(
      { error: apiMsg("loginRequired", request) },
      { status: 401 }
    );
  }

  const { orderId } = await request.json();
  if (!orderId) {
    return Response.json(
      { error: apiMsg("invalidRequest", request) },
      { status: 400 }
    );
  }

  // Retrieve Lemon Squeezy order
  let order;
  try {
    order = await getOrder(orderId);
  } catch (err) {
    console.error("[ls/verify] Order retrieve error:", err);
    return Response.json(
      { error: apiMsg("paymentVerificationFailed", request) },
      { status: 502 }
    );
  }

  const attrs = order.attributes;
  if (attrs.status !== "paid") {
    return Response.json(
      { error: apiMsg("paymentNotConfirmed", request) },
      { status: 400 }
    );
  }

  // Extract custom data passed during checkout
  const customData = attrs.first_order_item?.custom_data || attrs.meta?.custom_data || {};
  const plan = customData.plan as keyof typeof PLANS;
  const giftTo: string | null = customData.giftTo || null;

  // Validate userId matches authenticated user
  if (customData.userId !== user.id) {
    console.error(
      `[ls/verify] userId mismatch: custom=${customData.userId}, auth=${user.id}`
    );
    return Response.json(
      { error: apiMsg("paymentVerificationFailed", request) },
      { status: 403 }
    );
  }

  const planConfig = PLANS[plan];
  if (!planConfig) {
    return Response.json(
      { error: apiMsg("invalidPlan", request) },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const lsPaymentId = `ls_${orderId}`;
  const subscriptionUserId = giftTo || user.id;

  // Record payment (idempotent)
  await admin.from("payments").upsert(
    {
      user_id: user.id,
      portone_payment_id: lsPaymentId,
      portone_tx_id: String(attrs.identifier || orderId),
      method: "lemonsqueezy",
      amount: attrs.total,
      status: "paid",
      plan,
      gift_to: giftTo,
      raw_data: { ls_order_id: orderId, status: attrs.status },
    },
    { onConflict: "portone_payment_id" }
  );

  // Check if subscription already exists (prevent duplicates)
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("portone_payment_id", lsPaymentId)
    .single();

  if (existingSub) {
    return Response.json({ ok: true, alreadyProcessed: true });
  }

  // Create subscription
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays);

  // Expire existing active subscriptions
  await admin
    .from("subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", subscriptionUserId)
    .eq("status", "active");

  await admin.from("subscriptions").insert({
    user_id: subscriptionUserId,
    plan,
    status: "active",
    portone_payment_id: lsPaymentId,
    amount: attrs.total,
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
    const senderName = sender?.nickname || "Someone";
    await admin.from("notifications").insert({
      user_id: giftTo,
      type: "gift_received",
      message: `${senderName} gifted you Premium, nya! 👑`,
    });
    sendPushToUser(giftTo, {
      title: "nyanQuest 👑",
      body: `${senderName} gifted you Premium, nya!`,
    });
  }

  // Reward referrer (self-purchase only)
  if (!giftTo) {
    await admin.rpc("reward_referrer_premium", { p_referred_id: user.id });
  }

  return Response.json({ ok: true, giftTo });
}
