import { useMemo } from "react";
import type { QuestMessage } from "@/types/solo-quest";

export interface Turn {
  index: number;
  gmMessage: QuestMessage | null;
  playerMessage: QuestMessage | null;
  systemMessage: QuestMessage | null;
}

/**
 * Parse a flat QuestMessage[] array into structured Turn[] for navigation.
 *
 * Turn structure:
 *   Turn 0: Opening GM message only (no player action)
 *   Turn N (N>=1): player → optional system (dice) → GM response
 *   Incomplete turn (streaming): has player/system but no GM yet
 */
export function useTurns(messages: QuestMessage[]): Turn[] {
  return useMemo(() => {
    const turns: Turn[] = [];
    let current: Partial<Turn> = { index: 0, playerMessage: null, systemMessage: null, gmMessage: null };

    for (const msg of messages) {
      if (msg.role === "gm") {
        current.gmMessage = msg;
        turns.push(current as Turn);
        current = {
          index: turns.length,
          playerMessage: null,
          systemMessage: null,
          gmMessage: null,
        };
      } else if (msg.role === "player") {
        current.playerMessage = msg;
      } else if (msg.role === "system") {
        current.systemMessage = msg;
      }
    }

    // If there's a pending player/system message without GM response yet (during streaming)
    if (current.playerMessage || current.systemMessage) {
      turns.push(current as Turn);
    }

    return turns;
  }, [messages]);
}
