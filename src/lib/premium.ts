export const PREMIUM_CONFIG = {
  free: {
    dailyQuestLimit: 2,
    weeklyMultiSessionLimit: 1,
    multiSessionTurns: 15,
    aiModel: "google/gemini-2.5-flash-lite",
    maxTokens: 500,
    turnMultiplier: 1,
    expMultiplier: 1,
  },
  premium: {
    dailyQuestLimit: Infinity,
    weeklyMultiSessionLimit: Infinity,
    multiSessionTurns: 40,
    aiModel: "google/gemini-2.5-flash",
    maxTokens: 1000,
    turnMultiplier: 2.5,
    expMultiplier: 1.5,
  },
} as const;

export const PLANS = {
  monthly: {
    price: 4900,
    label: "월간 구독",
    labelEn: "Monthly",
    period: "월",
    periodEn: "mo",
    durationDays: 30,
  },
  yearly: {
    price: 39000,
    label: "연간 구독",
    labelEn: "Yearly",
    period: "년",
    periodEn: "yr",
    durationDays: 365,
    discount: "33% 할인",
    discountEn: "33% off",
  },
} as const;

export type PlanType = keyof typeof PLANS;
