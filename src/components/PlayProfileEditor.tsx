"use client";

import { useState } from "react";
import type { FavoriteWork } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";

interface Props {
  userId: string;
  initialWorks: FavoriteWork[];
  initialPreferred: string[];
  initialAvoided: string[];
  onSave: (works: FavoriteWork[], preferred: string[], avoided: string[]) => void;
  onCancel: () => void;
}

export default function PlayProfileEditor({
  userId,
  initialWorks,
  initialPreferred,
  initialAvoided,
  onSave,
  onCancel,
}: Props) {
  const t = useTranslations("PlayProfile");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  // Pad to 3 works
  const padded: FavoriteWork[] = [
    initialWorks[0] ?? { title: "", reason: "" },
    initialWorks[1] ?? { title: "", reason: "" },
    initialWorks[2] ?? { title: "", reason: "" },
  ];
  const [works, setWorks] = useState<FavoriteWork[]>(padded);
  const [preferred, setPreferred] = useState<string[]>(initialPreferred);
  const [avoided, setAvoided] = useState<string[]>(initialAvoided);
  const [prefInput, setPrefInput] = useState("");
  const [avoidInput, setAvoidInput] = useState("");

  const suggestedPreferred = t.raw("suggestedPreferred") as string[];
  const suggestedAvoided = t.raw("suggestedAvoided") as string[];

  const updateWork = (index: number, field: "title" | "reason", value: string) => {
    setWorks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addTag = (list: string[], setList: (v: string[]) => void, value: string) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const removeTag = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.filter((t) => t !== value));
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanedWorks = works.filter((w) => w.title.trim());
    const { error } = await supabase
      .from("profiles")
      .update({
        favorite_works: cleanedWorks,
        preferred_elements: preferred,
        avoided_elements: avoided,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      toast(t("saved").replace("저장", "실패"), "error");
    } else {
      toast(t("saved"), "success");
      onSave(cleanedWorks, preferred, avoided);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-5 space-y-5">
      <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
        🎭 {t("title")}
      </h2>

      {/* Favorite Works */}
      <div>
        <h3 className="text-xs font-medium text-gray-700 mb-1">
          {t("favoriteWorksTitle")}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{t("favoriteWorksGuide")}</p>
        <div className="space-y-3">
          {works.map((work, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-500 w-5">{i + 1}</span>
                <input
                  type="text"
                  placeholder={t("workTitlePlaceholder")}
                  value={work.title}
                  onChange={(e) => updateWork(i, "title", e.target.value)}
                  maxLength={50}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <input
                type="text"
                placeholder={t("workReasonPlaceholder")}
                value={work.reason}
                onChange={(e) => updateWork(i, "reason", e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 ml-7"
                style={{ width: "calc(100% - 1.75rem)" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Elements */}
      <div>
        <h3 className="text-xs font-medium text-gray-700 mb-2">
          👍 {t("preferredTitle")}
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {preferred.map((el) => (
            <button
              key={el}
              onClick={() => removeTag(preferred, setPreferred, el)}
              className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full hover:bg-green-200 transition-colors"
            >
              {el} ✕
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder={t("preferredPlaceholder")}
            value={prefInput}
            onChange={(e) => setPrefInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(preferred, setPreferred, prefInput);
                setPrefInput("");
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {suggestedPreferred
            .filter((s) => !preferred.includes(s))
            .map((s) => (
              <button
                key={s}
                onClick={() => addTag(preferred, setPreferred, s)}
                className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      </div>

      {/* Avoided Elements */}
      <div>
        <h3 className="text-xs font-medium text-gray-700 mb-2">
          🚫 {t("avoidedTitle")}
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {avoided.map((el) => (
            <button
              key={el}
              onClick={() => removeTag(avoided, setAvoided, el)}
              className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full hover:bg-red-200 transition-colors"
            >
              {el} ✕
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder={t("avoidedPlaceholder")}
            value={avoidInput}
            onChange={(e) => setAvoidInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(avoided, setAvoided, avoidInput);
                setAvoidInput("");
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {suggestedAvoided
            .filter((s) => !avoided.includes(s))
            .map((s) => (
              <button
                key={s}
                onClick={() => addTag(avoided, setAvoided, s)}
                className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      </div>

      <p className="text-xs text-gray-300 italic">{t("ntcCredit")}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
        >
          {saving ? tCommon("saving") : tCommon("save")}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 text-sm text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </div>
  );
}
