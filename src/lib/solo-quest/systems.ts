import type { DiceType } from "@/types/solo-quest";

export type TrpgSystemId = "dnd5e" | "insane" | "coc" | "dungeon-world";

export interface TrpgSystemPreset {
  id: TrpgSystemId;
  name: string;
  nameEn: string;
  emoji: string;
  diceNotation: string;
  defaultDice: DiceType;
  diceCount: number;
  hasModifier: boolean;
  judgmentType: "dc" | "tier" | "target";
  promptRules: string;
  parsePattern: RegExp;
}

export const SYSTEMS: Record<TrpgSystemId, TrpgSystemPreset> = {
  dnd5e: {
    id: "dnd5e",
    name: "D&D 5e",
    nameEn: "D&D 5e",
    emoji: "🐉",
    diceNotation: "d20",
    defaultDice: "d20",
    diceCount: 1,
    hasModifier: true,
    judgmentType: "dc",
    promptRules: `- 판정은 d20+수정치로, 합계가 DC 이상이면 성공이다.
- 판정 요청 형식: [판정 필요: d20+수정치, DC 난이도 (능력치)]
  예: [판정 필요: d20+2, DC 12 (민첩)]
- 수정치는 보통 -1 ~ +5 범위, DC는 10~20 범위.`,
    parsePattern:
      /\[판정 필요:\s*(d\d+)(?:\+(\d+))?,\s*DC\s*(\d+)(?:\s*\(([^)]+)\))?\]/,
  },
  insane: {
    id: "insane",
    name: "인세인",
    nameEn: "Insane",
    emoji: "🎭",
    diceNotation: "2d6",
    defaultDice: "d6",
    diceCount: 2,
    hasModifier: false,
    judgmentType: "target",
    promptRules: `- 이 시나리오는 인세인(Insane) TRPG 시스템이다.
- 판정은 2d6으로, 합계가 목표치 이하면 성공이다.
- 판정 요청 형식: [판정 필요: 2d6, 목표치 N (능력명)]
  예: [판정 필요: 2d6, 목표치 8 (조사)]
- 목표치는 보통 5~10 범위.
- 호기심과 공포 시스템을 적극 활용해. 플레이어에게 비밀을 조금씩 공개하고, 광기와 긴장감을 묘사해.
- "비밀"이 드러날 때는 극적으로 연출해.
- 선택지를 제시할 때 호기심을 자극하는 것과 안전한 것을 섞어.`,
    parsePattern:
      /\[판정 필요:\s*2d6,\s*목표치\s*(\d+)(?:\s*\(([^)]+)\))?\]/,
  },
  coc: {
    id: "coc",
    name: "크툴루의 부름",
    nameEn: "Call of Cthulhu",
    emoji: "🐙",
    diceNotation: "d100",
    defaultDice: "d100",
    diceCount: 1,
    hasModifier: false,
    judgmentType: "target",
    promptRules: `- 이 시나리오는 크툴루의 부름(Call of Cthulhu) TRPG 시스템이다.
- 판정은 d100(퍼센트 주사위)으로, 기능치 이하면 성공이다.
- 판정 요청 형식: [판정 필요: d100, 기능치 N (기능명)]
  예: [판정 필요: d100, 기능치 65 (도서관 이용)]
- 기능치는 보통 20~80 범위.
- 01~05: 크리티컬 (대성공), 96~00: 펌블 (대실패).
- 정신력(SAN) 감소를 상황에 맞게 묘사해. 공포스러운 존재를 목격하면 SAN 체크 요청.
- 분위기는 서서히 조여오는 공포. 직접적 전투보다 조사와 추리 위주.
- 인간은 나약하다. 무리한 행동은 위험하다는 걸 느끼게 해.`,
    parsePattern:
      /\[판정 필요:\s*d100,\s*기능치\s*(\d+)(?:\s*\(([^)]+)\))?\]/,
  },
  "dungeon-world": {
    id: "dungeon-world",
    name: "던전월드",
    nameEn: "Dungeon World",
    emoji: "⚔️",
    diceNotation: "2d6",
    defaultDice: "d6",
    diceCount: 2,
    hasModifier: true,
    judgmentType: "tier",
    promptRules: `- 이 시나리오는 던전월드(Dungeon World) / PbtA 시스템이다.
- 판정은 2d6+수정치로:
  - 10 이상: 완전 성공 (원하는 대로 됨)
  - 7~9: 부분 성공 (성공하지만 대가나 어려운 선택이 따름)
  - 6 이하: 실패 (GM이 상황을 악화시킴, 하지만 경험치 획득)
- 판정 요청 형식: [판정 필요: 2d6+수정치 (무브명)]
  예: [판정 필요: 2d6+1 (기민하게 행동하기)]
- 수정치는 보통 -1 ~ +3 범위.
- 부분 성공(7-9)이 이 시스템의 핵심. 항상 재미있는 대가를 제시해.
- "무브"를 활용해: 근접 전투, 원거리 공격, 기민하게 행동하기, 간파하기, 탐문하기, 도움/방해, 위험 감수 등.
- 플레이어의 행동에 "무브가 발동되었다"는 느낌으로 판정을 요청해.`,
    parsePattern:
      /\[판정 필요:\s*2d6(?:\+(\d+))?(?:\s*\(([^)]+)\))?\]/,
  },
};

export function getSystem(systemId?: TrpgSystemId): TrpgSystemPreset {
  return SYSTEMS[systemId ?? "dnd5e"];
}
