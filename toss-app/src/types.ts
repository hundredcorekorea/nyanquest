// --- Profile ---
export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  cat_type: string;
  cat_exp: number;
  style_tags: string[];
  manner_temp: number;
  active_title: string | null;
  preferred_elements: string[];
  avoided_elements: string[];
  created_at: string;
  updated_at: string;
}

// --- Solo Quest ---
export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface DiceRoll {
  type: DiceType;
  result: number;
  results?: number[];
  modifier?: number;
  total: number;
  dc?: number;
  target?: number;
  skillValue?: number;
  success?: boolean;
  tier?: "success" | "partial" | "fail";
  successes?: number;
  difficulty?: number;
  messyCritical?: boolean;
}

export interface QuestMessage {
  role: "gm" | "player" | "system";
  content: string;
  timestamp: string;
  diceRoll?: DiceRoll;
}

export interface ScenarioTheme {
  bgGradient: string;
  accentColor: string;
  bubbleColor: string;
}

export interface Scenario {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionEn: string;
  thumbnailEmoji: string;
  difficulty: "easy" | "normal" | "hard";
  estimatedTurns: number;
  genre: string;
  genreEn: string;
  openingMessage: string;
  openingMessageEn?: string;
  suggestedActions: string[];
  suggestedActionsEn?: string[];
  isPremium?: boolean;
  theme: ScenarioTheme;
}

export interface SoloQuest {
  id: string;
  user_id: string;
  scenario_id: string;
  status: "in_progress" | "completed" | "failed" | "abandoned";
  messages: QuestMessage[];
  turn_count: number;
  total_turns: number;
  turns_extended?: boolean;
  exp_earned: number;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

// --- Party / Multiplayer ---
export interface Party {
  id: string;
  creator_id: string;
  gm_id: string | null;
  title: string;
  content: string | null;
  system_id: string | null;
  custom_system_name: string | null;
  max_players: number;
  current_players: number;
  status: "recruiting" | "filled" | "completed" | "cancelled";
  scenario_id: string | null;
  use_ai_gm: boolean;
  play_mode: "realtime" | "async";
  language: "ko" | "en";
  created_at: string;
  updated_at: string;
  creator?: Profile;
}

export interface PartyMember {
  id: string;
  party_id: string;
  user_id: string;
  role: "GM" | "PL";
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  user?: Profile;
}

export interface PartySession {
  id: string;
  party_id: string;
  scenario_id: string | null;
  status: "active" | "paused" | "completed";
  turn_order: string[];
  current_turn_index: number;
  turn_count: number;
  total_turns: number;
  use_ai_gm: boolean;
  play_mode: "realtime" | "async";
  created_at: string;
  updated_at: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  user_id: string | null;
  role: "gm" | "player" | "system" | "chat";
  player_name: string | null;
  content: string;
  dice_roll: DiceRoll | null;
  created_at: string;
  user?: Profile;
}

// --- Premium ---
export const PREMIUM_CONFIG = {
  free: {
    dailyQuestLimit: 2,
    weeklyMultiSessionLimit: 1,
    multiSessionTurns: 25,
    maxTokens: 500,
    turnMultiplier: 1,
    expMultiplier: 1,
  },
  premium: {
    dailyQuestLimit: Infinity,
    weeklyMultiSessionLimit: Infinity,
    multiSessionTurns: 50,
    maxTokens: 1000,
    turnMultiplier: 2.5,
    expMultiplier: 1.5,
  },
} as const;
