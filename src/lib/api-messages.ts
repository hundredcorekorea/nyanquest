import { NextRequest } from "next/server";

type Locale = "ko" | "en";

const messages: Record<string, Record<Locale, string>> = {
  loginRequired: {
    ko: "로그인이 필요하다냥!",
    en: "You need to log in, meow!",
  },
  invalidRequest: {
    ko: "잘못된 요청이다냥",
    en: "Invalid request, meow",
  },
  messageTooLong: {
    ko: "메시지가 너무 길다냥! 500자 이내로 줄여달라냥.",
    en: "Message is too long, meow! Keep it under 500 characters.",
  },
  turnLimitExceeded: {
    ko: "턴 제한을 초과했다냥!",
    en: "Turn limit exceeded, meow!",
  },
  questNotFound: {
    ko: "퀘스트를 찾을 수 없다냥",
    en: "Quest not found, meow",
  },
  questAlreadyEnded: {
    ko: "이미 종료된 퀘스트다냥",
    en: "This quest has already ended, meow",
  },
  scenarioNotFound: {
    ko: "시나리오를 찾을 수 없다냥",
    en: "Scenario not found, meow",
  },
  aiUnavailable: {
    ko: "AI가 잠시 쉬고 있다냥... 다시 시도해달라냥!",
    en: "AI is taking a break, meow... Please try again!",
  },
  sessionNotFound: {
    ko: "세션을 찾을 수 없다냥",
    en: "Session not found, meow",
  },
  sessionEnded: {
    ko: "종료된 세션이다냥",
    en: "This session has ended, meow",
  },
  notAiGmSession: {
    ko: "AI GM이 아닌 세션이다냥",
    en: "This is not an AI GM session, meow",
  },
  turnLimitReached: {
    ko: "턴 제한에 도달했다냥! 세션이 종료된다냥.",
    en: "Turn limit reached, meow! The session is ending.",
  },
  notPartyMember: {
    ko: "파티 멤버가 아니다냥",
    en: "You're not a party member, meow",
  },
  aiGmUnavailable: {
    ko: "AI GM이 잠시 쉬고 있다냥... 다시 시도해달라냥!",
    en: "AI GM is taking a break, meow... Please try again!",
  },
  noActiveSubscription: {
    ko: "활성 구독이 없다냥",
    en: "No active subscription found, meow",
  },
  invalidPlan: {
    ko: "잘못된 구독 플랜이다냥",
    en: "Invalid subscription plan, meow",
  },
  alreadyPremium: {
    ko: "이미 프리미엄 구독 중이다냥!",
    en: "You already have a premium subscription, meow!",
  },
  paymentVerificationFailed: {
    ko: "결제 확인에 실패했다냥",
    en: "Payment verification failed, meow",
  },
  paymentNotConfirmed: {
    ko: "결제가 확인되지 않았다냥",
    en: "Payment not confirmed, meow",
  },
  amountMismatch: {
    ko: "금액이 일치하지 않다냥",
    en: "Amount mismatch, meow",
  },
  premiumStarted: {
    ko: "프리미엄 구독이 시작되었다냥! 활성화 완료!",
    en: "Premium subscription started, meow! Activated!",
  },
  partyNotFound: {
    ko: "파티를 찾을 수 없다냥...",
    en: "Party not found, meow...",
  },
  recipientNotFound: {
    ko: "유저를 찾을 수 없다냥",
    en: "User not found, meow",
  },
  recipientAlreadyPremium: {
    ko: "이미 프리미엄 유저다냥",
    en: "Already a premium user, meow",
  },
  extendLimitReached: {
    ko: "턴 연장 횟수를 모두 사용했다냥!",
    en: "You've used all turn extensions, meow!",
  },
};

export function getLocaleFromRequest(request: NextRequest | Request): Locale {
  const cookieHeader =
    request instanceof NextRequest
      ? request.cookies.get("NEXT_LOCALE")?.value
      : null;
  if (cookieHeader === "en") return "en";
  if (cookieHeader === "ko") return "ko";

  const acceptLang = request.headers.get("accept-language") ?? "";
  if (acceptLang.startsWith("en")) return "en";
  return "ko";
}

export function apiMsg(
  key: string,
  request?: NextRequest | Request
): string {
  const locale = request ? getLocaleFromRequest(request) : "ko";
  return messages[key]?.[locale] ?? messages[key]?.ko ?? key;
}
