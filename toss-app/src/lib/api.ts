import { getAccessToken } from "./supabase";

/** NyanQuest API base URL (Vercel-hosted Next.js) */
const API_BASE = import.meta.env.VITE_API_BASE || "https://nyanquest.com";

/**
 * Authenticated fetch to NyanQuest API routes.
 * Sends Supabase access_token as Authorization header.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

// --- Solo Quest ---

export async function soloChat(body: {
  questId: string;
  scenarioId: string;
  playerMessage: string;
  messages: unknown[];
  turnCount: number;
  locale?: string;
  diceRoll?: unknown;
  jobId?: string;
}) {
  return apiFetch("/api/solo-quest/chat", {
    method: "POST",
    body: JSON.stringify({ ...body, locale: body.locale || "ko" }),
  });
}

export async function soloExtendTurns(questId: string) {
  return apiFetch("/api/solo-quest/extend-turns", {
    method: "POST",
    body: JSON.stringify({ questId }),
  });
}

// --- Party Session ---

export async function partyChat(body: {
  sessionId: string;
  playerMessage?: string;
  isOpening?: boolean;
  forceRound?: boolean;
  diceRoll?: unknown;
}) {
  return apiFetch("/api/party-session/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function partyRoundStatus(sessionId: string) {
  const params = new URLSearchParams({ sessionId });
  return apiFetch(`/api/party-session/round-status?${params}`);
}

export async function partyExtendTurns(sessionId: string) {
  return apiFetch("/api/party-session/extend-turns", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

// --- Auth ---

export async function tossAuth(authorizationCode: string, referrer?: string) {
  return apiFetch("/api/auth/toss", {
    method: "POST",
    body: JSON.stringify({ authorizationCode, referrer }),
  });
}

// --- Payment ---

export async function tossInitiatePayment(plan: "monthly" | "yearly") {
  return apiFetch("/api/payment/toss-initiate", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}
