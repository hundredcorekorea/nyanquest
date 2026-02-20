"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import type { TrpgSystem, PostCategory } from "@/types/database";
import { useToast } from "@/components/Toast";
import { useTranslations, useLocale } from "next-intl";

export default function WritePostPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations("CommunityWrite");
  const tCommon = useTranslations("Common");
  const tCommunity = useTranslations("Community");
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [systems, setSystems] = useState<TrpgSystem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const categories: { value: PostCategory; label: string; emoji: string }[] = [
    { value: "free", label: tCommunity("categories.free"), emoji: "🐱" },
    { value: "tip", label: tCommunity("categories.tip"), emoji: "📚" },
    { value: "gallery", label: tCommunity("categories.gallery"), emoji: "🖼️" },
    { value: "qna", label: tCommunity("categories.qna"), emoji: "❓" },
  ];

  const [form, setForm] = useState({
    category: "free" as PostCategory,
    title: "",
    content: "",
    system_id: "",
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase
        .from("trpg_systems")
        .select("*")
        .eq("is_official", true)
        .order("name");
      if (data) setSystems(data);
    };
    init();
  }, []);

  const handleSubmit = async () => {
    if (!user || !form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        category: form.category,
        title: form.title.trim(),
        content: form.content.trim(),
        system_id: form.system_id || null,
        language: locale,
      })
      .select("id")
      .single();

    if (error) {
      toast(t("submitFailed", { error: error.message }), "error");
      setSubmitting(false);
      return;
    }

    if (data) {
      router.push(`/community/${data.id}`);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-gray-600 font-medium">{tCommon("loginRequired")}</p>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-5">
      <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("category")}
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setForm((p) => ({ ...p, category: cat.value }))
              }
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                form.category === cat.value
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* System tag (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("systemTag")}
        </label>
        <select
          value={form.system_id}
          onChange={(e) =>
            setForm((p) => ({ ...p, system_id: e.target.value }))
          }
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">{t("noTag")}</option>
          {systems.map((sys) => (
            <option key={sys.id} value={sys.id}>
              🎲 {sys.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("postTitle")}
        </label>
        <input
          type="text"
          placeholder={t("postTitlePlaceholder")}
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("content")}
        </label>
        <textarea
          placeholder={t("contentPlaceholder")}
          value={form.content}
          onChange={(e) =>
            setForm((p) => ({ ...p, content: e.target.value }))
          }
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.title.trim() || !form.content.trim()}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? t("submitting") : `🐱 ${t("submit")}`}
      </button>
    </div>
  );
}
