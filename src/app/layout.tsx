import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nyanQuest - 주사위 굴리는 고양이와 함께 떠나는 모험",
  description:
    "TRPG 파티 구인, 세션 기록, 고양이 마스코트와 함께하는 탁상 롤플레잉 커뮤니티",
  openGraph: {
    title: "nyanQuest - TRPG 파티 찾기",
    description: "고양이와 함께 모험을 떠나보세요! TRPG 구인 & 기록 플랫폼",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-amber-50/30 text-gray-900`}
      >
        <ToastProvider>
          <Header />
          <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
