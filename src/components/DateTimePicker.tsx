"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Props {
  value: string; // "YYYY-MM-DDTHH:MM" or ""
  onChange: (value: string) => void;
}

const ITEM_H = 40;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

// ─── Wheel Column ──────────────────────────────────────────

interface WheelProps {
  items: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
}

function Wheel({ items, selected, onSelect }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const suppressRef = useRef(false);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const scrollToIndex = useCallback(
    (idx: number, smooth = false) => {
      const el = ref.current;
      if (!el) return;
      suppressRef.current = true;
      el.scrollTo({
        top: idx * ITEM_H,
        behavior: smooth ? "smooth" : "instant",
      });
      // Release suppress after scroll finishes
      setTimeout(() => {
        suppressRef.current = false;
      }, smooth ? 200 : 50);
    },
    []
  );

  // Sync scroll position when selected changes from outside
  useEffect(() => {
    const idx = items.findIndex((i) => i.value === selected);
    if (idx >= 0) scrollToIndex(idx);
  }, [selected, items, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (suppressRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    timerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const idx = Math.round(el.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(idx, items.length - 1));
        if (items[clamped] && items[clamped].value !== selected) {
          onSelect(items[clamped].value);
        }
        // Snap
        suppressRef.current = true;
        el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
        setTimeout(() => {
          suppressRef.current = false;
        }, 200);
      });
    }, 120);
  }, [items, selected, onSelect]);

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ height: ITEM_H * VISIBLE }}
    >
      {/* Center highlight */}
      <div
        className="absolute inset-x-1 z-10 pointer-events-none rounded-lg bg-amber-50 border border-amber-300"
        style={{ top: CENTER * ITEM_H, height: ITEM_H }}
      />
      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 z-20 pointer-events-none"
        style={{
          height: CENTER * ITEM_H,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0))",
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
        style={{
          height: CENTER * ITEM_H,
          background:
            "linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))",
        }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Top spacer */}
        <div style={{ height: CENTER * ITEM_H }} />
        {items.map((item) => (
          <div
            key={item.value}
            onClick={() => {
              onSelect(item.value);
              const idx = items.findIndex((i) => i.value === item.value);
              scrollToIndex(idx, true);
            }}
            className={`flex items-center justify-center cursor-pointer select-none transition-all ${
              item.value === selected
                ? "text-gray-900 font-bold text-[15px]"
                : "text-gray-400 text-sm"
            }`}
            style={{ height: ITEM_H }}
          >
            {item.label}
          </div>
        ))}
        {/* Bottom spacer */}
        <div style={{ height: CENTER * ITEM_H }} />
      </div>
    </div>
  );
}

// ─── DateTimePicker ────────────────────────────────────────

export default function DateTimePicker({ value, onChange }: Props) {
  const t = useTranslations("DatePicker");
  const tCommon = useTranslations("Common");

  const WEEKDAYS = [t("weekdays.sun"), t("weekdays.mon"), t("weekdays.tue"), t("weekdays.wed"), t("weekdays.thu"), t("weekdays.fri"), t("weekdays.sat")];

  const now = new Date();
  const parsed = value ? new Date(value) : null;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"date" | "time">("date");

  const [year, setYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [month, setMonth] = useState(
    (parsed?.getMonth() ?? now.getMonth()) + 1
  );
  const [day, setDay] = useState(parsed?.getDate() ?? now.getDate());
  const [hour, setHour] = useState(parsed?.getHours() ?? 14);
  const [minute, setMinute] = useState(parsed?.getMinutes() ?? 0);

  // Clamp day
  const maxDay = getDaysInMonth(year, month);
  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [year, month, maxDay, day]);

  const years = range(now.getFullYear(), now.getFullYear() + 2).map((y) => ({
    value: y,
    label: `${y}${t("year")}`,
  }));
  const months = range(1, 12).map((m) => ({
    value: m,
    label: `${m}${t("month")}`,
  }));
  const days = range(1, maxDay).map((d) => {
    const wd = WEEKDAYS[new Date(year, month - 1, d).getDay()];
    return { value: d, label: `${d}${t("day")} (${wd})` };
  });
  const hours = range(0, 23).map((h) => ({
    value: h,
    label: `${pad(h)}${t("hour")}`,
  }));
  const minutes = range(0, 59).map((m) => ({
    value: m,
    label: `${pad(m)}${t("minute")}`,
  }));

  const handleConfirm = () => {
    const d = new Date(year, month - 1, day, hour, minute);
    onChange(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setOpen(false);
  };

  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];

  const displayText = parsed
    ? parsed.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }) +
      ` ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
    : "";

  return (
    <div>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTab("date");
        }}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm text-left flex items-center justify-between"
      >
        <span className={displayText ? "text-gray-900" : "text-gray-400"}>
          {displayText || t("placeholder")}
        </span>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="text-gray-300 hover:text-gray-500 text-lg"
          >
            ×
          </span>
        )}
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-100">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl pb-safe">
            <div className="px-5 pt-3 pb-6 space-y-3">
              {/* Handle */}
              <div className="flex justify-center">
                <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {(["date", "time"] as const).map((tabKey) => (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setTab(tabKey)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tab === tabKey
                        ? "bg-white text-amber-600 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    {tabKey === "date" ? t("dateTab") : t("timeTab")}
                  </button>
                ))}
              </div>

              {/* Wheels */}
              {tab === "date" ? (
                <div className="flex gap-1">
                  <Wheel items={years} selected={year} onSelect={setYear} />
                  <Wheel
                    items={months}
                    selected={month}
                    onSelect={setMonth}
                  />
                  <Wheel items={days} selected={day} onSelect={setDay} />
                </div>
              ) : (
                <div className="flex gap-2 px-6">
                  <Wheel items={hours} selected={hour} onSelect={setHour} />
                  <div className="flex items-center text-2xl font-bold text-gray-300">
                    :
                  </div>
                  <Wheel
                    items={minutes}
                    selected={minute}
                    onSelect={setMinute}
                  />
                </div>
              )}

              {/* Summary + actions */}
              <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">
                    {year}.{pad(month)}.{pad(day)} ({weekday})
                  </p>
                  <p className="text-sm text-amber-600 font-medium">
                    {pad(hour)}:{pad(minute)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-400 font-medium"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  {tCommon("confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
