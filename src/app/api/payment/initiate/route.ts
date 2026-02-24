import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanType } from "@/lib/premium";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const { plan, giftTo } = (await request.json()) as { plan: PlanType; giftTo?: string };
  if (!PLANS[plan]) {
    return Response.json({ error: apiMsg("invalidPlan", request) }, { status: 400 });
  }

  if (giftTo) {
    // Gift mode: check recipient exists and is not already premium
    const admin = createAdminClient();
    const { data: recipient } = await admin
      .from("profiles")
      .select("id, nickname")
      .eq("id", giftTo)
      .single();

    if (!recipient) {
      return Response.json(
        { error: apiMsg("recipientNotFound", request) },
        { status: 404 }
      );
    }

    const { data: recipientIsPremium } = await admin.rpc("is_premium", {
      p_user_id: giftTo,
    });
    if (recipientIsPremium) {
      return Response.json(
        { error: apiMsg("recipientAlreadyPremium", request) },
        { status: 400 }
      );
    }
  } else {
    // Self mode: check if user already has active subscription
    const { data: isPremium } = await supabase.rpc("is_premium", {
      p_user_id: user.id,
    });
    if (isPremium) {
      return Response.json(
        { error: apiMsg("alreadyPremium", request) },
        { status: 400 }
      );
    }
  }

  const paymentId = `nq_${plan}_${randomUUID().replace(/-/g, "")}`;
  const planConfig = PLANS[plan];

  return Response.json({
    paymentId,
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID?.trim(),
    channelKey: process.env.PORTONE_CHANNEL_KEY?.trim(),
    orderName: giftTo
      ? `nyanQuest ${planConfig.label} (Gift)`
      : `nyanQuest ${planConfig.label}`,
    totalAmount: planConfig.price,
    currency: "KRW",
    plan,
    giftTo: giftTo || null,
    customData: JSON.stringify({ userId: user.id, plan, giftTo: giftTo || null }),
  });
}
