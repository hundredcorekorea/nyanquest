import { createClient } from "@/lib/supabase/server";
export { OPTIONS } from "@/lib/api-cors";
import { corsJson } from "@/lib/api-cors";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanType } from "@/lib/premium";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

/**
 * POST /api/payment/toss-initiate
 *
 * Creates a TossPayments order for Toss mini-app environment.
 * Returns payToken for use with checkoutPayment() bridge API.
 *
 * TODO: Integrate with actual TossPayments v2 API when merchant key is issued.
 * For now, this creates the order record and returns a placeholder payToken.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return corsJson({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { plan, giftTo } = (await request.json()) as {
    plan: PlanType;
    giftTo?: string;
  };
  if (!PLANS[plan]) {
    return corsJson({ error: "잘못된 플랜입니다" }, { status: 400 });
  }

  if (giftTo) {
    const admin = createAdminClient();
    const { data: recipient } = await admin
      .from("profiles")
      .select("id")
      .eq("id", giftTo)
      .single();
    if (!recipient) {
      return corsJson({ error: "수신자를 찾을 수 없습니다" }, { status: 404 });
    }
  } else {
    const { data: isPremium } = await supabase.rpc("is_premium", {
      p_user_id: user.id,
    });
    if (isPremium) {
      return corsJson({ error: "이미 프리미엄 구독 중입니다" }, { status: 400 });
    }
  }

  const orderId = `nq_toss_${plan}_${randomUUID().replace(/-/g, "")}`;
  const planConfig = PLANS[plan];

  // TODO: Call TossPayments v2 API to create payment order
  // POST https://api.tosspayments.com/v2/payments
  // Headers: Authorization: Basic {base64(secretKey + ":")}
  // Body: { amount, orderId, orderName, ... }
  // Response includes payToken for bridge checkout
  //
  // For now, store the pending order in DB and return orderId.
  // The actual payToken will come from TossPayments API.

  const admin = createAdminClient();
  await admin.from("payment_orders").insert({
    id: orderId,
    user_id: user.id,
    plan,
    amount: planConfig.price,
    currency: "KRW",
    provider: "toss",
    status: "pending",
    gift_to: giftTo || null,
    metadata: { source: "toss-miniapp" },
  });

  // TODO: Replace with actual TossPayments API call
  // const tossRes = await fetch("https://api.tosspayments.com/v2/payments", { ... });
  // const { payToken } = await tossRes.json();

  return corsJson({
    orderId,
    orderName: giftTo
      ? `냥퀘스트 ${planConfig.label} (선물)`
      : `냥퀘스트 ${planConfig.label}`,
    amount: planConfig.price,
    // payToken: payToken, // TODO: from TossPayments API
    payToken: `__PLACEHOLDER_${orderId}__`, // Will be replaced with real token
  });
}
