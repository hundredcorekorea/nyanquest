"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "모험찾기", emoji: "🎲" },
  { href: "/community", label: "쉼터", emoji: "💬" },
  { href: "/create", label: "모집하기", emoji: "✏️" },
  { href: "/my", label: "MY", emoji: "🐱" },
];

export default function BottomNav() {
  const pathname = usePathname();

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
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
