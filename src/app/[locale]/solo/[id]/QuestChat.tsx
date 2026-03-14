"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { parseSystemDiceRequest, type ParsedDiceRequest } from "@/lib/solo-quest/dice";
import { extractSceneTag } from "@/lib/solo-quest/text-format";
import { getSystem, type TrpgSystemId } from "@/lib/solo-quest/systems";
import { useQuestSounds } from "@/hooks/useQuestSounds";
import { useBgmPlayer } from "@/hooks/useBgmPlayer";
import { useBgmMood } from "@/hooks/useBgmMood";
import { useSceneBackground } from "@/hooks/useSceneBackground";
import { useTurns } from "@/hooks/useTurns";
import NaYangCutIn, { type CutInType } from "@/components/NaYangCutIn";
import PersonaSelector from "@/components/PersonaSelector";
import SessionShareCard from "@/components/SessionShareCard";
import { getPersona, type GmPersona } from "@/lib/solo-quest/personas";
import type { SoloQuest, QuestMessage, DiceRoll, ScenarioTheme } from "@/types/solo-quest";
import type { SfxGenre } from "@/hooks/useQuestSounds";
import GmPanel from "./GmPanel";
import ScenePanel from "./ScenePanel";
import PlayerPanel, { type InputMode } from "./PlayerPanel";
import DiceRoller from "./DiceRoller";
import DiceOverlay from "./DiceOverlay";
import TurnExtendBanner from "./TurnExtendBanner";
import QuestComplete from "./QuestComplete";

interface Props {
  quest: SoloQuest;
  scenarioTitle: string;
  scenarioId: string;
  scenarioEmoji?: string;
  totalTurns: number;
  suggestedActions: string[];
  isPremium: boolean;
  theme: ScenarioTheme;
  systemId?: TrpgSystemId;
  userAvatarUrl: string | null;
  genre?: string;
}

// Map scenario genre string to SFX genre category
function genreToSfx(genre?: string): SfxGenre {
  if (!genre) return "fantasy";
  const g = genre.toLowerCase();
  if (/호러|horror|미스터리|mystery|심리|psycho/.test(g)) return "horror";
  if (/sf|sci-?fi|우주|space|cyber/.test(g)) return "scifi";
  if (/고딕|gothic|범죄|crime|noir|dark/.test(g)) return "dark";
  return "fantasy";
}

