export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface DiceRoll {
  type: DiceType;
  result: number;
  modifier?: number;
  total: number;
  dc?: number;
  success?: boolean;
}

export interface QuestMessage {
  role: "gm" | "player" | "system";
  content: string;
  timestamp: string;
  diceRoll?: DiceRoll;
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
  systemPromptAddition: string;
  openingMessage: string;
  suggestedActions: string[];
  isPremium?: boolean;
}

export interface SoloQuest {
  id: string;
  user_id: string;
  scenario_id: string;
  status: "in_progress" | "completed" | "abandoned";
  messages: QuestMessage[];
  turn_count: number;
  total_turns: number;
  exp_earned: number;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}
