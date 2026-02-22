import type { DiceType, DiceRoll } from "@/types/solo-quest";
import type { TrpgSystemPreset } from "./systems";

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

export function rollMultiDice(
  type: DiceType,
  count: number,
  modifier: number = 0
): { results: number[]; total: number } {
  const max = DICE_MAX[type];
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * max) + 1);
  }
  const sum = results.reduce((a, b) => a + b, 0);
  return { results, total: sum + modifier };
}

export function judgeRoll(
  system: TrpgSystemPreset,
  total: number,
  targetValue: number
): { success: boolean; tier?: "success" | "partial" | "fail" } {
  switch (system.judgmentType) {
    case "dc":
      return { success: total >= targetValue };
    case "target":
      return { success: total <= targetValue };
    case "tier": {
      if (total >= 10) return { success: true, tier: "success" };
      if (total >= 7) return { success: true, tier: "partial" };
      return { success: false, tier: "fail" };
    }
  }
}

export interface ParsedDiceRequest {
  diceType: DiceType;
  diceCount: number;
  modifier: number;
  dc: number;
  target: number;
  skillValue: number;
  label: string;
  systemId: string;
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
    diceCount: 1,
    modifier: match[2] ? parseInt(match[2]) : 0,
    dc: parseInt(match[3]),
    target: 0,
    skillValue: 0,
    label: match[4] ?? "판정",
    systemId: "dnd5e",
  };
}

export function parseSystemDiceRequest(
  text: string,
  system: TrpgSystemPreset
): ParsedDiceRequest | null {
  const match = text.match(system.parsePattern);
  if (!match) return null;

  switch (system.id) {
    case "dnd5e":
      return {
        diceType: match[1] as DiceType,
        diceCount: 1,
        modifier: match[2] ? parseInt(match[2]) : 0,
        dc: parseInt(match[3]),
        target: 0,
        skillValue: 0,
        label: match[4] ?? "판정",
        systemId: "dnd5e",
      };

    case "insane":
      return {
        diceType: "d6",
        diceCount: 2,
        modifier: 0,
        dc: 0,
        target: parseInt(match[1]),
        skillValue: 0,
        label: match[2] ?? "판정",
        systemId: "insane",
      };

    case "coc":
      return {
        diceType: "d100",
        diceCount: 1,
        modifier: 0,
        dc: 0,
        target: 0,
        skillValue: parseInt(match[1]),
        label: match[2] ?? "판정",
        systemId: "coc",
      };

    case "dungeon-world":
      return {
        diceType: "d6",
        diceCount: 2,
        modifier: match[1] ? parseInt(match[1]) : 0,
        dc: 0,
        target: 0,
        skillValue: 0,
        label: match[2] ?? "판정",
        systemId: "dungeon-world",
      };

    default:
      return null;
  }
}

export function rollSystemDice(
  request: ParsedDiceRequest,
  system: TrpgSystemPreset
): DiceRoll {
  if (system.diceCount > 1) {
    const { results, total } = rollMultiDice(
      request.diceType,
      request.diceCount,
      request.modifier
    );
    const targetValue =
      request.dc || request.target || request.skillValue || 0;
    const judgment =
      targetValue > 0 || system.judgmentType === "tier"
        ? judgeRoll(system, total, targetValue)
        : { success: undefined, tier: undefined };

    return {
      type: request.diceType,
      result: results.reduce((a, b) => a + b, 0),
      results,
      modifier: request.modifier || undefined,
      total,
      dc: request.dc || undefined,
      target: request.target || undefined,
      skillValue: request.skillValue || undefined,
      success: judgment.success,
      tier: judgment.tier,
    };
  }

  // Single die (d20, d100)
  const diceResult = rollDice(request.diceType, request.modifier);
  const targetValue =
    request.dc || request.target || request.skillValue || 0;
  const judgment =
    targetValue > 0
      ? judgeRoll(system, diceResult.total, targetValue)
      : { success: undefined, tier: undefined };

  return {
    ...diceResult,
    dc: request.dc || undefined,
    target: request.target || undefined,
    skillValue: request.skillValue || undefined,
    success: judgment.success,
    tier: judgment.tier,
  };
}
