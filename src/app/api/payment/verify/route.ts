import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/portone";
import { PLANS } from "@/lib/premium";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요하다냥!" }, { status: 401 });
  }

  const { paymentId, plan } = await request.json();

  const planConfig = PLANS[plan as keyof typeof PLANS];
  if (!planConfig) {
    return Response.json({ error: "잘못된 플랜이다냥" }, { status: 400 });
  }

  // Verify with Portone
  let verified;
  try {
    verified = await verifyPayment(paymentId);
  } catch (err) {
    console.error("[payment/verify] Portone error:", err);
    return Response.json(
      { error: "결제 확인에 실패했다냥" },
      { status: 502 }
    );
  }

  if (verified.status !== "PAID") {
    return Response.json(
      { error: "결제가 확인되지 않았다냥" },
      { status: 400 }
    );
  }

  if (verified.amount?.total !== planConfig.price) {
    return Response.json(
      { error: "금액이 일치하지 않다냥" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check if already processed by webhook (idempotent)
  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("portone_payment_id", paymentId)
    .single();

  if (existingPayment) {
    return Response.json({ ok: true, alreadyProcessed: true });
  }

  // Process payment
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays);

  await admin.from("payments").upsert(
    {
      user_id: user.id,
      portone_payment_id: paymentId,
      portone_tx_id: verified.txId ?? null,
      method: verified.method?.type || "unknown",
      amount: verified.amount.total,
      status: "paid",
      plan,
      raw_data: verified,
    },
    { onConflict: "portone_payment_id" }
  );

  // Expire existing subscriptions
  await admin
    .from("subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Create new subscription
  await admin.from("subscriptions").insert({
    user_id: user.id,
    plan,
    status: "active",
    portone_payment_id: paymentId,
    amount: verified.amount.total,
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  return Response.json({ ok: true });
}
