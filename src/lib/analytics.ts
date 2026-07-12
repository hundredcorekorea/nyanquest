/**
 * Google Analytics 4 — nyanQuest.
 * gtag는 NEXT_PUBLIC_GA_ID 가 설정될 때까지 no-op (안전).
 * 목적: 트래픽(page_view) + 핵심 인게이지먼트 측정.
 */
function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

/** SPA 라우트 이동마다 명시적 page_view (App Router는 클라 네비라 자동 누락됨) */
export function trackPageView(url: string) {
  gtag("event", "page_view", {
    page_path: url,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  });
}

type Params = Record<string, string | number | boolean | undefined>;

/** 커스텀 이벤트 */
export function trackEvent(action: string, params?: Params) {
  gtag("event", action, params);
}

// ═══ nyanQuest 전용 이벤트 ═══
export const trackScenarioStarted = (scenario: string, mode: string) =>
  trackEvent("scenario_started", { scenario, mode });
export const trackSessionCreated = (mode: string) =>
  trackEvent("session_created", { mode });
export const trackShare = (type: string, method: string = "copy") =>
  trackEvent("share", { content_type: type, method });
