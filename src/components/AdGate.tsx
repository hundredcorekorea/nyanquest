"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Props {
  onComplete: () => void;
  onCancel: () => void;
  open: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdGate({ onComplete, onCancel, open }: Props) {
  const t = useTranslations("AdGate");
  const [countdown, setCountdown] = useState(5);
  const [adLoaded, setAdLoaded] = useState(false);
  const adRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);

  useEffect(() => {
    if (!open) {
      setCountdown(5);
      setAdLoaded(false);
      adPushed.current = false;
      return;
    }

    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && !adPushed.current) {
          window.adsbygoogle.push({});
          adPushed.current = true;
          setAdLoaded(true);
        } else {
          // Ad SDK not available - skip gate entirely
          onComplete();
        }
      } catch {
        // Ad failed to load - skip gate
        onComplete();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, onComplete]);

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const handleProceed = useCallback(() => {
    if (countdown <= 0) {
      onComplete();
    }
  }, [countdown, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐱</span>
              <span className="text-sm font-bold text-amber-700">
                {t("preparing")}
              </span>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg">
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="bg-gray-50 rounded-xl min-h-[250px] flex items-center justify-center mb-4 overflow-hidden">
            {adLoaded ? (
              <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: "block", width: "100%", height: "250px" }}
                data-ad-client="ca-pub-1075071967728463"
                data-ad-slot="auto"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            ) : (
              <div className="text-center text-gray-400 text-sm px-4">
                <p className="text-4xl mb-3">🐱</p>
                <p className="font-medium text-gray-500">{t("adPlaceholder")}</p>
                <p className="text-xs mt-1 text-gray-300">{t("adPlaceholderSub")}</p>
              </div>
            )}
          </div>

          {countdown > 0 ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                  {countdown}
                </div>
                <span className="text-sm text-gray-600">
                  {t("countdown")}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleProceed}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
              {t("startAdventure")}
            </button>
          )}
        </div>

        <div className="px-5 pb-4">
          <Link
            href="/premium"
            className="block text-center bg-purple-50 rounded-xl py-3 px-4 hover:bg-purple-100 transition-colors"
          >
            <span className="text-xs text-purple-600">
              {t("premiumUpsell")}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
