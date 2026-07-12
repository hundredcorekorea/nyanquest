import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getTranslations, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import PWARegister from "@/components/PWARegister";
import ReferralCapture from "@/components/ReferralCapture";
import PushPermissionPrompt from "@/components/PushPermissionPrompt";
import InstallPrompt from "@/components/InstallPrompt";
import AnalyticsListener from "@/components/AnalyticsListener";
import { Suspense } from "react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"
    ),
    title: t("siteTitle"),
    description: t("siteDescription"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      images: [
        {
          url: locale === "ko" ? "/og-default.png" : "/og-en.png",
          width: 1200,
          height: 630,
          alt: t("siteTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [locale === "ko" ? "/og-default.png" : "/og-en.png"],
    },
    icons: {
      icon: [
        { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/icons/icon-192.png" }],
    },
    verification: {
      other: {
        "naver-site-verification": "011ffdb2db998398d5f821358cbe6a99ffa3ca32",
      },
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "nyanQuest",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "nyanQuest",
    url: "https://nyanquest.com",
    description:
      locale === "ko"
        ? "AI GM과 함께하는 온라인 TRPG 플랫폼. 솔로 퀘스트, 파티 모드, 커뮤니티 모집."
        : "A cozy AI storytelling RPG. Write your own adventure with NaYang, your wizard cat Game Master. Solo journaling, collaborative tales & dice-driven fiction.",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
    inLanguage: ["ko", "en"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1075071967728463"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
          </Script>
        </>
      )}
      <NextIntlClientProvider messages={messages}>
        <ToastProvider>
          <PWARegister />
          <Suspense>
            <ReferralCapture />
            <AnalyticsListener />
          </Suspense>
          <Header />
          <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
          <Footer />
          <BottomNav />
          <PushPermissionPrompt />
          <InstallPrompt />
        </ToastProvider>
      </NextIntlClientProvider>
    </>
  );
}
