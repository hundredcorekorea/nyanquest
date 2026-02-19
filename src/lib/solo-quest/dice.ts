import type { DiceType, DiceRoll } from "@/types/solo-quest";

const DICE_MAX: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export function rollDice(
  type: DiceType,
  modifier: number = 0,
  dc?: number
): DiceRoll {
  const max = DICE_MAX[type];
  const result = Math.floor(Math.random() * max) + 1;
  const total = result + modifier;

  return {
    type,
    result,
    modifier: modifier || undefined,
    total,
    dc,
    success: dc !== undefined ? total >= dc : undefined,
  };
}

export interface ParsedDiceRequest {
  diceType: DiceType;
  modifier: number;
  dc: number;
  label: string;
}

/**
 * Parse GM's dice request from message text.
 * Pattern: [판정 필요: d20+2, DC 12 (민첩)]
 */
export function parseDiceRequest(text: string): ParsedDiceRequest | null {
  const match = text.match(
    /\[판정 필요:\s*(d\d+)(?:\+(\d+))?,\s*DC\s*(\d+)(?:\s*\(([^)]+)\))?\]/
  );
  if (!match) return null;

  return {
    diceType: match[1] as DiceType,
    modifier: match[2] ? parseInt(match[2]) : 0,
    dc: parseInt(match[3]),
    label: match[4] ?? "판정",
  };
}
