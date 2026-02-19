import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanType } from "@/lib/premium";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요하다냥!" }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan: PlanType };
  if (!PLANS[plan]) {
    return Response.json({ error: "잘못된 구독 플랜이다냥" }, { status: 400 });
  }

  // Check if user already has active subscription
  const { data: isPremium } = await supabase.rpc("is_premium", {
    p_user_id: user.id,
  });
  if (isPremium) {
    return Response.json(
      { error: "이미 프리미엄 구독 중이다냥!" },
      { status: 400 }
    );
  }

  const paymentId = `nyanquest_${plan}_${randomUUID()}`;
  const planConfig = PLANS[plan];

  return Response.json({
    paymentId,
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
    channelKey: process.env.PORTONE_CHANNEL_KEY,
    orderName: `nyanQuest ${planConfig.label}`,
    totalAmount: planConfig.price,
    currency: "KRW",
    plan,
    customData: JSON.stringify({ userId: user.id, plan }),
  });
}
