"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdEntry } from "@/types/database";

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
  const [promo, setPromo] = useState<AdEntry | null>(null);
  const adRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);

  // Fetch a random promo from ads_manager when modal opens
  useEffect(() => {
    if (!open) {
      setCountdown(5);
      setAdLoaded(false);
      setPromo(null);
      adPushed.current = false;
      return;
    }

    // Try AdSense first
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && !adPushed.current) {
          window.adsbygoogle.push({});
          adPushed.current = true;
          setAdLoaded(true);
          return;
        }
      } catch {
        // Ad failed
      }

      // Fallback: fetch self-promo from Supabase
      setAdLoaded(false);
      const supabase = createClient();
      supabase
        .from("ads_manager")
        .select("*")
        .eq("active", true)
        .order("priority", { ascending: false })
        .then(({ data }) => {
          if (!data || data.length === 0) return;
          const total = data.reduce((sum, d) => sum + (d.priority || 1), 0);
          let rand = Math.random() * total;
          for (const d of data) {
            rand -= d.priority || 1;
            if (rand <= 0) {
              setPromo(d as AdEntry);
              return;
            }
          }
          setPromo(data[0] as AdEntry);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [open]);

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
    onComplete();
  }, [onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐱</span>
              <span className="text-sm font-bold text-amber-700">
                {t("title")}
              </span>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg">
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="bg-gray-50 rounded-xl min-h-62.5 flex items-center justify-center mb-4 overflow-hidden">
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
            ) : promo ? (
              promo.banner_url ? (
                <a
                  href={promo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full overflow-hidden rounded-xl group"
                >
                  <div className="relative">
                    <img
                      src={promo.banner_url}
                      alt={promo.app_name}
                      className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span className="text-[8px] text-white/40 bg-white/10 px-1 py-px rounded-full font-medium uppercase tracking-wider">ad</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-[11px] text-white/90 font-semibold">{promo.app_name}</span>
                      <p className="text-xs font-bold text-white leading-tight">{promo.title}</p>
                    </div>
                  </div>
                </a>
              ) : (
                <a
                  href={promo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 px-6 py-5 w-full h-full hover:bg-gray-100/50 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-1.5 self-end">
                    <span className="text-[10px] text-gray-300 uppercase tracking-wider">ad</span>
                  </div>
                  {promo.img_url ? (
                    <img src={promo.img_url} alt={promo.app_name} className="w-16 h-16 rounded-2xl" />
                  ) : (
                    <span className="text-5xl">📱</span>
                  )}
                  <div className="text-center">
                    <p className="font-bold text-gray-800 text-base">{promo.app_name}</p>
                    <p className="text-sm text-gray-500 mt-1">{promo.title}</p>
                  </div>
                  <div className="mt-2 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    {t("selfPromoInstall")}
                  </div>
                </a>
              )
            ) : (
              <div className="text-center text-gray-400 text-sm px-4">
                <p className="text-4xl mb-3">🐱</p>
                <p className="font-medium text-gray-500">{t("adPlaceholder")}</p>
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
              className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-colors"
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
