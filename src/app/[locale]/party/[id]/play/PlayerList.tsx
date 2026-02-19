"use client";

import type { PartyMember } from "@/types/database";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface Props {
  members: PartyMember[];
  currentUserId: string;
  turnOrder: string[];
  currentTurnIndex: number;
  playMode: "realtime" | "async";
  useAiGm: boolean;
}

export default function PlayerList({
  members,
  currentUserId,
  turnOrder,
  currentTurnIndex,
  playMode,
  useAiGm,
}: Props) {
  const t = useTranslations("PartyPlay");
  const tc = useTranslations("Common");
  const currentTurnUserId = turnOrder[currentTurnIndex] ?? null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {/* AI GM indicator */}
      {useAiGm && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg ring-2 ring-amber-400">
            🧙‍♂️
          </div>
          <span className="text-[10px] text-amber-600 font-medium">{t("nayangGm")}</span>
        </div>
      )}

      {/* Players */}
      {members
        .filter((m) => m.role === "PL")
        .map((m) => {
          const isCurrentTurn =
            playMode === "async" && currentTurnUserId === m.user_id;
          const isMe = m.user_id === currentUserId;

          return (
            <div
              key={m.id}
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm relative
                  ${isCurrentTurn ? "ring-2 ring-green-400 ring-offset-1" : ""}
                  ${isMe ? "bg-amber-200" : "bg-gray-100"}
                `}
              >
                {m.user?.avatar_url ? (
                  <Image
                    src={m.user.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  "🐱"
                )}
                {isCurrentTurn && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium truncate max-w-[52px] ${
                  isMe ? "text-amber-700" : "text-gray-500"
                }`}
              >
                {m.user?.nickname ?? tc("adventurer")}
              </span>
            </div>
          );
        })}

      {/* Human GM */}
      {!useAiGm &&
        members
          .filter((m) => m.role === "GM")
          .map((m) => (
            <div
              key={m.id}
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm ring-2 ring-purple-300">
                {m.user?.avatar_url ? (
                  <Image
                    src={m.user.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  "🧙"
                )}
              </div>
              <span className="text-[10px] text-purple-600 font-medium truncate max-w-[52px]">
                {m.user?.nickname ?? "GM"}
              </span>
            </div>
          ))}
    </div>
  );
}
