import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import type { Announcement, AnnouncementCategory } from "@/types/database";
import { getTranslations } from "next-intl/server";

const categoryStyle: Record<AnnouncementCategory, { emoji: string; bg: string; text: string }> = {
  update: { emoji: "⚔️", bg: "bg-amber-100", text: "text-amber-700" },
  event: { emoji: "🎉", bg: "bg-purple-100", text: "text-purple-700" },
  maintenance: { emoji: "🔧", bg: "bg-gray-100", text: "text-gray-600" },
  tip: { emoji: "💡", bg: "bg-blue-100", text: "text-blue-700" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default async function AnnouncementBoard() {
  const t = await getTranslations("Announcements");
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const announcements = (data ?? []) as Announcement[];

  if (announcements.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/50 border-b border-amber-200">
        <span className="text-base">📜</span>
        <h2 className="text-sm font-bold text-amber-800">{t("title")}</h2>
        <span className="text-[10px] text-amber-500 ml-auto">{t("subtitle")}</span>
      </div>

      {/* Announcement list */}
      <div className="divide-y divide-amber-100">
        {announcements.map((a) => {
          const cat = categoryStyle[a.category];
          return (
            <Link
              key={a.id}
              href={`/community/notice/${a.id}`}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-amber-50/50 transition-colors"
            >
              {a.is_pinned && (
                <span className="text-xs text-red-500 shrink-0">📌</span>
              )}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${cat.bg} ${cat.text}`}>
                {cat.emoji} {t(`categories.${a.category}`)}
              </span>
              <span className="text-xs text-gray-800 truncate flex-1 font-medium">
                {a.title}
              </span>
              <span className="text-[10px] text-gray-400 shrink-0">
                {formatDate(a.created_at)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
