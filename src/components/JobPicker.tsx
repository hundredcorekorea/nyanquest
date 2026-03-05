"use client";

import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { CAT_JOBS, getUnlockedJobs, getNextJobUnlock, type CatJob } from "@/lib/cat-jobs";

interface Props {
  open: boolean;
  userExp: number;
  onSelect: (jobId: string) => void;
  onClose: () => void;
}

export default function JobPicker({ open, userExp, onSelect, onClose }: Props) {
  const t = useTranslations("Jobs");
  const locale = useLocale();
  const isKo = locale === "ko";

  if (!open) return null;

  const unlocked = getUnlockedJobs(userExp);
  const unlockedIds = new Set(unlocked.map((j) => j.id));
  const nextUnlock = getNextJobUnlock(userExp);

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-9998" onClick={onClose} />
      <div className="fixed inset-0 z-9999 flex justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 m-auto shrink-0">
          <div className="bg-gradient-to-b from-amber-50 to-white px-5 pt-5 pb-3 text-center">
            <div className="text-3xl mb-1">⚔️</div>
            <h3 className="text-base font-bold text-gray-900">{t("pickTitle")}</h3>
            <p className="text-xs text-gray-500 mt-1">{t("pickDesc")}</p>
          </div>

          <div className="px-4 pb-4 space-y-2 max-h-[50vh] overflow-y-auto">
            {CAT_JOBS.map((job) => {
              const isUnlocked = unlockedIds.has(job.id);
              return (
                <button
                  key={job.id}
                  onClick={() => isUnlocked && onSelect(job.id)}
                  disabled={!isUnlocked}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    isUnlocked
                      ? "border-gray-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
                      : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{job.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${isUnlocked ? "text-gray-900" : "text-gray-400"}`}>
                        {isKo ? job.name : job.nameEn}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {isKo ? job.description : job.descriptionEn}
                      </p>
                    </div>
                    {!isUnlocked && (
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                        🔒 {job.unlockExp} EXP
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {nextUnlock && (
            <div className="px-5 pb-2">
              <p className="text-[10px] text-center text-amber-600">
                {t("nextUnlock", { exp: nextUnlock.unlockExp, name: isKo ? nextUnlock.name : nextUnlock.nameEn })}
              </p>
            </div>
          )}

          <div className="px-5 pb-4">
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
