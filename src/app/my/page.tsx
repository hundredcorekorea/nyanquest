"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, Party } from "@/types/database";
import { useToast } from "@/components/Toast";
import Link from "next/link";

const CAT_LEVELS = [
  { min: 0, name: "아기 냥이", emoji: "🐱", title: "갓 태어난 모험가" },
  { min: 50, name: "견습 냥이", emoji: "😺", title: "호기심 가득한 탐험가" },
  { min: 150, name: "모험가 냥이", emoji: "😸", title: "믿음직한 파티원" },
  { min: 300, name: "베테랑 냥이", emoji: "😼", title: "역전의 주사위꾼" },
  { min: 500, name: "대마법사 냥이", emoji: "🧙‍♂️", title: "전설의 집사님" },
];

function getCatLevel(exp: number) {
  for (let i = CAT_LEVELS.length - 1; i >= 0; i--) {
    if (exp >= CAT_LEVELS[i].min) return CAT_LEVELS[i];
  }
  return CAT_LEVELS[0];
}

function getNextLevel(exp: number) {
  for (const level of CAT_LEVELS) {
    if (exp < level.min) return level;
  }
  return null;
}

const STYLE_OPTIONS = [
  "서사중심",
  "전투중심",
  "탐색형",
  "롤플레이광",
  "뉴비환영",
  "룰중시",
  "즉흥형",
  "계획형",
];

export default function MyPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [joinedParties, setJoinedParties] = useState<Party[]>([]);
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"my" | "joined">("my");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (prof) {
        setProfile(prof);
        setEditNickname(prof.nickname);
        setEditTags(prof.style_tags ?? []);
      }

      // My parties (as GM)
      const { data: myParties } = await supabase
        .from("parties")
        .select("*, system:trpg_systems(name)")
        .eq("gm_id", user.id)
        .order("created_at", { ascending: false });
      if (myParties) setParties(myParties as unknown as Party[]);

      // Joined parties (as PL)
      const { data: memberships } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("user_id", user.id)
        .eq("role", "PL")
        .in("status", ["accepted", "pending"]);

      if (memberships && memberships.length > 0) {
        const ids = memberships.map((m) => m.party_id);
        const { data: joined } = await supabase
          .from("parties")
          .select("*, system:trpg_systems(name)")
          .in("id", ids)
          .order("created_at", { ascending: false });
        if (joined) setJoinedParties(joined as unknown as Party[]);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!user || !editNickname.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: editNickname.trim(),
        style_tags: editTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast("저장 실패: " + error.message, "error");
    } else {
      setProfile((prev) =>
        prev
          ? { ...prev, nickname: editNickname.trim(), style_tags: editTags }
          : prev
      );
      setEditing(false);
    }
    setSaving(false);
  };

  const toggleTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!user) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-gray-600 font-medium">로그인이 필요하다냥!</p>
        <p className="text-sm text-gray-400 mt-1">
          오른쪽 위의 로그인 버튼을 눌러달라냥~
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-4xl animate-bounce">🐱</div>
        <p className="text-sm text-gray-400 mt-2">불러오는 중이다냥...</p>
      </div>
    );
  }

  const catLevel = getCatLevel(profile.cat_exp);
  const nextLevel = getNextLevel(profile.cat_exp);
  const progress = nextLevel
    ? ((profile.cat_exp - catLevel.min) / (nextLevel.min - catLevel.min)) * 100
    : 100;

  const statusColors: Record<string, string> = {
    recruiting: "text-orange-600",
    filled: "text-gray-500",
    completed: "text-green-600",
    cancelled: "text-red-500",
  };
  const statusLabels: Record<string, string> = {
    recruiting: "모집중",
    filled: "모집완료",
    completed: "완료",
    cancelled: "취소",
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Cat & Profile Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
        <div className="flex items-start gap-4">
          {/* Cat avatar */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-amber-100">
              {catLevel.emoji}
            </div>
            <span className="text-xs font-medium text-amber-600">
              {catLevel.name}
            </span>
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  maxLength={20}
                />
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        editTags.includes(tag)
                          ? "bg-amber-400 text-white"
                          : "bg-white border border-gray-200 text-gray-500"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditNickname(profile.nickname);
                      setEditTags(profile.style_tags ?? []);
                    }}
                    className="px-4 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-gray-900 truncate">
                    {profile.nickname}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-amber-500 hover:text-amber-600"
                  >
                    편집
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {catLevel.title}
                </p>

                {/* Style tags */}
                {profile.style_tags && profile.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.style_tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white/80 text-amber-700 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-400">꾹꾹이 온도</p>
                    <p className="text-sm font-bold text-amber-600">
                      {profile.manner_temp}°
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">경험치</p>
                    <p className="text-sm font-bold text-amber-600">
                      {profile.cat_exp} EXP
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* EXP bar */}
        {!editing && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{catLevel.name}</span>
              <span>{nextLevel ? nextLevel.name : "MAX"}</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
        <button
          onClick={() => setTab("my")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "my"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-500"
          }`}
        >
          내가 만든 모험 ({parties.length})
        </button>
        <button
          onClick={() => setTab("joined")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "joined"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-500"
          }`}
        >
          참가한 모험 ({joinedParties.length})
        </button>
      </div>

      {/* Party list */}
      <div className="space-y-2">
        {(tab === "my" ? parties : joinedParties).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">😿</div>
            <p className="text-sm text-gray-400">
              {tab === "my"
                ? "아직 만든 모험이 없다냥..."
                : "아직 참가한 모험이 없다냥..."}
            </p>
            {tab === "my" && (
              <Link
                href="/create"
                className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors"
              >
                첫 모험 만들기
              </Link>
            )}
          </div>
        ) : (
          (tab === "my" ? parties : joinedParties).map((p) => (
            <Link key={p.id} href={tab === "my" ? `/party/${p.id}/manage` : `/party/${p.id}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {p.system?.name ?? p.custom_system_name ?? "미정"}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span
                        className={`text-xs font-medium ${statusColors[p.status]}`}
                      >
                        {statusLabels[p.status]}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">
                        {p.current_players}/{p.max_players}명
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
