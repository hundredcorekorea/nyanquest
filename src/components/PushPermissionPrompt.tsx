"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushPermissionPrompt() {
  const t = useTranslations("Push");
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Only show if push is supported and permission not yet decided
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) return;

    if (Notification.permission === "default") {
      // Delay showing to not be too aggressive
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleAllow() {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
        ),
      });

      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });
    } catch (err) {
      console.error("[push] Subscribe failed:", err);
    } finally {
      setShow(false);
      setSubscribing(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-in slide-in-from-bottom-4">
      <div className="bg-white border border-amber-200 rounded-2xl shadow-lg p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{t("title")}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t("description")}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShow(false)}
              className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {t("later")}
            </button>
            <button
              onClick={handleAllow}
              disabled={subscribing}
              className="px-3 py-1.5 text-xs text-white bg-amber-500 rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50"
            >
              {subscribing ? "..." : t("allow")}
            </button>
          </div>
        </div>
        <button onClick={() => setShow(false)} className="text-gray-300 hover:text-gray-400 text-lg leading-none">
          &times;
        </button>
      </div>
    </div>
  );
}
