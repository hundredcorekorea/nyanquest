"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useToast } from "@/components/Toast";
import { usePremium } from "@/hooks/usePremium";
import { createClient, getUserFromCookies } from "@/lib/supabase/client";
import { PLANS, PREMIUM_CONFIG, type PlanType } from "@/lib/premium";
import { useTranslations, useLocale } from "next-intl";
import { isTossApp, tossCheckoutPayment } from "@/lib/toss";

interface SearchUser {
  id: string;
  nickname: string;
  avatar_url: string | null;
  cat_type: string;
}

export default function PremiumPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isPremium, isTrial, trialDaysLeft, canStartTrial, subscription, loading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<"self" | "gift">("self");
  const t = useTranslations("Premium");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const dateLocale = locale === "ko" ? "ko-KR" : "en-US";

  // Gift search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<SearchUser | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/user/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  async function handleSubscribe() {
    if (mode === "gift" && !selectedRecipient) return;

    setProcessing(true);
    try {
      // Toss mini-app payment flow
      if (isTossApp()) {
        const initRes = await fetch("/api/payment/toss-initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: selectedPlan,
            ...(mode === "gift" && selectedRecipient ? { giftTo: selectedRecipient.id } : {}),
          }),
        });
        const initData = await initRes.json();
        if (!initRes.ok) {
          toast(initData.error || t("paymentInitFailed"), "error");
          return;
        }

        const result = await tossCheckoutPayment(initData.payToken);
        if (!result.success) {
          toast(result.reason || t("paymentCancelled"), "error");
          return;
        }

        // Verify payment server-side
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: initData.orderId,
            plan: selectedPlan,
            provider: "toss",
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          toast(verifyData.error || t("paymentVerifyFailed"), "error");
          return;
        }

        if (mode === "gift" && selectedRecipient) {
          toast(t("giftSuccess", { name: selectedRecipient.nickname }), "success");
          setSelectedRecipient(null);
          setSearchQuery("");
        } else {
          toast(t("subscriptionStarted"), "success");
        }
        router.refresh();
        return;
      }

      if (locale !== "ko") {
        // Stripe flow for non-Korean locales
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: selectedPlan,
            ...(mode === "gift" && selectedRecipient ? { giftTo: selectedRecipient.id } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast(data.error || t("paymentInitFailed"), "error");
          return;
        }
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }

      // Portone flow for Korean locale
      // 1. Initiate payment
      const initRes = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          ...(mode === "gift" && selectedRecipient ? { giftTo: selectedRecipient.id } : {}),
        }),
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
        payMethod: "EASY_PAY",
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

      if (mode === "gift" && selectedRecipient) {
        toast(t("giftSuccess", { name: selectedRecipient.nickname }), "success");
        setSelectedRecipient(null);
        setSearchQuery("");
      } else {
        toast(t("subscriptionStarted"), "success");
      }
      router.refresh();
    } catch (err) {
      console.error("[premium] Payment error:", err);
      toast(t("paymentError"), "error");
    } finally {
      setProcessing(false);
    }
  }

  async function handleStartTrial() {
    setProcessing(true);
    try {
      const user = getUserFromCookies();
      if (!user) {
        toast(t("loginRequired"), "error");
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase.rpc("start_free_trial", {
        p_user_id: user.id,
      });
      if (error || !data?.success) {
        toast(t("trialAlreadyUsed"), "error");
        return;
      }
      toast(t("trialStarted"), "success");
      window.location.reload();
    } catch {
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
              {subscription.plan === "yearly" ? t("yearlyPlan") : subscription.plan === "trial" ? t("trialBadge") : t("monthlyPlan")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t("expiryDate")}</span>
            <span className="text-sm font-bold text-gray-900">
              {expiresAt.toLocaleDateString(dateLocale)}
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

          {subscription.plan !== "trial" && (
            <RefundButton startedAt={subscription.started_at} />
          )}
        </div>

        {/* Gift section — premium users can still gift */}
        <GiftSection
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searching={searching}
          searchUsers={searchUsers}
          selectedRecipient={selectedRecipient}
          setSelectedRecipient={setSelectedRecipient}
          handleSubscribe={handleSubscribe}
          processing={processing}
          t={t}
        />

        <Link
          href="/solo"
          className="block text-center py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
        >
          {t("goToTraining")}
        </Link>
      </div>
    );
  }

  // Trial active — show trial status + upsell
  if (isPremium && isTrial) {
    return (
      <div className="pb-24 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🎁</div>
          <h1 className="text-xl font-bold text-gray-900">{t("trialTitle")}</h1>
          <p className="text-sm text-gray-500">{t("trialSubtitle")}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t("status")}</span>
            <span className="text-sm font-bold text-purple-600">{t("trialActive")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t("trialRemaining")}</span>
            <span className="text-sm font-bold text-purple-700">
              {t("trialDaysRemaining", { days: trialDaysLeft })}
            </span>
          </div>
          <p className="text-xs text-center text-gray-400 pt-2">{t("trialExpireNote")}</p>
        </div>

        {/* Benefits currently enjoying */}
        <BenefitsList t={t} />

        {/* Plan selection */}
        <PlanSelector selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} t={t} />

        <button
          onClick={handleSubscribe}
          disabled={processing}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-base hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
        >
          {processing ? t("subscribing") : t("trialSubscribeNow")}
        </button>

        <p className="text-xs text-center text-gray-400">{t("autoRenewalNote")}</p>
      </div>
    );
  }

  // Show subscription plans (new user)
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

      {/* Mode toggle: Self / Gift */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setMode("self")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            mode === "self"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t("selfTab")}
        </button>
        <button
          onClick={() => setMode("gift")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            mode === "gift"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🎁 {t("giftTab")}
        </button>
      </div>

      {mode === "self" ? (
        <>
          {/* Benefits */}
          <BenefitsList t={t} />

          {/* Plan selection */}
          <PlanSelector selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} t={t} />

          {/* Free Trial CTA */}
          {canStartTrial && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 space-y-3">
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-amber-900">{t("freeTrialTitle")}</p>
                <p className="text-xs text-amber-700">{t("freeTrialDesc")}</p>
              </div>
              <button
                onClick={handleStartTrial}
                disabled={processing}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-orange-500 transition-colors disabled:opacity-50"
              >
                {processing ? t("subscribing") : t("startFreeTrial")}
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 text-gray-300 text-xs">
            <div className="flex-1 h-px bg-gray-200" />
            <span>{t("orSubscribe")}</span>
            <div className="flex-1 h-px bg-gray-200" />
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
        </>
      ) : (
        <GiftSection
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searching={searching}
          searchUsers={searchUsers}
          selectedRecipient={selectedRecipient}
          setSelectedRecipient={setSelectedRecipient}
          handleSubscribe={handleSubscribe}
          processing={processing}
          t={t}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────── */

function BenefitsList({ t }: { t: ReturnType<typeof useTranslations<"Premium">> }) {
  return (
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
  );
}

function PlanSelector({
  selectedPlan,
  setSelectedPlan,
  t,
}: {
  selectedPlan: PlanType;
  setSelectedPlan: (p: PlanType) => void;
  t: ReturnType<typeof useTranslations<"Premium">>;
}) {
  const locale = useLocale();
  const isKo = locale === "ko";

  return (
    <div className="space-y-3">
      {(Object.entries(PLANS) as [PlanType, (typeof PLANS)[PlanType]][]).map(
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
                  {isKo ? plan.label : plan.labelEn}
                </p>
                {"discount" in plan && (
                  <p className="text-xs text-purple-600 font-medium mt-0.5">
                    {isKo ? plan.discount : plan.discountEn}
                  </p>
                )}
              </div>
              <p className="text-lg font-bold text-gray-900">
                {isKo ? (
                  <>
                    {plan.price.toLocaleString()}{t("won")}
                    <span className="text-xs text-gray-400 font-normal">/{plan.period}</span>
                  </>
                ) : (
                  <>
                    ${(plan.priceUsd / 100).toFixed(2)}
                    <span className="text-xs text-gray-400 font-normal">/{plan.periodEn}</span>
                  </>
                )}
              </p>
            </div>
          </button>
        )
      )}
    </div>
  );
}

function GiftSection({
  selectedPlan,
  setSelectedPlan,
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  searchUsers,
  selectedRecipient,
  setSelectedRecipient,
  handleSubscribe,
  processing,
  t,
}: {
  selectedPlan: PlanType;
  setSelectedPlan: (p: PlanType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchUser[];
  searching: boolean;
  searchUsers: (q: string) => void;
  selectedRecipient: SearchUser | null;
  setSelectedRecipient: (u: SearchUser | null) => void;
  handleSubscribe: () => void;
  processing: boolean;
  t: ReturnType<typeof useTranslations<"Premium">>;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">{t("giftTitle")}</h2>
        <p className="text-sm text-gray-500">{t("giftSubtitle")}</p>
      </div>

      {/* User search */}
      {selectedRecipient ? (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-lg">
              🐱
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("giftSelectedUser")}</p>
              <p className="font-bold text-gray-900">{selectedRecipient.nickname}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedRecipient(null);
              setSearchQuery("");
            }}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            {t("giftChangeUser")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            placeholder={t("giftSearchPlaceholder")}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400"
          />
          {searching && (
            <p className="text-xs text-gray-400 text-center">{t("giftSearching")}</p>
          )}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 text-center">{t("giftNoResults")}</p>
          )}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedRecipient(u);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                    🐱
                  </div>
                  <span className="text-sm font-medium text-gray-900">{u.nickname}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan selection */}
      <PlanSelector selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} t={t} />

      {/* Gift pay button */}
      <button
        onClick={handleSubscribe}
        disabled={processing || !selectedRecipient}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-base hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
      >
        {processing
          ? t("subscribing")
          : selectedRecipient
            ? t("giftTo", { name: selectedRecipient.nickname })
            : t("giftSubscribe")}
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

function RefundButton({ startedAt }: { startedAt: string }) {
  const { toast } = useToast();
  const [refunding, setRefunding] = useState(false);
  const router = useRouter();
  const t = useTranslations("Premium");

  const daysSince = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) return null;

  const daysLeft = Math.ceil(7 - daysSince);

  async function handleRefund() {
    if (!confirm(t("refundConfirm")))
      return;
    setRefunding(true);
    try {
      const res = await fetch("/api/payment/refund", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || t("refundFailed"), "error");
        return;
      }
      toast(t("refundSuccess"), "success");
      router.refresh();
    } catch {
      toast(t("refundFailed"), "error");
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="pt-2 border-t border-gray-100">
      <button
        onClick={handleRefund}
        disabled={refunding}
        className="w-full py-2 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        {refunding ? t("refunding") : t("refundRequest", { days: daysLeft })}
      </button>
    </div>
  );
}
