"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/**
 * SPA page_view 트래커.
 * App Router next/link 네비는 클라 사이드라 전체 새로고침이 없음 → layout 인라인
 * gtag('config')는 첫 랜딩 1회만 page_view 전송, 이후 라우트 이동이 GA에서 누락됨.
 * 이 컴포넌트가 pathname/searchParams 변경마다 page_view 발사 (첫 마운트는 중복 방지 skip).
 */
export default function AnalyticsListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!pathname) return;
    const qs = searchParams?.toString();
    trackPageView(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
