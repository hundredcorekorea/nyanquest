import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const lang = searchParams.get("lang") === "en" ? "en" : "ko";

  if (!id) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
            fontSize: 48,
          }}
        >
          🐱 nyanQuest
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim()
  );

  const { data: party } = await supabase
    .from("parties")
    .select(
      "title, content, max_players, current_players, meeting_type, status, scheduled_at, looking_for_gm, creator:profiles!parties_creator_id_fkey(nickname, manner_temp), gm:profiles!parties_gm_id_fkey(nickname, manner_temp), system:trpg_systems(name)"
    )
    .eq("id", id)
    .single();

  if (!party) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#FFF7ED",
            fontSize: 36,
          }}
        >
          {lang === "ko" ? "😿 파티를 찾을 수 없다냥..." : "😿 Party not found, meow..."}
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const p = party as unknown as {
    title: string;
    content: string | null;
    max_players: number;
    current_players: number;
    meeting_type: string;
    status: string;
    scheduled_at: string | null;
    looking_for_gm: boolean;
    creator: { nickname: string; manner_temp: number } | null;
    gm: { nickname: string; manner_temp: number } | null;
    system: { name: string } | null;
  };

  const meetingLabel =
    p.meeting_type === "online"
      ? (lang === "ko" ? "💻 온라인" : "💻 Online")
      : p.meeting_type === "offline"
        ? (lang === "ko" ? "🏠 오프라인" : "🏠 Offline")
        : (lang === "ko" ? "🔄 하이브리드" : "🔄 Hybrid");

  const statusLabel =
    p.status === "recruiting"
      ? (lang === "ko" ? "모집중" : "Recruiting")
      : p.status === "filled"
        ? (lang === "ko" ? "마감" : "Filled")
        : p.status === "completed"
          ? (lang === "ko" ? "완료" : "Completed")
          : (lang === "ko" ? "취소" : "Cancelled");

  const statusColor =
    p.status === "recruiting"
      ? "#EA580C"
      : p.status === "completed"
        ? "#16A34A"
        : "#6B7280";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 50%, #FFEDD5 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "48px" }}>🐱</span>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "#1F2937" }}>
              nyan<span style={{ color: "#F59E0B" }}>Quest</span>
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: "999px",
              background: statusColor,
              color: "white",
              fontSize: "22px",
              fontWeight: 600,
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1.3,
            marginBottom: "24px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {p.title}
        </div>

        {/* Description preview */}
        {p.content && (
          <div
            style={{
              fontSize: "24px",
              color: "#6B7280",
              lineHeight: 1.5,
              marginBottom: "auto",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {p.content!.slice(0, 120)}
          </div>
        )}

        {/* Bottom info bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginTop: "auto",
            paddingTop: "32px",
            borderTop: "2px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          {/* System */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(245, 158, 11, 0.1)",
              padding: "10px 20px",
              borderRadius: "16px",
              fontSize: "22px",
              fontWeight: 600,
              color: "#B45309",
            }}
          >
            🎲 {p.system?.name ?? (lang === "ko" ? "미정" : "TBD")}
          </div>

          {/* Meeting type */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(59, 130, 246, 0.1)",
              padding: "10px 20px",
              borderRadius: "16px",
              fontSize: "22px",
              fontWeight: 600,
              color: "#1D4ED8",
            }}
          >
            {meetingLabel}
          </div>

          {/* Player count */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(34, 197, 94, 0.1)",
              padding: "10px 20px",
              borderRadius: "16px",
              fontSize: "22px",
              fontWeight: 600,
              color: "#15803D",
            }}
          >
            👥 {p.current_players}/{p.max_players}{lang === "ko" ? "명" : ""}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Creator info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "22px",
              color: "#374151",
            }}
          >
            <span style={{ fontSize: "32px" }}>😺</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 700 }}>
                {p.creator?.nickname ?? p.gm?.nickname ?? (lang === "ko" ? "파티장" : "Leader")}
              </span>
              <span style={{ fontSize: "18px", color: "#D97706" }}>
                {p.creator?.manner_temp ?? p.gm?.manner_temp ?? 36.5}°
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
