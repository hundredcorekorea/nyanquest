import type { DiceType } from "@/types/solo-quest";

export type TrpgSystemId = "dnd5e" | "insane" | "coc" | "dungeon-world" | "vtm" | "bitd";

export interface TrpgSystemPreset {
  id: TrpgSystemId;
  name: string;
  nameEn: string;
  emoji: string;
  diceNotation: string;
  defaultDice: DiceType;
  diceCount: number;
  hasModifier: boolean;
  judgmentType: "dc" | "tier" | "target" | "pool-count" | "pool-highest";
  promptRules: string;
  promptRulesEn: string;
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
    promptRulesEn: `- Checks use d20 + modifier. Total >= DC means success.
- Dice request format (MUST use this exact Korean tag): [판정 필요: d20+modifier, DC difficulty (ability)]
  Example: [판정 필요: d20+2, DC 12 (Dexterity)]
- Modifiers range from -1 to +5, DC ranges from 10 to 20.`,
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
    promptRulesEn: `- This scenario uses the Insane TRPG system.
- Checks use 2d6. Total <= target number means success.
- Dice request format (MUST use this exact Korean tag): [판정 필요: 2d6, 목표치 N (ability)]
  Example: [판정 필요: 2d6, 목표치 8 (Investigation)]
- Target numbers range from 5 to 10.
- Actively use the curiosity and fear system. Reveal secrets to the player bit by bit, depicting madness and tension.
- When a "secret" is revealed, make it dramatic.
- Mix curiosity-inducing and safe options in your choices.`,
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
    promptRulesEn: `- This scenario uses the Call of Cthulhu TRPG system.
- Checks use d100 (percentile dice). Rolling <= skill value means success.
- Dice request format (MUST use this exact Korean tag): [판정 필요: d100, 기능치 N (skill)]
  Example: [판정 필요: d100, 기능치 65 (Library Use)]
- Skill values range from 20 to 80.
- 01-05: Critical (great success), 96-00: Fumble (catastrophic failure).
- Describe Sanity (SAN) loss when appropriate. Request a SAN check when witnessing horrifying entities.
- Atmosphere is creeping, slow-building dread. Focus on investigation and deduction over direct combat.
- Humans are fragile. Make the player feel that reckless actions carry real danger.`,
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
    promptRulesEn: `- This scenario uses the Dungeon World / PbtA system.
- Checks use 2d6 + modifier:
  - 10+: Full success (you get what you want)
  - 7-9: Partial success (you succeed, but with a cost or hard choice)
  - 6 or less: Failure (GM makes things worse, but you gain experience)
- Dice request format (MUST use this exact Korean tag): [판정 필요: 2d6+modifier (move name)]
  Example: [판정 필요: 2d6+1 (Defy Danger)]
- Modifiers range from -1 to +3.
- Partial success (7-9) is the heart of this system. Always present interesting costs.
- Use "Moves": Hack and Slash, Volley, Defy Danger, Discern Realities, Parley, Aid/Interfere, etc.
- When the player acts, frame the dice request as "a Move being triggered."`,
    parsePattern:
      /\[판정 필요:\s*2d6(?:\+(\d+))?(?:\s*\(([^)]+)\))?\]/,
  },
  vtm: {
    id: "vtm",
    name: "뱀파이어 더 마스커레이드",
    nameEn: "Vampire: The Masquerade",
    emoji: "🧛",
    diceNotation: "Nd10",
    defaultDice: "d10",
    diceCount: 5, // default pool size, actual varies per check
    hasModifier: false,
    judgmentType: "pool-count",
    promptRules: `- 이 시나리오는 뱀파이어 더 마스커레이드(Vampire: The Masquerade V5) 시스템이다.
- 판정은 다이스 풀 방식이다: Nd10을 굴려서, 6 이상이 나온 주사위 수가 "성공 수".
- 필요한 성공 수(난이도)를 충족하면 성공, 미달이면 실패.
- 판정 요청 형식: [판정 필요: Nd10, 난이도 M (능력명)]
  예: [판정 필요: 5d10, 난이도 3 (위협)]
- N은 보통 3~8 범위 (능력치+기술 합산), 난이도 M은 보통 1~5 범위.
- 10이 나오면 크리티컬 다이스. 10이 2개 이상이면 "메스 크리티컬" (대성공, +2 추가 성공).
- 뱀파이어의 "야수(Beast)"를 묘사해. 분노나 공포 상황에서 야수가 깨어나는 느낌.
- "가면무도회(Masquerade)" 규칙을 강조해. 인간들 앞에서 뱀파이어 능력을 드러내면 안 됨.
- "배고픔 주사위(Hunger Dice)"는 간소화해서, 실패 시 가끔 "배고픔이 고개를 든다" 정도로 묘사.
- 분위기는 어둡고 정치적인 고딕 호러. 물리적 전투보다 사회적 조종과 내면의 갈등 위주.`,
    promptRulesEn: `- This scenario uses the Vampire: The Masquerade V5 system.
- Checks use a dice pool: roll Nd10, count dice showing 6+ as "successes."
- Meeting the required successes (difficulty) means success; falling short means failure.
- Dice request format (MUST use this exact Korean tag): [판정 필요: Nd10, 난이도 M (ability)]
  Example: [판정 필요: 5d10, 난이도 3 (Intimidation)]
- N typically ranges 3-8 (attribute + skill), difficulty M ranges 1-5.
- Rolling a 10 is a critical die. Two or more 10s = "Messy Critical" (great success, +2 bonus successes).
- Portray the vampire's "Beast." In moments of rage or fear, describe the Beast stirring within.
- Emphasize the "Masquerade" rule. The vampire must never reveal supernatural abilities in front of mortals.
- Simplify "Hunger Dice" — on failure, occasionally describe "the Hunger rising" or similar.
- Atmosphere is dark, political gothic horror. Focus on social manipulation and inner conflict over physical combat.`,
    parsePattern:
      /\[판정 필요:\s*(\d+)d10,\s*난이도\s*(\d+)(?:\s*\(([^)]+)\))?\]/,
  },
  bitd: {
    id: "bitd",
    name: "블레이즈 인 더 다크",
    nameEn: "Blades in the Dark",
    emoji: "🗡️",
    diceNotation: "Nd6",
    defaultDice: "d6",
    diceCount: 3, // default pool size, actual varies
    hasModifier: false,
    judgmentType: "pool-highest",
    promptRules: `- 이 시나리오는 블레이즈 인 더 다크(Blades in the Dark) 시스템이다.
- 판정은 다이스 풀 방식이다: Nd6을 굴려서 가장 높은 눈을 기준으로 판정한다.
  - 6: 완전 성공 (원하는 대로 됨)
  - 4~5: 부분 성공 (해내지만 대가/합병증이 따름)
  - 1~3: 실패 (상황이 나빠지며 위험에 처함)
  - 6이 2개 이상: 크리티컬 (대성공! 추가 이득)
- 판정 요청 형식: [판정 필요: Nd6 (행동명)]
  예: [판정 필요: 3d6 (은밀)]
- N은 보통 1~4 범위. 0다이스면 2d6 중 낮은 걸 선택 (불리 판정).
- "스트레스(Stress)"를 추적해. 위험한 행동이나 저항할 때 스트레스 증가.
  스트레스가 9 이상이면 "트라우마" 경고.
- "위치(Position)"와 "효과(Effect)" 개념을 활용해:
  - 위치: 통제됨(Controlled), 위험(Risky), 절박(Desperate)
  - 효과: 위대함(Great), 표준(Standard), 제한적(Limited)
  - 위치가 절박할수록 실패 시 결과가 가혹하지만, 보상도 큼.
- 분위기는 가스등이 깜빡이는 산업혁명 고딕 도시. 범죄 조직의 활동.
- 플레이어는 "스커바"(도적단)의 일원. 임무(Score) 수행이 핵심.
- "플래시백" 시스템: 플레이어가 "사실은 미리 준비했었어"라고 하면, 과거 장면을 삽입해 준비 판정 가능.`,
    promptRulesEn: `- This scenario uses the Blades in the Dark system.
- Checks use a dice pool: roll Nd6 and judge by the highest die.
  - 6: Full success (you get what you want)
  - 4-5: Partial success (you do it, but with a cost or complication)
  - 1-3: Failure (things go badly, you're in danger)
  - Two or more 6s: Critical (great success! Extra benefit)
- Dice request format (MUST use this exact Korean tag): [판정 필요: Nd6 (action)]
  Example: [판정 필요: 3d6 (Prowl)]
- N typically ranges 1-4. Zero dice = roll 2d6 and take the lowest (disadvantage).
- Track "Stress." Stress increases from risky actions and resistance rolls. Warn of "Trauma" at 9+ stress.
- Use "Position" and "Effect" concepts:
  - Position: Controlled, Risky, Desperate
  - Effect: Great, Standard, Limited
  - More desperate positions mean harsher failure consequences, but greater rewards.
- Atmosphere is gaslit industrial gothic city. Criminal underworld activity.
- The player is a member of a "Crew" (gang of scoundrels). Running Scores is the core activity.
- "Flashback" system: If a player says "Actually, I prepared for this beforehand," insert a past scene and allow a setup roll.`,
    parsePattern:
      /\[판정 필요:\s*(\d+)d6(?:\s*\(([^)]+)\))?\]/,
  },
};

export function getSystem(systemId?: TrpgSystemId): TrpgSystemPreset {
  return SYSTEMS[systemId ?? "dnd5e"];
}
