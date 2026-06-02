"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { QuestMessage, DiceRoll } from "@/types/solo-quest";

interface Props {
  scenarioTitle: string;
  scenarioEmoji: string;
  genre: string;
  turnCount: number;
  isFailed: boolean;
  messages: QuestMessage[];
  expEarned: number;
  personaName?: string;
  personaEmoji?: string;
  onClose: () => void;
}

// Card themes with dramatic visual identity
const CARD_THEMES = [
  {
    id: "parchment",
    bg: ["#1a1207", "#2d1f0e", "#1a1207"],
    accent: "#f6ad55",
    text: "#fefcbf",
    sub: "#d69e2e",
    badge: "#dd6b20",
    glow: "rgba(246, 173, 85, 0.3)",
  },
  {
    id: "midnight",
    bg: ["#0f0a1e", "#1a1040", "#0f0a1e"],
    accent: "#b794f4",
    text: "#e9d8fd",
    sub: "#9f7aea",
    badge: "#6b46c1",
    glow: "rgba(183, 148, 244, 0.3)",
  },
  {
    id: "blood",
    bg: ["#1a0505", "#2d0a0a", "#1a0505"],
    accent: "#fc8181",
    text: "#fed7d7",
    sub: "#f56565",
    badge: "#c53030",
    glow: "rgba(252, 129, 129, 0.3)",
  },
  {
    id: "ocean",
    bg: ["#031525", "#0a2540", "#031525"],
    accent: "#63b3ed",
    text: "#bee3f8",
    sub: "#4299e1",
    badge: "#2b6cb0",
    glow: "rgba(99, 179, 237, 0.3)",
  },
] as const;

/** Extract the most dramatic dice moment from messages */
function findBestDiceMoment(messages: QuestMessage[]): {
  roll: DiceRoll;
  context: string;
} | null {
  let bestRoll: DiceRoll | null = null;
  let bestContext = "";
  let bestScore = -1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg.diceRoll) continue;
    const roll = msg.diceRoll;

    let score = 0;
    if (roll.type === "d20") score += 2;
    if (roll.total === 20 || (roll.type === "d20" && roll.result === 20)) score += 10;
    if (roll.total === 1 || (roll.type === "d20" && roll.result === 1)) score += 8;
    if (roll.success === false) score += 3;
    if (roll.success === true && roll.dc && roll.total === roll.dc) score += 5; // barely made it
    if (roll.messyCritical) score += 7;

    if (score > bestScore) {
      bestScore = score;
      bestRoll = roll;
      // Find preceding GM message for context
      const prevGm = messages.slice(0, i).reverse().find((m) => m.role === "gm");
      bestContext = prevGm?.content.split("\n")[0]?.replace(/\*\*/g, "").slice(0, 60) ?? "";
    }
  }

  return bestRoll ? { roll: bestRoll, context: bestContext } : null;
}

/** Count stats from messages */
function computeStats(messages: QuestMessage[]) {
  let totalRolls = 0;
  let successes = 0;
  let criticals = 0;
  let fumbles = 0;
  let maxRoll = 0;

  for (const msg of messages) {
    if (!msg.diceRoll) continue;
    const r = msg.diceRoll;
    totalRolls++;
    if (r.success) successes++;
    if (r.type === "d20" && r.result === 20) criticals++;
    if (r.type === "d20" && r.result === 1) fumbles++;
    if (r.total > maxRoll) maxRoll = r.total;
  }

  return { totalRolls, successes, criticals, fumbles, maxRoll };
}

