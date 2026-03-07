import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/portone";
import { PLANS } from "@/lib/premium";
import * as PortOne from "@portone/server-sdk";

export async function POST(request: Request) {
  const body = await request.text();

  // 1. Verify webhook signature (Standard Webhooks via Portone SDK)
  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] PORTONE_WEBHOOK_SECRET not set — rejecting request");
    return Response.json({ error: "Webhook verification disabled" }, { status: 503 });
  }
  try {
    await PortOne.Webhook.verify(
      webhookSecret,
      body,
      Object.fromEntries(request.headers),
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

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
    // 2. Verify with Portone API
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

    // Amount verification
    if (verified.amount?.total !== planConfig.price) {
      console.error(
        `[webhook] Amount mismatch: expected ${planConfig.price}, got ${verified.amount?.total}`
      );
      return Response.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 3. Record payment only (subscription creation is handled by /api/payment/verify)
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
    if (payErr) console.error("[webhook] Insert payment error:", payErr);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
