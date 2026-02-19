"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const D20Icon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? "text-amber-600" : "text-current"}>
    <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 2L7 8.5H17L12 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M2 8.5L7 8.5L12 22" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M22 8.5L17 8.5L12 22" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <text x="12" y="15" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor">20</text>
  </svg>
);

export default function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const tabs = [
    { href: "/" as const, label: t("quest"), icon: "d20" },
    { href: "/community" as const, label: t("guildHall"), emoji: "🏰" },
    { href: "/solo" as const, label: t("training"), emoji: "⚔️" },
    { href: "/create" as const, label: t("postQuest"), emoji: "📜" },
    { href: "/my" as const, label: t("adventurer"), emoji: "🧙" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-amber-100 z-50">
      <div className="max-w-3xl mx-auto flex justify-around py-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                isActive ? "text-amber-600" : "text-gray-400 hover:text-amber-600"
              }`}
            >
              <span className="text-xl">
                {tab.icon === "d20" ? <D20Icon active={isActive} /> : tab.emoji}
              </span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
