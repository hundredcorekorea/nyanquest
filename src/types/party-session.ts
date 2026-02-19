import type { DiceRoll } from "./solo-quest";
import type { Profile } from "./database";

export interface PartySession {
  id: string;
  party_id: string;
  scenario_id: string | null;
  status: "active" | "paused" | "completed";
  turn_order: string[]; // UUID[]
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
  user_id: string | null; // null = AI GM
  role: "gm" | "player" | "system";
  player_name: string | null;
  content: string;
  dice_roll: DiceRoll | null;
  created_at: string;
  // Joined
  user?: Profile;
}