/** Get a dramatic title based on quest outcome and stats */
function getDramaticTitle(isFailed: boolean, stats: ReturnType<typeof computeStats>, locale: string) {
  if (locale === "en") {
    if (isFailed && stats.fumbles > 0) return "Cursed by the Dice Gods";
    if (isFailed) return "A Hero's Last Stand";
    if (stats.criticals >= 2) return "Legend of the Golden Dice";
    if (stats.successes > stats.totalRolls * 0.8) return "Destined for Victory";
    if (stats.fumbles > 0 && !isFailed) return "Against All Odds";
    return "Tale of the Brave";
  }
  if (isFailed && stats.fumbles > 0) return "주사위 신의 저주";
  if (isFailed) return "영웅의 마지막 저항";
  if (stats.criticals >= 2) return "황금 주사위의 전설";
  if (stats.successes > stats.totalRolls * 0.8) return "운명의 승리자";
  if (stats.fumbles > 0 && !isFailed) return "역경을 넘어서";
  return "용감한 자의 이야기";
}

export default function SessionShareCard({
  scenarioTitle,
  scenarioEmoji,
  genre,
  turnCount,
  isFailed,
  messages,
  expEarned,
  personaName,
  personaEmoji,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = useTranslations("ShareCard");
  const locale = useLocale();
  const [themeIndex, setThemeIndex] = useState(isFailed ? 2 : 0);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const theme = CARD_THEMES[themeIndex];
  const stats = computeStats(messages);
  const bestMoment = findBestDiceMoment(messages);
  const dramaticTitle = getDramaticTitle(isFailed, stats, locale);

  // Extract a memorable quote from the last GM message
  const lastGmMsg = [...messages].reverse().find((m) => m.role === "gm");
  const epicQuote = lastGmMsg?.content
    .replace(/\[퀘스트 완료\]|\[퀘스트 실패\]|\[Quest Complete\]|\[Quest Failed\]/g, "")
    .replace(/\[SCENE:[^\]]*\]/g, "")
    .replace(/\*\*/g, "")
    .split("\n")
    .filter((l) => l.trim().length > 10 && !l.match(/^\d+[\.\)]/))
    [0]?.trim().slice(0, 80) ?? "";

  const renderCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, theme.bg[0]);
    bgGrad.addColorStop(0.5, theme.bg[1]);
    bgGrad.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Decorative star particles ──
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.6;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.5 + 0.1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Glow orb at top ──
    const glowGrad = ctx.createRadialGradient(W / 2, 300, 0, W / 2, 300, 400);
    glowGrad.addColorStop(0, theme.glow);
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, 700);

    // ── Top border lines ──
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.globalAlpha = 0.15;
    ctx.strokeRect(55, 55, W - 110, H - 110);
    ctx.globalAlpha = 1;

    // ── Corner ornaments ──
    const drawCorner = (cx: number, cy: number) => {
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    drawCorner(55, 55);
    drawCorner(W - 55, 55);
    drawCorner(55, H - 55);
    drawCorner(W - 55, H - 55);

    // ── nyanQuest Logo ──
    ctx.font = "600 28px 'Segoe UI', sans-serif";
    ctx.fillStyle = theme.sub;
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.7;
    ctx.fillText("nyanQuest", W / 2, 110);
    ctx.globalAlpha = 1;

    // ── Status badge ──
    const statusText = isFailed
      ? (locale === "en" ? "QUEST FAILED" : "퀘스트 실패")
      : (locale === "en" ? "QUEST COMPLETE" : "퀘스트 완료");
    ctx.font = "700 24px 'Segoe UI', sans-serif";
    const badgeW = ctx.measureText(statusText).width + 60;
    const badgeX = (W - badgeW) / 2;
    const badgeY = 140;

    // Badge background
    ctx.fillStyle = theme.badge;
    ctx.globalAlpha = 0.9;
    roundRect(ctx, badgeX, badgeY, badgeW, 44, 22);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Badge text
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(statusText, W / 2, badgeY + 30);

    // ── Scenario emoji (large) ──
    ctx.font = "120px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(scenarioEmoji, W / 2, 340);

    // ── Dramatic title ──
    ctx.font = "700 52px 'Segoe UI', 'Malgun Gothic', sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "center";
    wrapText(ctx, dramaticTitle, W / 2, 430, W - 160, 64);

    // ── Scenario name ──
    ctx.font = "400 30px 'Segoe UI', 'Malgun Gothic', sans-serif";
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.8;
    ctx.textAlign = "center";
    ctx.fillText(scenarioTitle, W / 2, 510);
    ctx.globalAlpha = 1;

    // ── Genre + Turns ──
    ctx.font = "400 24px 'Segoe UI', 'Malgun Gothic', sans-serif";
    ctx.fillStyle = theme.sub;
    ctx.fillText(`${genre} · ${turnCount} ${locale === "en" ? "turns" : "턴"}`, W / 2, 555);

    // ── Persona indicator ──
    if (personaName && personaName !== "나양" && personaName !== "NaYang") {
      ctx.font = "400 22px 'Segoe UI', 'Malgun Gothic', sans-serif";
      ctx.fillStyle = theme.sub;
      ctx.globalAlpha = 0.7;
      ctx.fillText(`GM: ${personaEmoji ?? "🐱"} ${personaName}`, W / 2, 595);
      ctx.globalAlpha = 1;
    }

    // ── Divider ──
    const divY = 640;
    const divGrad = ctx.createLinearGradient(100, divY, W - 100, divY);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.5, theme.accent);
    divGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, divY);
    ctx.lineTo(W - 100, divY);
    ctx.stroke();

    // ── Epic quote ──
    if (epicQuote) {
      ctx.font = "italic 28px 'Segoe UI', 'Malgun Gothic', sans-serif";
      ctx.fillStyle = theme.text;
      ctx.globalAlpha = 0.85;
      ctx.textAlign = "center";
      const quoteY = 700;
      ctx.fillText("\"", W / 2 - ctx.measureText(epicQuote.slice(0, 30)).width / 2 - 15, quoteY);
      wrapText(ctx, epicQuote, W / 2, quoteY, W - 200, 38);
      ctx.globalAlpha = 1;
    }

    // ── Stats section ──
    const statsY = 850;

    // Stats title
    ctx.font = "600 26px 'Segoe UI', 'Malgun Gothic', sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "center";
    ctx.fillText(locale === "en" ? "⚔️  BATTLE RECORD  ⚔️" : "⚔️  전투 기록  ⚔️", W / 2, statsY);

    // Stats grid (2x2)
    const gridStartY = statsY + 50;
    const cellW = 420;
    const cellH = 130;
    const gap = 30;
    const gridX = (W - cellW * 2 - gap) / 2;

    const statItems = [
      {
        emoji: "🎲",
        label: locale === "en" ? "Dice Rolled" : "주사위 굴림",
        value: String(stats.totalRolls),
      },
      {
        emoji: "✅",
        label: locale === "en" ? "Successes" : "성공 횟수",
        value: `${stats.successes}/${stats.totalRolls}`,
      },
      {
        emoji: "⚡",
        label: locale === "en" ? "Critical Hits" : "크리티컬",
        value: String(stats.criticals),
      },
      {
        emoji: "💀",
        label: locale === "en" ? "Fumbles" : "펌블",
        value: String(stats.fumbles),
      },
    ];

    statItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridX + col * (cellW + gap);
      const y = gridStartY + row * (cellH + 20);

      // Stat card background
      ctx.fillStyle = theme.bg[1];
      ctx.globalAlpha = 0.6;
      roundRect(ctx, x, y, cellW, cellH, 16);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Border
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, cellW, cellH, 16);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Emoji
      ctx.font = "42px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.emoji, x + cellW / 2, y + 50);

      // Value
      ctx.font = "700 32px 'Segoe UI', sans-serif";
      ctx.fillStyle = theme.accent;
      ctx.fillText(item.value, x + cellW / 2, y + 88);

      // Label
      ctx.font = "400 20px 'Segoe UI', 'Malgun Gothic', sans-serif";
      ctx.fillStyle = theme.sub;
      ctx.fillText(item.label, x + cellW / 2, y + 116);
    });

    // ── Best dice moment highlight ──
    const momentY = gridStartY + cellH * 2 + 80;
    if (bestMoment) {
      ctx.fillStyle = theme.bg[1];
      ctx.globalAlpha = 0.5;
      roundRect(ctx, 80, momentY, W - 160, 160, 20);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Glow border
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      roundRect(ctx, 80, momentY, W - 160, 160, 20);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font = "600 22px 'Segoe UI', 'Malgun Gothic', sans-serif";
      ctx.fillStyle = theme.sub;
      ctx.textAlign = "center";
      ctx.fillText(
        locale === "en" ? "🌟 Most Dramatic Moment" : "🌟 가장 드라마틱한 순간",
        W / 2,
        momentY + 36,
      );

      // Dice result
      const diceText = `${bestMoment.roll.type.toUpperCase()} → ${bestMoment.roll.total}${
        bestMoment.roll.success === true ? " ✨" : bestMoment.roll.success === false ? " 💥" : ""
      }`;
      ctx.font = "700 40px 'Segoe UI', sans-serif";
      ctx.fillStyle = theme.accent;
      ctx.fillText(diceText, W / 2, momentY + 85);

      // Context
      if (bestMoment.context) {
        ctx.font = "italic 20px 'Segoe UI', 'Malgun Gothic', sans-serif";
        ctx.fillStyle = theme.text;
        ctx.globalAlpha = 0.6;
        ctx.fillText(bestMoment.context.slice(0, 45) + "...", W / 2, momentY + 125);
        ctx.globalAlpha = 1;
      }
    }

    // ── EXP earned ──
    const expY = momentY + 200;
    ctx.font = "700 36px 'Segoe UI', sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "center";
    ctx.fillText(`+${expEarned} EXP`, W / 2, expY);

    // ── Divider 2 ──
    const div2Y = expY + 40;
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, div2Y);
    ctx.lineTo(W - 100, div2Y);
    ctx.stroke();

    // ── CTA Footer ──
    ctx.font = "400 24px 'Segoe UI', 'Malgun Gothic', sans-serif";
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.6;
    ctx.textAlign = "center";
    ctx.fillText(locale === "en" ? "Write your own adventure at" : "나만의 모험을 써보세요", W / 2, H - 130);
    ctx.globalAlpha = 1;

    ctx.font = "600 28px 'Segoe UI', sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.fillText("nyanquest.com", W / 2, H - 90);

    // ── Cat paw watermark ──
    ctx.font = "40px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
    ctx.globalAlpha = 0.15;
    ctx.fillText("🐾", W / 2, H - 50);
    ctx.globalAlpha = 1;

    // Generate preview URL
    const url = canvas.toDataURL("image/png");
    setPreviewUrl(url);
  }, [theme, isFailed, locale, scenarioEmoji, scenarioTitle, genre, turnCount, dramaticTitle, personaName, personaEmoji, epicQuote, stats, bestMoment, expEarned]);

  useEffect(() => {
    renderCard();
  }, [renderCard]);

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      // Try native share first (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        );
        const file = new File([blob], `nyanquest-${Date.now()}.png`, {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "nyanQuest",
            text: locale === "en" ? "Check out my quest result!" : "나의 모험 기록을 확인해보세요!",
          });
          setDownloading(false);
          return;
        }
      }

      // Fallback: download
      const link = document.createElement("a");
      link.download = `nyanquest-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // User cancelled share
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-sm w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            📸 {t("title")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Session Card"
              className="w-full rounded-xl shadow-2xl"
            />
          )}

          {/* Theme selector */}
          <div className="flex justify-center gap-3 mt-4">
            {CARD_THEMES.map((ct, i) => (
              <button
                key={ct.id}
                onClick={() => setThemeIndex(i)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  i === themeIndex ? "border-white scale-110" : "border-white/20"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${ct.bg[0]}, ${ct.accent})`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            {downloading ? t("saving") : t("shareButton")}
          </button>
          <p className="text-[10px] text-gray-500 text-center">{t("hint")}</p>
        </div>
      </div>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/** Helper: rounded rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Helper: wrap text with center alignment */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const chars = text.split("");
  let line = "";
  let currentY = y;

  for (const char of chars) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
