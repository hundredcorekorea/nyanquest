"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GM_PERSONAS, type GmPersona } from "@/lib/solo-quest/personas";

interface Props {
  selectedId: string;
  isPremium: boolean;
  onSelect: (persona: GmPersona) => void;
  onClose: () => void;
}

export default function PersonaSelector({ selectedId, isPremium, onSelect, onClose }: Props) {
  const t = useTranslations("Persona");
  const locale = useLocale();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">{t("title")}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{t("subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Persona list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {GM_PERSONAS.map((persona) => {
            const isSelected = persona.id === selectedId;
            const isLocked = persona.isPremium && !isPremium;

            return (
              <button
                key={persona.id}
                onClick={() => {
                  if (isLocked) return;
                  onSelect(persona);
                }}
                onMouseEnter={() => setHoveredId(persona.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={isLocked}
                className={`w-full text-left rounded-xl p-3 transition-all border ${
                  isSelected
                    ? `bg-linear-to-r ${persona.cardGradient} border-white/20 ring-1 ring-white/10`
                    : isLocked
                    ? "bg-gray-800/50 border-white/5 opacity-60"
                    : "bg-gray-800/30 border-white/5 hover:bg-gray-800/60 hover:border-white/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Emoji avatar */}
                  <div className={`text-3xl shrink-0 ${isSelected ? "animate-bounce" : ""}`}>
                    {persona.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${isSelected ? persona.accentColor : "text-white"}`}>
                        {locale === "en" ? persona.nameEn : persona.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-white/10 text-white/70 rounded-full px-2 py-0.5">
                          {t("selected")}
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5">
                          👑 PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {locale === "en" ? persona.descEn : persona.desc}
                    </p>

                    {/* Preview line */}
                    {(hoveredId === persona.id || isSelected) && (
                      <div className="mt-2 bg-black/30 rounded-lg px-2.5 py-1.5 border border-white/5">
                        <p className={`text-xs italic ${persona.accentColor} opacity-80`}>
                          &ldquo;{locale === "en" ? persona.previewLineEn : persona.previewLine}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {!isPremium && (
          <div className="px-4 py-3 border-t border-white/10 bg-amber-500/5">
            <p className="text-[11px] text-amber-400/80 text-center">
              👑 {t("premiumHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
