import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/portone";
import { PLANS } from "@/lib/premium";

export async function POST(request: Request) {
  const body = await request.text();

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = payload;

  // Only process paid events
  if (type !== "Transaction.Paid") {
    return Response.json({ ok: true });
  }

  const paymentId = data?.paymentId;
  if (!paymentId) {
    return Response.json({ error: "Missing paymentId" }, { status: 400 });
  }

  try {
    // Verify with Portone API
    const verified = await verifyPayment(paymentId);
    if (verified.status !== "PAID") {
      return Response.json(
        { error: "Payment not confirmed" },
        { status: 400 }
      );
    }

    const customData = JSON.parse(verified.customData || "{}");
    const userId = customData.userId;
    const plan = customData.plan as keyof typeof PLANS;
    const giftTo: string | null = customData.giftTo || null;

    if (!userId || !PLANS[plan]) {
      return Response.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    const planConfig = PLANS[plan];
    const subscriptionUserId = giftTo || userId;

    // Amount verification
    if (verified.amount?.total !== planConfig.price) {
      console.error(
        `[payment] Amount mismatch: expected ${planConfig.price}, got ${verified.amount?.total}`
      );
      return Response.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays);

    // Insert payment record (idempotent via UNIQUE constraint)
    const { error: payErr } = await supabase.from("payments").upsert(
      {
        user_id: userId,
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
    if (payErr) console.error("[payment] Insert payment error:", payErr);

    // Expire existing active subscriptions for the recipient
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", subscriptionUserId)
      .eq("status", "active");

    // Create new subscription
    await supabase.from("subscriptions").insert({
      user_id: subscriptionUserId,
      plan,
      status: "active",
      portone_payment_id: paymentId,
      amount: verified.amount.total,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      gifted_by: giftTo ? userId : null,
    });

    if (giftTo) {
      // Notify gift recipient
      const { data: sender } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", userId)
        .single();
      const senderName = sender?.nickname || "누군가";
      await supabase.from("notifications").insert({
        user_id: giftTo,
        type: "gift_received",
        message: `${senderName}님이 프리미엄 구독을 선물했다냥! 👑`,
      });
    } else {
      // Notify user (self purchase)
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "subscription_started",
        message: `프리미엄 구독이 시작되었다냥! ${planConfig.label} 활성화 완료!`,
      });
      // Reward referrer if this user was referred
      await supabase.rpc("reward_referrer_premium", { p_referred_id: userId });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[payment] Webhook error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