export default function QuestChat({
  quest,
  scenarioTitle,
  scenarioId,
  scenarioEmoji = "🎲",
  totalTurns,
  suggestedActions: initialSuggestions,
  isPremium,
  theme,
  systemId,
  userAvatarUrl,
  genre,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const tQuest = useTranslations("SoloQuest");
  const tSolo = useTranslations("Solo");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const sounds = useQuestSounds();
  const bgm = useBgmPlayer();
  const bgmMood = useBgmMood(useCallback((category, trackId) => {
    if (trackId) {
      bgm.playTrack(category, trackId);
    } else {
      bgm.playCategory(category);
    }
  }, [bgm.playTrack, bgm.playCategory]));
  const [showBgmVolume, setShowBgmVolume] = useState(false);
  const [showBgmPrompt, setShowBgmPrompt] = useState(false);
  const bgmPromptAnsweredRef = useRef(false);
  const [messages, setMessages] = useState<QuestMessage[]>(quest.messages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [turnCount, setTurnCount] = useState(quest.turn_count);
  const [questStatus, setQuestStatus] = useState(quest.status);
  const system = getSystem(systemId);
  const [pendingDice, setPendingDice] = useState<ParsedDiceRequest | null>(null);
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [screenEffect, setScreenEffect] = useState<"critical" | "fumble" | "success" | "fail" | null>(null);
  const sfxGenre = genreToSfx(genre);
  const { sceneBg, changeScene } = useSceneBackground(scenarioId);
  const lastSceneTagRef = useRef<string | null>(null);
  const [cutIn, setCutIn] = useState<{ type: CutInType; key: number } | null>(null);
  const [sceneTransition, setSceneTransition] = useState(false);

  // Persona state
  const [personaId, setPersonaId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nyanquest_persona") ?? "default";
    }
    return "default";
  });
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const currentPersona = getPersona(personaId);

  // Turn extension state
  const [effectiveTotalTurns, setEffectiveTotalTurns] = useState(totalTurns);
  const [turnsExtended, setTurnsExtended] = useState(quest.turns_extended ?? false);

  // 3-panel state
  const turns = useTurns(messages);
  const [currentViewIndex, setCurrentViewIndex] = useState(Math.max(0, turns.length - 1));
  const [inputMode, setInputMode] = useState<InputMode>("choice");

  // Keep view at latest turn when new turns come in or streaming starts
  useEffect(() => {
    if (isStreaming || turns.length > 0) {
      setCurrentViewIndex(turns.length - 1);
    }
  }, [turns.length, isStreaming]);

  const currentTurn = turns[currentViewIndex] ?? null;

  // Auto-switch input mode based on GM suggestions
  const prevSuggestionsLenRef = useRef(suggestions.length);
  useEffect(() => {
    if (suggestions.length >= 2 && prevSuggestionsLenRef.current !== suggestions.length && !pendingDice) {
      setInputMode("choice");
    } else if (suggestions.length === 0 && prevSuggestionsLenRef.current > 0 && inputMode === "choice") {
      setInputMode("short");
    }
    prevSuggestionsLenRef.current = suggestions.length;
  }, [suggestions, pendingDice, inputMode]);

  // Stop BGM when navigating away from the quest page
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);
  const stopAllRef = useRef(bgm.stopAll);
  stopAllRef.current = bgm.stopAll;
  useEffect(() => {
    if (pathname !== initialPathRef.current) {
      stopAllRef.current();
    }
  }, [pathname]);

  // Also stop on browser back/close/tab switch
  useEffect(() => {
    const handleBeforeUnload = () => stopAllRef.current();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopAllRef.current();
    };
  }, []);

  // Show BGM consent prompt on mount (only if not already answered)
  useEffect(() => {
    const answered = localStorage.getItem("nyanquest_bgm_prompted");
    if (!answered && bgm.enabled) {
      const timer = setTimeout(() => setShowBgmPrompt(true), 800);
      return () => clearTimeout(timer);
    }
    if (answered === "yes" && bgm.enabled) {
      const lastGm = [...quest.messages].reverse().find((m) => m.role === "gm");
      if (lastGm) bgmMood.analyzeMessage(lastGm.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BGM consent handlers
  const handleBgmAccept = useCallback(() => {
    bgmPromptAnsweredRef.current = true;
    localStorage.setItem("nyanquest_bgm_prompted", "yes");
    setShowBgmPrompt(false);
    const lastGm = [...messages].reverse().find((m) => m.role === "gm");
    if (lastGm) {
      const mood = bgmMood.detectMood(lastGm.content);
      bgm.playDirect(mood.category, mood.trackId ?? undefined);
    } else {
      bgm.playDirect("explore");
    }
  }, [messages, bgmMood, bgm]);

  const handleBgmDecline = useCallback(() => {
    bgmPromptAnsweredRef.current = true;
    localStorage.setItem("nyanquest_bgm_prompted", "no");
    localStorage.setItem("nyanquest_bgm_enabled", "0");
    setShowBgmPrompt(false);
    bgm.toggle();
  }, [bgm]);

  // Parse dice requests and choices from last GM message
  useEffect(() => {
    const lastGm = [...messages].reverse().find((m) => m.role === "gm");
    if (lastGm && !isStreaming) {
      const request = parseSystemDiceRequest(lastGm.content, system);
      const lines = lastGm.content.split("\n");
      const numbered = lines
        .map((l) => l.trim())
        .filter((l) => /^\d+[\.\)]\s/.test(l))
        .map((l) =>
          l
            .replace(/^\d+[\.\)]\s*/, "")
            .replace(/\*\*/g, "")
            .replace(/\s*\[판정 필요:[^\]]*\]/g, "")
            .trim()
        )
        .filter((l) => l.length > 0 && l.length < 80);
      setSuggestions(numbered.length >= 2 ? numbered : []);
      if (request && numbered.length >= 2) {
        setPendingDice(null);
      } else {
        setPendingDice(request);
      }
    }
  }, [messages, isStreaming, system]);

  // Check for quest completion or failure
  useEffect(() => {
    const lastGm = [...messages].reverse().find((m) => m.role === "gm");
    if (!lastGm) return;
    if (lastGm.content.includes("[퀘스트 실패]") || lastGm.content.includes("[Quest Failed]")) {
      setQuestStatus("failed");
      triggerCutIn("failed");
    } else if (lastGm.content.includes("[퀘스트 완료]") || lastGm.content.includes("[Quest Complete]")) {
      setQuestStatus("completed");
      triggerCutIn("clear");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const sendMessage = useCallback(
    async (playerMessage: string, diceRoll?: DiceRoll) => {
      if (isStreaming || questStatus !== "in_progress") return;

      setSceneTransition(true);
      sounds.playTransition();
      setTimeout(() => setSceneTransition(false), 600);

      const playerMsg: QuestMessage = {
        role: "player",
        content: playerMessage,
        timestamp: new Date().toISOString(),
        ...(diceRoll ? { diceRoll } : {}),
      };
      const updatedMessages = [...messages, playerMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);
      setStreamingText("");
      setPendingDice(null);

      try {
        const response = await fetch("/api/solo-quest/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questId: quest.id,
            scenarioId,
            playerMessage,
            diceRoll,
            messages: messages.slice(-6),
            turnCount,
            locale,
            jobId: typeof sessionStorage !== "undefined" ? sessionStorage.getItem("nq_job") : undefined,
            personaId: personaId !== "default" ? personaId : undefined,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          if (response.status === 400 && err.error) {
            setQuestStatus("completed");
          }
          throw new Error(err.error || tQuest("requestFailed"));
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullText += chunk;
          setStreamingText(fullText);
        }

        const gmMsg: QuestMessage = {
          role: "gm",
          content: fullText,
          timestamp: new Date().toISOString(),
        };
        setMessages([...updatedMessages, gmMsg]);
        setStreamingText("");
        setTurnCount((prev) => prev + 1);
        sounds.playMessage();
        bgmMood.analyzeMessage(fullText);

        // Detect [SCENE: ...] tag for dynamic background change
        const sceneTag = extractSceneTag(fullText);
        if (sceneTag && sceneTag !== lastSceneTagRef.current) {
          lastSceneTagRef.current = sceneTag;
          changeScene(sceneTag);
        }
      } catch (err) {
        toast(
          err instanceof Error ? err.message : tCommon("errorOccurred"),
          "error"
        );
        setMessages(messages);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, questStatus, messages, quest.id, scenarioId, turnCount, toast, tQuest, tCommon, locale, sounds, bgmMood, changeScene, personaId]
  );

  function handleScreenEffect(effect: "critical" | "fumble" | "success" | "fail" | null) {
    if (!effect) return;
    setScreenEffect(effect);
    const duration = effect === "critical" || effect === "fumble" ? 700 : 500;
    setTimeout(() => setScreenEffect(null), duration);
  }

  function triggerCutIn(type: CutInType) {
    setCutIn({ type, key: Date.now() });
    sounds.playCutIn(type);
  }

  function handleDiceRoll(result: DiceRoll) {
    if (result.tier === "partial") {
      sounds.playSuccess(sfxGenre);
    } else if (result.success) {
      sounds.playSuccess(sfxGenre);
    } else if (result.success === false) {
      sounds.playFailure(sfxGenre);
    }

    const diceMsg: QuestMessage = {
      role: "system",
      content: "",
      timestamp: new Date().toISOString(),
      diceRoll: result,
    };
    setMessages((prev) => [...prev, diceMsg]);

    let resultText: string;
    if (system.id === "dungeon-world") {
      const tierLabel = result.tier === "success"
        ? tQuest("diceResultSuccess")
        : result.tier === "partial"
        ? tQuest("diceResultPartial")
        : tQuest("diceResultFail");
      resultText = tQuest("diceRollResultTier", { total: result.total, result: tierLabel });
    } else if (system.id === "insane") {
      resultText = tQuest("diceRollResultTarget", {
        total: result.total,
        target: result.target ?? 0,
        result: result.success ? tQuest("diceResultSuccess") : tQuest("diceResultFail"),
      });
    } else if (system.id === "coc") {
      let extra = "";
      if (result.total <= 5) extra = ` (${tQuest("diceCritical")})`;
      else if (result.total >= 96) extra = ` (${tQuest("diceFumble")})`;
      resultText = tQuest("diceRollResultSkill", {
        total: result.total,
        skillValue: result.skillValue ?? 0,
        result: result.success ? tQuest("diceResultSuccess") : tQuest("diceResultFail"),
      }) + extra;
    } else if (system.id === "vtm") {
      const messy = result.messyCritical ? ` (${tQuest("messyCritical")})` : "";
      resultText = tQuest("diceRollResultPool", {
        pool: result.results?.length ?? 0,
        successes: result.successes ?? 0,
        difficulty: result.difficulty ?? 0,
        result: result.success ? tQuest("diceResultSuccess") : tQuest("diceResultFail"),
      }) + messy;
    } else if (system.id === "bitd") {
      const tierLabel = result.tier === "success"
        ? tQuest("diceResultSuccess")
        : result.tier === "partial"
        ? tQuest("diceResultPartial")
        : tQuest("diceResultFail");
      const critical = result.messyCritical ? ` (${tQuest("diceCriticalBitd")})` : "";
      resultText = tQuest("diceRollResultBitd", {
        pool: result.results?.length ?? 0,
        highest: result.total,
        result: tierLabel,
      }) + critical;
    } else {
      resultText = tQuest("diceRollResult", {
        type: result.type,
        total: result.total,
        dc: result.dc ?? 0,
        result: result.success ? tQuest("diceResultSuccess") : tQuest("diceResultFail"),
      });
    }

    sendMessage(resultText, result);
  }

  async function handleAbandon() {
    bgm.stopAll();
    const supabase = createClient();
    await supabase
      .from("solo_quests")
      .update({ status: "abandoned", updated_at: new Date().toISOString() })
      .eq("id", quest.id);
    router.push("/solo");
  }

  const progressPercent = Math.min((turnCount / effectiveTotalTurns) * 100, 100);
  const remainingTurns = effectiveTotalTurns - turnCount;

  return (
    <div className={`relative -mx-4 -mt-4 h-dvh overflow-hidden bg-linear-to-b ${theme.bgGradient} ${isPremium ? "ring-1 ring-inset ring-amber-500/20" : ""}`}>
      {/* Screen effects layer */}
      {screenEffect === "critical" && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-amber-400/20 animate-critical-flash" />
      )}
      {screenEffect === "fumble" && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-red-500/20 animate-fumble-flash" />
      )}
      {screenEffect === "success" && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-green-500/15 animate-success-glow" />
      )}
      {screenEffect === "fail" && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-red-500/15 animate-fail-glow" />
      )}
      {sceneTransition && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-black animate-scene-transition" />
      )}
      {cutIn && (
        <NaYangCutIn
          key={cutIn.key}
          type={cutIn.type}
          text={tQuest(
            cutIn.type === "dice" ? "cutInDice"
              : cutIn.type === "critical" ? "cutInCritical"
              : cutIn.type === "fumble" ? "cutInFumble"
              : cutIn.type === "clear" ? "cutInClear"
              : "cutInFailed"
          )}
          onComplete={() => setCutIn(null)}
        />
      )}
      {showDiceOverlay && pendingDice && (
        <DiceOverlay
          request={pendingDice}
          system={system}
          onComplete={(result) => {
            setShowDiceOverlay(false);
            handleDiceRoll(result);
          }}
          onRolling={() => sounds.playDiceRoll(sfxGenre)}
          onScreenEffect={handleScreenEffect}
          onCutIn={triggerCutIn}
        />
      )}
      {isPremium && (
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-amber-500/5 via-transparent to-amber-500/5" />
      )}

      {/* BGM consent prompt */}
      {showBgmPrompt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300 w-[min(280px,90vw)]">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-amber-500/30 px-4 py-3 shadow-xl text-center">
            <p className="text-sm text-gray-200 mb-2.5">🎵 {tQuest("bgmPrompt")}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleBgmAccept}
                className="px-4 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                {tQuest("bgmEnable")}
              </button>
              <button
                onClick={handleBgmDecline}
                className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 border border-white/10 rounded-lg transition-colors"
              >
                {tQuest("bgmDisable")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI disclosure notice (AI 기본법 compliance) */}
      {turnCount <= 1 && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-[min(320px,90vw)] animate-in fade-in duration-500">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-white/10">
            <p className="text-[10px] text-gray-300 leading-relaxed">
              🤖 {tQuest("aiDisclosure") ?? "이 콘텐츠는 AI가 생성합니다. GM 나양의 모든 응답은 AI 기반입니다."}
            </p>
          </div>
        </div>
      )}

      {/* ── Full-screen scene background (z-0) ── */}
      <ScenePanel sceneBg={sceneBg} theme={theme} />

      {/* ── All UI overlaid on top of the scene ── */}
      <div className={`relative z-10 h-full max-w-2xl mx-auto flex flex-col pb-14 ${screenEffect === "fumble" ? "animate-screen-shake" : ""}`}>
        {/* ── Header bar ── */}
        <div className="flex items-center justify-between px-3 h-11 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs font-bold truncate text-white drop-shadow-sm">{scenarioTitle}</h1>
            {isPremium && (
              <span className="text-[8px] font-bold text-amber-400 bg-amber-500/20 rounded-full px-1 py-0.5 shrink-0">
                👑
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* BGM toggle + volume */}
            <div className="relative flex items-center">
              <button
                onClick={bgm.toggle}
                className={`text-xs px-1.5 py-1 rounded transition-colors ${
                  bgm.enabled ? "text-amber-400 hover:text-amber-300" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {bgm.enabled ? "♫" : "♪"}
              </button>
              {bgm.enabled && (
                <button
                  onClick={() => setShowBgmVolume((v) => !v)}
                  className="text-[10px] text-gray-300 hover:text-gray-100 transition-colors"
                >
                  ▾
                </button>
              )}
              {showBgmVolume && bgm.enabled && (
                <div className="absolute top-full right-0 mt-1 bg-gray-900/95 backdrop-blur-sm rounded-lg p-2 z-50 border border-white/10">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(bgm.volume * 100)}
                    onChange={(e) => bgm.setVolume(Number(e.target.value) / 100)}
                    className="w-24 h-1 accent-amber-400"
                  />
                </div>
              )}
            </div>
            {/* Persona toggle */}
            {questStatus === "in_progress" && (
              <button
                onClick={() => setShowPersonaSelector(true)}
                className={`text-xs px-1.5 py-1 rounded transition-colors ${currentPersona.accentColor} hover:opacity-80`}
                title={locale === "en" ? "Change GM Persona" : "GM 페르소나 변경"}
              >
                {currentPersona.emoji}
              </button>
            )}
            {/* SFX toggle */}
            <button
              onClick={sounds.toggle}
              className="text-xs px-1.5 py-1 rounded text-gray-300 hover:text-white transition-colors"
            >
              {sounds.enabled ? "🔊" : "🔇"}
            </button>
            {questStatus === "in_progress" && (
              <button
                onClick={handleAbandon}
                className="text-[10px] text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-950/30"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Turn progress bar */}
        <div className="h-1 bg-white/15 shrink-0 mx-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-amber-400 to-orange-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Turn extension banner */}
        {questStatus === "in_progress" && (
          <TurnExtendBanner
            questId={quest.id}
            remainingTurns={remainingTurns}
            isPremium={isPremium}
            turnsExtended={turnsExtended}
            theme={theme}
            onExtended={(newTotal) => {
              setEffectiveTotalTurns(newTotal);
              setTurnsExtended(true);
            }}
          />
        )}

        {/* ── GM Panel (top, capped height) ── */}
        <div className="shrink-0 max-h-[35vh] overflow-hidden mx-2 mt-1.5 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
          <GmPanel
            currentTurn={currentTurn}
            isStreaming={isStreaming}
            streamingText={streamingText}
            theme={theme}
            currentViewIndex={currentViewIndex}
            totalTurns={turns.length}
            onNavigateTurn={setCurrentViewIndex}
          />
        </div>

        {/* ── Spacer: background scene visible here ── */}
        <div className="flex-1 min-h-0" />

        {/* ── Bottom Panel: Player Input / Dice / QuestComplete ── */}
        <div className="shrink-0 mx-2 mb-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 overflow-hidden">
          {(questStatus === "completed" || questStatus === "failed") ? (
            <div className="px-3 py-2 max-h-[40vh] overflow-y-auto">
              <QuestComplete
                questId={quest.id}
                scenarioId={scenarioId}
                scenarioTitle={scenarioTitle}
                turnCount={turnCount}
                isPremium={isPremium}
                isFailed={questStatus === "failed"}
                alreadyClaimedExp={quest.exp_earned}
                onShare={() => setShowShareCard(true)}
                onRewind={questStatus === "failed" ? () => {
                  // Rewind: remove last GM failure message and last player message
                  const rewound = [...messages];
                  // Remove from end until we find a player message, then remove that too
                  while (rewound.length > 1 && rewound[rewound.length - 1].role === "gm") {
                    rewound.pop();
                  }
                  if (rewound.length > 1 && rewound[rewound.length - 1].role === "player") {
                    rewound.pop();
                  }
                  setMessages(rewound);
                  setTurnCount(Math.max(0, turnCount - 1));
                  setQuestStatus("in_progress");
                  setSuggestions([]);
                } : undefined}
              />
            </div>
          ) : pendingDice && !isStreaming ? (
            <div className="px-3 py-3">
              <DiceRoller
                request={pendingDice}
                system={system}
                onTrigger={() => setShowDiceOverlay(true)}
              />
            </div>
          ) : (
            <PlayerPanel
              onSend={(msg) => sendMessage(msg)}
              disabled={isStreaming}
              suggestions={suggestions}
              theme={theme}
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              previousTurn={currentViewIndex > 0 ? turns[currentViewIndex] : null}
            />
          )}
        </div>
      </div>

      {/* Persona Selector Modal */}
      {showPersonaSelector && (
        <PersonaSelector
          selectedId={personaId}
          isPremium={isPremium}
          onSelect={(persona) => {
            setPersonaId(persona.id);
            localStorage.setItem("nyanquest_persona", persona.id);
            setShowPersonaSelector(false);
          }}
          onClose={() => setShowPersonaSelector(false)}
        />
      )}

      {/* Session Share Card Modal */}
      {showShareCard && (
        <SessionShareCard
          scenarioTitle={scenarioTitle}
          scenarioEmoji={scenarioEmoji}
          genre={genre ?? "Fantasy"}
          turnCount={turnCount}
          isFailed={questStatus === "failed"}
          messages={messages}
          expEarned={quest.exp_earned}
          personaName={currentPersona.id !== "default" ? (locale === "en" ? currentPersona.nameEn : currentPersona.name) : undefined}
          personaEmoji={currentPersona.id !== "default" ? currentPersona.emoji : undefined}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}
