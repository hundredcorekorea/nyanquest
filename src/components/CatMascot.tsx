"use client";

import { useState, useEffect } from "react";

const catMessages = [
  "오늘의 모험을 찾아보라냥! 🎲",
  "새로운 파티가 기다리고 있다냥~",
  "집사, 같이 던전 갈 사람 찾자냥!",
  "주사위 운이 좋을 것 같다냥 ✨",
  "멋진 마스터를 찾아보라냥!",
];

export default function CatMascot() {
  const [message, setMessage] = useState(catMessages[0]);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // Rotate messages
    const msgInterval = setInterval(() => {
      setMessage(catMessages[Math.floor(Math.random() * catMessages.length)]);
    }, 5000);

    // Blink animation
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(blinkInterval);
    };
  }, []);

  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
      {/* Cat face */}
      <div className="text-5xl flex-shrink-0 select-none" role="img" aria-label="cat mascot">
        <div className="relative">
          <span className={`transition-all duration-100 ${isBlinking ? "opacity-0" : "opacity-100"}`}>
            😺
          </span>
        </div>
      </div>

      {/* Speech bubble */}
      <div className="relative bg-white rounded-xl px-4 py-2.5 shadow-sm border border-amber-100 flex-1">
        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent" />
        <p className="text-sm text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
