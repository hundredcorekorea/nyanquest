export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  discord_username: string | null;
  cat_type: string;
  cat_exp: number;
  style_tags: string[];
  manner_temp: number;
  created_at: string;
  updated_at: string;
}

export interface TrpgSystem {
  id: string;
  name: string;
  is_official: boolean;
  created_at: string;
}

export interface Party {
  id: string;
  gm_id: string;
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
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
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

export type NotificationType =
  | "join_request"
  | "join_accepted"
  | "join_rejected"
  | "party_status"
  | "review_received"
  | "exp_gained";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  party_id: string | null;
  is_read: boolean;
  created_at: string;
}
