"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useToast } from "@/components/Toast";
import { usePremium } from "@/hooks/usePremium";
import { PLANS, PREMIUM_CONFIG, type PlanType } from "@/lib/premium";
import { useTranslations } from "next-intl";

export default function PremiumPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isPremium, subscription, loading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [processing, setProcessing] = useState(false);
  const t = useTranslations("Premium");
  const tCommon = useTranslations("Common");

  async function handleSubscribe() {
    setProcessing(true);
    try {
      // 1. Initiate payment
      const initRes = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) {
        toast(initData.error || t("paymentInitFailed"), "error");
        return;
      }

      // 2. Load Portone SDK and request payment
      const PortOne = await import("@portone/browser-sdk/v2");
      const paymentResponse = await PortOne.requestPayment({
        storeId: initData.storeId,
        channelKey: initData.channelKey,
        paymentId: initData.paymentId,
        orderName: initData.orderName,
        totalAmount: initData.totalAmount,
        currency: initData.currency,
        payMethod: "CARD",
        customData: initData.customData,
        redirectUrl: `${window.location.origin}/premium/complete`,
      });

      if (!paymentResponse || paymentResponse.code) {
        toast(
          paymentResponse?.message || t("paymentCancelled"),
          "error"
        );
        return;
      }

      // 3. Verify payment
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: initData.paymentId,
          plan: selectedPlan,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        toast(verifyData.error || t("paymentVerifyFailed"), "error");
        return;
      }

      toast(t("subscriptionStarted"), "success");
      router.refresh();
    } catch (err) {
      console.error("[premium] Payment error:", err);
      toast(t("paymentError"), "error");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-4xl animate-bounce">🐱</div>
        <p className="text-sm text-gray-400 mt-2">{tCommon("loading")}</p>
      </div>
    );
  }

  // Already premium — show status
  if (isPremium && subscription) {
    const expiresAt = new Date(subscription.expires_at);
    const isCancelled = !!subscription.cancelled_at;

    return (
      <div className="pb-24 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">👑</div>
          <h1 className="text-xl font-bold text-gray-900">{t("activeTitle")}</h1>
          <p className="text-sm text-gray-500">
            {t("activeSubtitle")}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t("plan")}</span>
            <span className="text-sm font-bold text-purple-700">
              {subscription.plan === "yearly" ? t("yearlyPlan") : t("monthlyPlan")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t("expiryDate")}</span>
            <span className="text-sm font-bold text-gray-900">
              {expiresAt.toLocaleDateString("ko-KR")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t("status")}</span>
            <span
              className={`text-sm font-bold ${
                isCancelled ? "text-orange-600" : "text-green-600"
              }`}
            >
              {isCancelled ? t("statusCancelPending") : t("statusActive")}
            </span>
          </div>

          {!isCancelled && (
            <CancelButton />
          )}
        </div>

        <Link
          href="/solo"
          className="block text-center py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
        >
          {t("goToTraining")}
        </Link>
      </div>
    );
  }

  // Show subscription plans
  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl">👑</div>
        <h1 className="text-xl font-bold text-gray-900">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-500">
          {t("subtitle")}
        </p>
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-sm">{t("benefits")}</h2>
        <ul className="space-y-3">
          {[
            { icon: "🎯", text: t("benefitUnlimited") },
            { icon: "🤖", text: t("benefitAiModel") },
            { icon: "📝", text: t("benefitLongResponse") },
            { icon: "🔄", text: t("benefitExtendedTurns") },
            { icon: "⭐", text: t("benefitExpBonus") },
            { icon: "🐉", text: t("benefitPremiumScenario") },
          ].map(({ icon, text }) => (
            <li key={icon} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-lg">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Plan selection */}
      <div className="space-y-3">
        {(Object.entries(PLANS) as [PlanType, typeof PLANS[PlanType]][]).map(
          ([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                selectedPlan === key
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {plan.label}
                  </p>
                  {"discount" in plan && (
                    <p className="text-xs text-purple-600 font-medium mt-0.5">
                      {plan.discount}
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {plan.price.toLocaleString()}{t("won")}
                  <span className="text-xs text-gray-400 font-normal">
                    /{plan.period}
                  </span>
                </p>
              </div>
            </button>
          )
        )}
      </div>

      {/* Subscribe button */}
      <button
        onClick={handleSubscribe}
        disabled={processing}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-base hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
      >
        {processing ? t("subscribing") : t("subscribe")}
      </button>

      <p className="text-xs text-center text-gray-400">
        {t("autoRenewalNote")}
      </p>
    </div>
  );
}

function CancelButton() {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();
  const t = useTranslations("Premium");

  async function handleCancel() {
    if (!confirm(t("cancelConfirm")))
      return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || t("cancelFailed"), "error");
        return;
      }
      toast(t("cancelSuccess"), "success");
      router.refresh();
    } catch {
      toast(t("cancelFailed"), "error");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={cancelling}
      className="w-full py-2.5 border border-red-200 text-red-500 text-sm rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {cancelling ? t("cancelling") : t("cancelSubscription")}
    </button>
  );
}
