import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Announcement, AnnouncementCategory } from "@/types/database";
import { getTranslations } from "next-intl/server";
import SimpleMarkdown from "@/components/SimpleMarkdown";

const categoryStyle: Record<AnnouncementCategory, { emoji: string; label: string }> = {
  update: { emoji: "⚔️", label: "업데이트" },
  event: { emoji: "🎉", label: "이벤트" },
  maintenance: { emoji: "🔧", label: "점검" },
  tip: { emoji: "💡", label: "팁" },
};

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id, locale } = await params;
  const t = await getTranslations("Announcements");
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const announcement = data as Announcement;
  const cat = categoryStyle[announcement.category];

  const dateLocale = locale === "ko" ? "ko-KR" : "en-US";
  const dateStr = new Date(announcement.created_at).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pb-20 max-w-lg mx-auto">
      {/* Back */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("backToGuildHall")}
      </Link>

      {/* Card */}
      <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-amber-200/50">
          <div className="flex items-center gap-2 mb-2">
            {announcement.is_pinned && <span className="text-sm">📌</span>}
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {cat.emoji} {t(`categories.${announcement.category}`)}
            </span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">{announcement.title}</h1>
          <p className="text-xs text-gray-400 mt-1">📜 {t("postedBy")} · {dateStr}</p>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <SimpleMarkdown
            content={announcement.content}
            className="text-sm text-gray-700 leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
