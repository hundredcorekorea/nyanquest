import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

interface PlatformStats {
  users: number;
  quests_completed: number;
  active_parties: number;
  total_turns: number;
}

export default async function StatsHero() {
  const t = await getTranslations("Stats");
  const supabase = await createClient();

  let stats: PlatformStats = {
    users: 0,
    quests_completed: 0,
    active_parties: 0,
    total_turns: 0,
  };

  const { data } = await supabase.rpc("get_platform_stats");
  if (data) stats = data as PlatformStats;

  const statItems = [
    { label: t("adventurers"), value: stats.users, emoji: "🧙" },
    { label: t("diceRolls"), value: stats.total_turns, emoji: "🎲" },
    { label: t("quests"), value: stats.quests_completed, emoji: "⚔️" },
    { label: t("parties"), value: stats.active_parties, emoji: "🏰" },
  ];

  return (
    <div className="bg-gray-900 rounded-2xl p-5 text-white">
      <p className="text-center text-sm text-amber-300 mb-4">
        {t("earlyHero")}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="bg-gray-800 rounded-xl p-3 text-center"
          >
            <div className="text-lg mb-1">{item.emoji}</div>
            <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {item.value.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Link
          href="/solo"
          className="flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors text-sm"
        >
          🧙‍♂️ {t("soloPlay")}
        </Link>
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors text-sm"
        >
          👥 {t("partyPlay")}
        </Link>
      </div>
    </div>
  );
}
