import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { tossShare, tossHaptic } from "../lib/toss";
import type { Profile, Party, PartyMember } from "../types";

interface Props {
  profile: Profile | null;
}

export default function PartyDetail({ profile }: Props) {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!partyId) return;
    loadParty();
  }, [partyId]);

  async function loadParty() {
    setLoading(true);
    const [{ data: partyData }, { data: membersData }, { data: sessionData }] = await Promise.all([
      supabase
        .from("parties")
        .select("*, creator:profiles!parties_creator_id_fkey(nickname, avatar_url, cat_type)")
        .eq("id", partyId!)
        .single(),
      supabase
        .from("party_members")
        .select("*, user:profiles!party_members_user_id_fkey(nickname, avatar_url, cat_type)")
        .eq("party_id", partyId!)
        .eq("status", "accepted"),
      supabase
        .from("party_sessions")
        .select("id, status")
        .eq("party_id", partyId!)
        .in("status", ["active", "paused"])
        .limit(1),
    ]);

    setParty(partyData);
    setMembers(membersData || []);
    setHasSession(!!(sessionData && sessionData.length > 0));
    setLoading(false);
  }

  const isCreator = profile?.id === party?.creator_id;
  const isMember = members.some((m) => m.user_id === profile?.id);
  const canJoin = !isMember && party?.status === "recruiting" && (party?.current_players || 0) < (party?.max_players || 4);

  async function handleJoin() {
    if (!profile || !partyId || joining) return;
    setJoining(true);

    try {
      const { error: insertErr } = await supabase.from("party_members").insert({
        party_id: partyId,
        user_id: profile.id,
        role: "PL",
        status: "accepted",
      });

      if (insertErr) {
        tossHaptic("error");
        setJoining(false);
        return;
      }

      await supabase
        .from("parties")
        .update({ current_players: (party?.current_players || 1) + 1 })
        .eq("id", partyId);

      tossHaptic("success");
      await loadParty();
    } catch {
      tossHaptic("error");
    } finally {
      setJoining(false);
    }
  }

  async function handleStartSession() {
    if (!profile || !partyId || !isCreator || startingSession) return;
    setStartingSession(true);

    try {
      const turnOrder = members.filter((m) => m.role === "PL").map((m) => m.user_id);
      const totalTurns = 25; // Free tier

      const { data: session } = await supabase
        .from("party_sessions")
        .insert({
          party_id: partyId,
          status: "active",
          turn_order: turnOrder,
          current_turn_index: 0,
          turn_count: 0,
          total_turns: totalTurns,
          use_ai_gm: true,
          play_mode: party?.play_mode || "realtime",
        })
        .select()
        .single();

      if (session) {
        await supabase
          .from("parties")
          .update({ status: "filled" })
          .eq("id", partyId);

        tossHaptic("success");
        navigate(`/party/${partyId}/play`);
      }
    } catch (e) {
      console.error("Start session failed:", e);
    } finally {
      setStartingSession(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-(--tds-text-secondary) text-sm">로딩 중...</div>;
  }

  if (!party) {
    return <div className="text-center py-12 text-(--tds-text-secondary) text-sm">파티를 찾을 수 없다냥...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Party info */}
      <div className="bg-(--tds-bg-elevated) rounded-2xl p-5 border border-(--tds-border)">
        <h1 className="text-lg font-bold text-(--tds-text)">{party.title}</h1>
        <p className="text-sm text-(--tds-text-secondary) mt-1">{party.content}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge>🤖 AI GM</Badge>
          <Badge>{party.play_mode === "realtime" ? "⚡ 실시간" : "🔄 비동기"}</Badge>
          <Badge>👥 {party.current_players}/{party.max_players}명</Badge>
          <Badge className={party.status === "recruiting" ? "bg-(--tds-green-bg) text-(--tds-green) border-(--tds-green-bg)" : ""}>
            {party.status === "recruiting" ? "모집중" : party.status === "filled" ? "인원마감" : party.status}
          </Badge>
        </div>
      </div>

      {/* Members */}
      <div>
        <h2 className="text-sm font-medium text-(--tds-text) mb-2">파티원</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-(--tds-bg-elevated) rounded-xl px-3.5 py-2.5">
              <div className="w-8 h-8 bg-(--tds-blue-bg) rounded-full flex items-center justify-center text-sm">🐱</div>
              <div className="flex-1">
                <span className="text-sm text-(--tds-text)">{m.user?.nickname || "???"}</span>
                {m.user_id === party.creator_id && (
                  <span className="ml-1.5 text-[10px] text-(--tds-yellow) bg-(--tds-yellow-bg) px-1.5 py-0.5 rounded-full">방장</span>
                )}
              </div>
              <span className="text-[10px] text-(--tds-text-muted)">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {canJoin && (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3 bg-(--tds-blue) text-(--tds-text) rounded-xl font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {joining ? "참가 중..." : "파티 참가하기"}
          </button>
        )}

        {isMember && hasSession && (
          <Link
            to={`/party/${partyId}/play`}
            className="block w-full py-3 bg-(--tds-green) text-(--tds-text) rounded-xl font-medium text-center active:scale-[0.98] transition-transform"
          >
            세션 플레이 하기 ▶
          </Link>
        )}

        {isCreator && isMember && !hasSession && members.length >= 2 && (
          <button
            onClick={handleStartSession}
            disabled={startingSession}
            className="w-full py-3 bg-(--tds-green) text-(--tds-text) rounded-xl font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {startingSession ? "세션 시작 중..." : "🎲 세션 시작하기!"}
          </button>
        )}

        {isCreator && members.length < 2 && (
          <div className="text-center py-3 text-sm text-(--tds-text-muted)">
            최소 2명이 모여야 세션을 시작할 수 있다냥
          </div>
        )}

        <button
          onClick={() => tossShare(`냥퀘스트에서 같이 TRPG 하자냥! 🐱 파티: "${party.title}"`)}
          className="w-full py-2.5 bg-(--tds-bg-card) text-(--tds-text) rounded-xl text-sm active:scale-[0.98] transition-transform"
        >
          📤 친구 초대하기
        </button>
      </div>
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full bg-(--tds-bg-card) text-(--tds-text-secondary) border border-(--tds-border-subtle) ${className}`}>
      {children}
    </span>
  );
}
