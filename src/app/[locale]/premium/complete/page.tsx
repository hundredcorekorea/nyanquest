"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

function CompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("PremiumComplete");
  const tCommon = useTranslations("Common");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const plan = searchParams.get("plan");

    if (!paymentId || !plan) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, plan }),
        });

        if (res.ok) {
          setStatus("success");
          toast(t("subscriptionStarted"), "success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [searchParams, toast]);

  if (status === "verifying") {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-4xl animate-bounce">🐱</div>
        <p className="text-sm text-gray-500 mt-4">{t("verifying")}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-20 pb-24 space-y-4">
        <div className="text-5xl">😿</div>
        <h2 className="text-lg font-bold text-gray-900">
          {t("errorTitle")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("errorDesc")}
        </p>
        <button
          onClick={() => router.push("/premium")}
          className="px-6 py-2.5 bg-amber-500 text-white text-sm rounded-xl font-medium hover:bg-amber-600 transition-colors"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-20 pb-24 space-y-4">
      <div className="text-5xl">👑</div>
      <h2 className="text-lg font-bold text-gray-900">
        {t("successTitle")}
      </h2>
      <p className="text-sm text-gray-500">
        {t("successDesc")}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push("/solo")}
          className="px-6 py-2.5 bg-amber-500 text-white text-sm rounded-xl font-medium hover:bg-amber-600 transition-colors"
        >
          {t("goToTraining")}
        </button>
        <button
          onClick={() => router.push("/my")}
          className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          {t("myProfile")}
        </button>
      </div>
    </div>
  );
}

export default function PremiumCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 pb-24">
          <div className="text-4xl animate-bounce">🐱</div>
          <p className="text-sm text-gray-500 mt-4">Loading...</p>
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}
