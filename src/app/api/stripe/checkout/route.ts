import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckout } from "@/lib/lemonsqueezy";
import { PLANS, type PlanType, getVariantId } from "@/lib/premium";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

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

  const { plan, giftTo } = (await request.json()) as {
    plan: PlanType;
    giftTo?: string;
  };
  if (!PLANS[plan]) {
    return Response.json(
      { error: apiMsg("invalidPlan", request) },
      { status: 400 }
    );
  }

  if (giftTo) {
    const admin = createAdminClient();
    const { data: recipient } = await admin
      .from("profiles")
      .select("id")
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

  const planConfig = PLANS[plan];
  const origin =
    request.headers.get("origin") || "https://nyanquest.com";

  try {
    const variantId = getVariantId(plan);
    const checkoutUrl = await createCheckout({
      variantId,
      redirectUrl: `${origin}/en/premium/complete`,
      customData: {
        userId: user.id,
        plan,
        ...(giftTo ? { giftTo } : {}),
      },
    });

    return Response.json({ url: checkoutUrl });
  } catch (err) {
    console.error("[ls/checkout] Error:", err);
    return Response.json(
      { error: apiMsg("paymentInitFailed", request) },
      { status: 502 }
    );
  }
}
