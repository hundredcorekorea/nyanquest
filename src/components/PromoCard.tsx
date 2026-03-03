"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { AdEntry, AdPlacement } from "@/types/database";

interface Props {
  placement: AdPlacement;
  className?: string;
}

export default function PromoCard({ placement, className = "" }: Props) {
  const [ad, setAd] = useState<AdEntry | null>(null);
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Hide ads when ?noads=1 is in the URL (for recording/screenshots)
  const noAds = searchParams.get("noads") === "1";

  useEffect(() => {
    if (noAds) return;
    const supabase = createClient();
    supabase
      .from("ads_manager")
      .select("*")
      .eq("placement", placement)
      .eq("active", true)
      .order("priority", { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) return;

        // For non-Korean locales, filter to ads that have English translations
        const candidates = locale !== "ko"
          ? data.filter((d) => d.title_en)
          : data;
        if (candidates.length === 0) return;

        // Priority-weighted random selection
        const total = candidates.reduce((sum, d) => sum + (d.priority || 1), 0);
        let rand = Math.random() * total;
        for (const d of candidates) {
          rand -= d.priority || 1;
          if (rand <= 0) {
            setAd(d as AdEntry);
            return;
          }
        }
        setAd(candidates[0] as AdEntry);
      });
  }, [placement, locale]);

  if (!ad) return null;

  const title = (locale !== "ko" && ad.title_en) ? ad.title_en : ad.title;
  const description = (locale !== "ko" && ad.description_en) ? ad.description_en : ad.description;

  // Banner variant (with image)
  if (ad.banner_url) {
    return (
      <a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`block max-w-md mx-auto rounded-2xl overflow-hidden border border-amber-100 hover:border-amber-300 transition-all duration-300 shadow-sm hover:shadow-md group ${className}`}
      >
        <div className="relative overflow-hidden">
          <img
            src={ad.banner_url}
            alt={ad.app_name}
            className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] text-white/90 font-semibold">
                {ad.app_name}
              </span>
              <span className="text-[8px] text-white/40 bg-white/10 px-1 py-px rounded-full font-medium uppercase tracking-wider">
                ad
              </span>
            </div>
            <p className="text-xs font-bold text-white leading-tight">
              {title}
            </p>
          </div>
        </div>
      </a>
    );
  }

  // Compact card variant (text only)
  return (
    <a
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`block max-w-md mx-auto rounded-2xl p-4 border border-amber-100 hover:border-amber-300 bg-amber-50/50 transition-all duration-300 shadow-sm hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        {ad.img_url && (
          <img
            src={ad.img_url}
            alt={ad.app_name}
            className="w-10 h-10 rounded-xl"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-700 font-semibold">
              {ad.app_name}
            </span>
            <span className="text-[9px] text-amber-500/60 bg-amber-100 px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
              ad
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {title}
          </p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </a>
  );
}
