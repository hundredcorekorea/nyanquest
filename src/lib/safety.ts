/**
 * AI Safety Filtering (한국 AI 기본법 준수)
 *
 * 1. 사용자 입력에 위험 키워드 탐지 → 차단
 * 2. AI 출력에 위기 신호 감지 → 상담 안내 제공
 * 3. AI 생성 콘텐츠 라벨링 의무 이행
 *
 * Ported from toss-app/src/lib/safety.ts for the main Next.js app.
 */

// Immediate block — never send to AI
const BLOCKED_PATTERNS = [
  /자살\s*(방법|하는\s*법|도구)/,
  /자해\s*(방법|하는\s*법)/,
  /폭탄\s*(만드|제조|설계)/,
  /마약\s*(제조|구매|파는)/,
  /아동.*성|성.*아동/,
  /살인\s*(방법|하는\s*법|도구)/,
  // English patterns
  /how\s+to\s+(kill|suicide|self[- ]harm)/i,
  /make\s+a?\s*(bomb|explosive)/i,
  /buy\s+(drugs|meth|cocaine)/i,
  /child\s*(porn|abuse|sex)/i,
];

// Crisis detection — show help resources
const CRISIS_PATTERNS = [
  /죽고\s*싶/,
  /살고\s*싶지\s*않/,
  /자살/,
  /자해/,
  /극단적\s*선택/,
  /삶이\s*끝/,
  /죽어버리/,
  // English patterns
  /want\s+to\s+die/i,
  /kill\s+myself/i,
  /end\s+my\s+life/i,
  /suicide/i,
  /self[- ]harm/i,
];

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  isCrisis?: boolean;
}

/**
 * Check user input before sending to AI.
 * Returns allowed:false if content is blocked.
 * Returns isCrisis:true if crisis keywords detected (allow but flag).
 */
export function checkUserInput(text: string, locale: string = "ko"): SafetyCheckResult {
  const normalized = text.replace(/\s+/g, " ").trim();

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: locale === "ko"
          ? "안전상의 이유로 해당 내용은 입력할 수 없다냥. 다른 행동을 시도해보라냥!"
          : "That content can't be entered for safety reasons, nya. Try a different action, meow!",
      };
    }
  }

  const isCrisis = CRISIS_PATTERNS.some((p) => p.test(normalized));

  return { allowed: true, isCrisis };
}

/** Detect crisis signals in AI response text */
export function detectCrisisInResponse(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}

/** Crisis help message (Korean) */
export const CRISIS_HELP_KO =
  "혹시 힘든 일이 있다면 전문 상담을 받아보세요.\n" +
  "정신건강 위기상담 전화: 1577-0199 (24시간)\n" +
  "자살예방 상담전화: 1393 (24시간)";

/** Crisis help message (English) */
export const CRISIS_HELP_EN =
  "If you're going through a difficult time, please reach out for help.\n" +
  "National Suicide Prevention Lifeline: 988 (US, 24/7)\n" +
  "Crisis Text Line: Text HOME to 741741";

export function getCrisisHelp(locale: string): string {
  return locale === "ko" ? CRISIS_HELP_KO : CRISIS_HELP_EN;
}
