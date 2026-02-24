import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import type { Announcement } from "@/types/database";

export default async function AnnouncementBanner({ locale }: { locale: string }) {
  const supabase = await createClient();

  // Get latest pinned or most recent announcement
  const { data } = await supabase
    .from("announcements")
    .select("id, title, category, is_pinned")
    .eq("language", locale)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  const a = data as Pick<Announcement, "id" | "title" | "category" | "is_pinned">;

  const categoryEmoji: Record<string, string> = {
    update: "⚔️",
    event: "🎉",
    maintenance: "🔧",
    tip: "💡",
  };

  return (
    <Link
      href={`/community/notice/${a.id}`}
      className="block bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 hover:bg-amber-100/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs">📜</span>
        <span className="text-xs font-medium text-amber-700 truncate flex-1">
          {categoryEmoji[a.category] ?? "📋"} {a.title}
        </span>
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
