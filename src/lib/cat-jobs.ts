/**
 * Cat Job/Class System — Unlockable starting archetypes
 *
 * Each job modifies the AI system prompt to give a completely different play feel.
 * Unlocked based on cumulative EXP.
 */

export interface CatJob {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  descriptionEn: string;
  unlockExp: number; // 0 = always available
  /** System prompt prefix injected before the scenario prompt */
  promptPrefix: string;
  promptPrefixEn: string;
  color: string; // tailwind color for UI
}

export const CAT_JOBS: CatJob[] = [
  {
    id: "warrior",
    name: "전사 냥이",
    nameEn: "Warrior Cat",
    emoji: "⚔️",
    description: "기본 직업. 용감하게 정면 돌파!",
    descriptionEn: "Default class. Charge in bravely!",
    unlockExp: 0,
    promptPrefix:
      "플레이어는 '전사 냥이'로 플레이합니다. 전투적이고 용감한 성격으로, 물리적 행동과 직접적 해결책을 선호합니다. 전투 장면을 역동적으로 묘사하세요.",
    promptPrefixEn:
      "The player is playing as a 'Warrior Cat'. They are brave and combat-oriented, preferring physical actions and direct solutions. Describe combat scenes dynamically.",
    color: "text-red-500",
  },
  {
    id: "mage",
    name: "마법사 냥이",
    nameEn: "Mage Cat",
    emoji: "🔮",
    description: "마법으로 모든 문제를 해결하는 신비한 냥이",
    descriptionEn: "Mysterious cat who solves everything with magic",
    unlockExp: 100,
    promptPrefix:
      "플레이어는 '마법사 냥이'로 플레이합니다. 모든 문제를 마법으로 해결하려 합니다. 마법 주문, 신비한 현상, 마력 소모 등을 묘사에 포함하세요. 가끔 마법이 예상치 못한 부작용을 일으키게 하세요.",
    promptPrefixEn:
      "The player is playing as a 'Mage Cat'. They attempt to solve everything with magic. Include spell casting, mystical phenomena, and mana costs in descriptions. Occasionally have magic cause unexpected side effects.",
    color: "text-purple-500",
  },
  {
    id: "thief",
    name: "도적 냥이",
    nameEn: "Thief Cat",
    emoji: "🗡️",
    description: "은밀하게 움직이는 그림자의 냥이",
    descriptionEn: "A cat of shadows who moves in stealth",
    unlockExp: 200,
    promptPrefix:
      "플레이어는 '도적 냥이'로 플레이합니다. 은밀, 잠입, 함정 해제, 암살 등 은밀한 접근을 선호합니다. 어둠과 그림자 묘사를 활용하고, 직접 전투보다 기습과 회피를 제안하세요.",
    promptPrefixEn:
      "The player is playing as a 'Thief Cat'. They prefer stealthy approaches — infiltration, trap disarming, and ambush. Use shadow and darkness descriptions, suggest surprise attacks and evasion over direct combat.",
    color: "text-gray-600",
  },
  {
    id: "healer",
    name: "치유사 냥이",
    nameEn: "Healer Cat",
    emoji: "💚",
    description: "상처를 치유하고 동료를 지키는 수호 냥이",
    descriptionEn: "Guardian cat who heals wounds and protects allies",
    unlockExp: 350,
    promptPrefix:
      "플레이어는 '치유사 냥이'로 플레이합니다. 치유 마법과 보호 주문을 사용합니다. NPC들과의 대화와 외교적 해결을 우선하고, 전투 시에는 동료 NPC를 치유하거나 보호하는 역할을 묘사하세요.",
    promptPrefixEn:
      "The player is playing as a 'Healer Cat'. They use healing magic and protective spells. Prioritize dialogue and diplomatic resolutions with NPCs, and during combat, describe healing and protecting ally NPCs.",
    color: "text-green-500",
  },
  {
    id: "bard",
    name: "음유시인 냥이",
    nameEn: "Bard Cat",
    emoji: "🎵",
    description: "노래와 이야기로 운명을 바꾸는 냥이",
    descriptionEn: "A cat who changes fate with songs and tales",
    unlockExp: 500,
    promptPrefix:
      "플레이어는 '음유시인 냥이'로 플레이합니다. 노래, 연주, 이야기로 상황을 해결합니다. 대사에 시적 표현과 운율을 넣고, 매력과 설득으로 적까지 감화시키는 장면을 연출하세요. 가끔 즉석에서 노래 가사를 지어 불러보세요.",
    promptPrefixEn:
      "The player is playing as a 'Bard Cat'. They resolve situations with songs, music, and storytelling. Use poetic expressions and rhymes in dialogue, create scenes where charm and persuasion move even enemies. Occasionally compose spontaneous song lyrics.",
    color: "text-amber-500",
  },
  {
    id: "necromancer",
    name: "강령술사 냥이",
    nameEn: "Necromancer Cat",
    emoji: "💀",
    description: "어둠의 힘을 다루는 금지된 마법의 냥이",
    descriptionEn: "A forbidden cat who wields the power of darkness",
    unlockExp: 800,
    promptPrefix:
      "플레이어는 '강령술사 냥이'로 플레이합니다. 사령술, 저주, 언데드 소환 등 어둠의 마법을 사용합니다. 으스스한 분위기와 도덕적 딜레마를 자주 제시하세요. NPC들이 플레이어를 두려워하거나 경계하는 반응을 보이게 하세요.",
    promptPrefixEn:
      "The player is playing as a 'Necromancer Cat'. They use dark magic — necromancy, curses, undead summoning. Create eerie atmospheres and moral dilemmas frequently. Have NPCs react with fear or caution toward the player.",
    color: "text-violet-600",
  },
  {
    id: "merchant",
    name: "상인 냥이",
    nameEn: "Merchant Cat",
    emoji: "💰",
    description: "금화와 협상으로 세계를 정복하는 냥이",
    descriptionEn: "A cat who conquers the world with gold and deals",
    unlockExp: 1200,
    promptPrefix:
      "플레이어는 '상인 냥이'로 플레이합니다. 모든 상황을 거래와 협상으로 해결하려 합니다. 금전적 보상, 아이템 거래, 정보 매매 등의 요소를 추가하세요. 전투 대신 뇌물이나 고용으로 해결하는 선택지를 제공하세요.",
    promptPrefixEn:
      "The player is playing as a 'Merchant Cat'. They try to resolve everything through trades and negotiations. Add monetary rewards, item trades, information deals. Offer bribery or hiring as alternatives to combat.",
    color: "text-yellow-600",
  },
];

/**
 * Get all jobs the user has unlocked based on their EXP.
 */
export function getUnlockedJobs(exp: number): CatJob[] {
  return CAT_JOBS.filter((job) => exp >= job.unlockExp);
}

/**
 * Get the next job to unlock (or null if all unlocked).
 */
export function getNextJobUnlock(exp: number): CatJob | null {
  return CAT_JOBS.find((job) => exp < job.unlockExp) ?? null;
}

/**
 * Get a specific job by ID.
 */
export function getJob(jobId: string): CatJob | undefined {
  return CAT_JOBS.find((j) => j.id === jobId);
}
