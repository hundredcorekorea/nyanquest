import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/premium";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[ls/webhook] LEMONSQUEEZY_WEBHOOK_SECRET not set");
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Verify HMAC-SHA256 signature
  let valid: boolean;
  try {
    valid = verifyWebhookSignature(body, signature, webhookSecret);
  } catch (err) {
    console.error("[ls/webhook] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!valid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;

  // Only process completed orders
  if (eventName !== "order_created") {
    return Response.json({ ok: true });
  }

  const order = payload.data;
  const attrs = order?.attributes;
  if (!attrs || attrs.status !== "paid") {
    return Response.json({ ok: true });
  }

  const customData = payload.meta?.custom_data || {};
  const userId = customData.userId;
  const plan = customData.plan as keyof typeof PLANS;
  const giftTo: string | null = customData.giftTo || null;

  if (!userId || !PLANS[plan]) {
    return Response.json({ error: "Invalid metadata" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const lsPaymentId = `ls_${order.id}`;

  // Record payment only (subscription creation handled by verify endpoint)
  const { error: payErr } = await supabase.from("payments").upsert(
    {
      user_id: userId,
      portone_payment_id: lsPaymentId,
      portone_tx_id: String(attrs.identifier || order.id),
      method: "lemonsqueezy",
      amount: attrs.total,
      status: "paid",
      plan,
      gift_to: giftTo,
      raw_data: { ls_order_id: order.id, event: eventName },
    },
    { onConflict: "portone_payment_id" }
  );
  if (payErr) console.error("[ls/webhook] Insert payment error:", payErr);

  return Response.json({ ok: true });
}
