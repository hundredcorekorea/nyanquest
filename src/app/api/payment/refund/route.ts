import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPayment } from "@/lib/portone";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

const REFUND_WINDOW_DAYS = 7;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find the user's most recent paid payment
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .is("gift_to", null) // Only self-purchases can be refunded
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!payment) {
    return Response.json(
      { error: apiMsg("noRefundablePayment", request) },
      { status: 404 }
    );
  }

  // Check refund window (7 days)
  const paymentDate = new Date(payment.created_at);
  const now = new Date();
  const daysSince = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince > REFUND_WINDOW_DAYS) {
    return Response.json(
      { error: apiMsg("refundWindowExpired", request) },
      { status: 400 }
    );
  }

  // Cancel payment via Portone
  try {
    await cancelPayment(payment.portone_payment_id, "사용자 환불 요청");
  } catch (err) {
    console.error("[refund] Portone cancel error:", err);
    return Response.json(
      { error: apiMsg("refundFailed", request) },
      { status: 502 }
    );
  }

  // Update payment status
  await admin
    .from("payments")
    .update({ status: "refunded" })
    .eq("id", payment.id);

  // Expire the associated subscription immediately
  await admin
    .from("subscriptions")
    .update({
      status: "expired",
      updated_at: now.toISOString(),
    })
    .eq("portone_payment_id", payment.portone_payment_id)
    .eq("status", "active");

  return Response.json({ ok: true });
}
