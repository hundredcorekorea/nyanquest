export interface FavoriteWork {
  title: string;
  reason: string;
}

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  discord_username: string | null;
  cat_type: string;
  cat_exp: number;
  style_tags: string[];
  manner_temp: number;
  active_title: string | null;
  favorite_works: FavoriteWork[];
  preferred_elements: string[];
  avoided_elements: string[];
  referral_code: string;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  signup_rewarded: boolean;
  premium_rewarded: boolean;
  created_at: string;
}

export interface UserTitle {
  id: string;
  user_id: string;
  title_id: string;
  earned_at: string;
}

export interface TrpgSystem {
  id: string;
  name: string;
  is_official: boolean;
  created_at: string;
}

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
  meeting_type: "online" | "offline" | "hybrid";
  discord_invite_url: string | null;
  location: string | null;
  scheduled_at: string | null;
  status: "recruiting" | "filled" | "completed" | "cancelled";
  looking_for_gm: boolean;
  thumbnail_url: string | null;
  use_ai_gm: boolean;
  play_mode: "realtime" | "async";
  language: "ko" | "en";
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Profile;
  gm?: Profile;
  system?: TrpgSystem;
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

export interface Review {
  id: string;
  reviewer_id: string;
  target_id: string;
  party_id: string;
  rating: -1 | 0 | 1;
  comment: string | null;
  created_at: string;
}

export interface SessionLog {
  id: string;
  party_id: string;
  author_id: string;
  title: string;
  external_url: string | null;
  summary: string | null;
  session_date: string | null;
  created_at: string;
}

export type PostCategory = "free" | "tip" | "gallery" | "qna";

export interface Post {
  id: string;
  author_id: string;
  category: PostCategory;
  title: string;
  content: string;
  system_id: string | null;
  language: "ko" | "en";
  view_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  system?: TrpgSystem;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface GmStats {
  totalSessions: number;
  completedSessions: number;
  systems: { name: string; count: number }[];
  positiveRate: number;
  totalGmReviews: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: "monthly" | "yearly";
  status: "active" | "expired" | "cancelled" | "pending";
  portone_payment_id: string | null;
  amount: number;
  started_at: string;
  expires_at: string;
  cancelled_at: string | null;
  gifted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  portone_payment_id: string;
  portone_tx_id: string | null;
  method: string | null;
  amount: number;
  currency: string;
  status: "paid" | "failed" | "cancelled" | "refunded";
  plan: "monthly" | "yearly";
  gift_to: string | null;
  created_at: string;
}

export type ReportReason = "spam" | "harassment" | "inappropriate" | "cheating" | "copyright" | "other";

export interface Report {
  id: string;
  reporter_id: string;
  report_type: "post" | "comment" | "user" | "session_message" | "scenario";
  target_id: string;
  reason: ReportReason;
  description: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export type NotificationType =
  | "join_request"
  | "join_accepted"
  | "join_rejected"
  | "party_status"
  | "review_received"
  | "exp_gained"
  | "quest_complete"
  | "gm_assigned"
  | "subscription_started"
  | "subscription_expiring"
  | "announcement"
  | "referral_signup"
  | "referral_premium"
  | "gift_received"
  | "round_your_turn"
  | "round_all_submitted";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  party_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type AdPlacement = "home" | "adgate" | "solo" | "community";

export interface AdEntry {
  id: string;
  app_name: string;
  title: string;
  description: string;
  img_url: string | null;
  banner_url: string | null;
  link: string;
  placement: AdPlacement;
  priority: number;
  active: boolean;
  created_at: string;
}

export type ScenarioGenre =
  | "fantasy"
  | "horror"
  | "comedy"
  | "scifi"
  | "mystery"
  | "romance"
  | "historical"
  | "modern"
  | "other";

export interface CommunityScenario {
  id: string;
  creator_id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  genre: ScenarioGenre;
  system_id: string | null;
  language: "ko" | "en";
  difficulty: "easy" | "normal" | "hard";
  estimated_turns: number;
  scenario_data: ScenarioData;
  tags: string[];
  is_premium: boolean;
  status: "draft" | "published" | "hidden";
  play_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Profile;
  system?: TrpgSystem;
}

export interface ScenarioData {
  background: string;
  opening: string;
  gmInstructions: string;
  npcs?: { name: string; description: string; personality: string }[];
  keyEvents?: { trigger: string; description: string }[];
  possibleEndings?: { condition: string; description: string }[];
}

export interface ScenarioLike {
  user_id: string;
  scenario_id: string;
  created_at: string;
}
