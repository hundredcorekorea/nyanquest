import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import PartyCard from "@/components/PartyCard";
import type { Party } from "@/types/database";
import ko from "../../../messages/ko.json";
import en from "../../../messages/en.json";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Mock @/i18n/navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

const mockParty: Party = {
  id: "test-party-1",
  creator_id: "user-1",
  gm_id: null,
  title: "테스트 파티",
  content: "테스트 설명",
  system_id: null,
  custom_system_name: "D&D 5e",
  max_players: 4,
  current_players: 2,
  meeting_type: "online",
  discord_invite_url: null,
  location: null,
  scheduled_at: null,
  status: "recruiting",
  looking_for_gm: true,
  thumbnail_url: null,
  use_ai_gm: false,
  play_mode: "realtime",
  language: "ko",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  creator: {
    id: "user-1",
    nickname: "테스트유저",
    avatar_url: null,
    discord_username: null,
    cat_type: "nyan",
    cat_exp: 100,
    style_tags: [],
    manner_temp: 36.5,
    active_title: null,
    favorite_works: [],
    preferred_elements: [],
    avoided_elements: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

function renderWithLocale(locale: "ko" | "en", messages: Record<string, unknown>) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PartyCard party={mockParty} />
    </NextIntlClientProvider>
  );
}

describe("PartyCard", () => {
  it("renders party title", () => {
    renderWithLocale("ko", ko);
    expect(screen.getByText("테스트 파티")).toBeInTheDocument();
  });

  it("renders Korean labels in ko locale", () => {
    renderWithLocale("ko", ko);
    expect(screen.getByText("모집중")).toBeInTheDocument();
    expect(screen.getByText("온라인")).toBeInTheDocument();
  });

  it("renders English labels in en locale", () => {
    renderWithLocale("en", en);
    expect(screen.getByText("Recruiting")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders system name", () => {
    renderWithLocale("ko", ko);
    expect(screen.getByText(/D&D 5e/)).toBeInTheDocument();
  });

  it("renders player count", () => {
    renderWithLocale("ko", ko);
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();
  });

  it("renders GM wanted badge in ko", () => {
    renderWithLocale("ko", ko);
    expect(screen.getByText(/GM 구인/)).toBeInTheDocument();
  });

  it("renders GM wanted badge in en", () => {
    renderWithLocale("en", en);
    expect(screen.getByText(/GM Wanted/)).toBeInTheDocument();
  });

  it("links to party detail page", () => {
    renderWithLocale("ko", ko);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/party/test-party-1");
  });

  it("renders creator nickname", () => {
    renderWithLocale("ko", ko);
    expect(screen.getByText("테스트유저")).toBeInTheDocument();
  });
});
