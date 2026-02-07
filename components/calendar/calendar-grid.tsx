"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CalendarDay } from "@/lib/queries/calendar";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarGrid({
  year,
  month,
  lastDay,
  dayMap,
  showProgress = false,
}: {
  year: number;
  month: number;
  lastDay: number;
  dayMap: Record<string, CalendarDay>;
  showProgress?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getToday();

  // First day of the month (0=Sun)
  const firstDow = new Date(year, month - 1, 1).getDay();

  // Previous month padding
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  const paddingBefore = Array.from({ length: firstDow }, (_, i) => ({
    day: prevMonthLastDay - firstDow + 1 + i,
    isPadding: true as const,
    dateStr: "",
  }));

  // Current month days
  const currentDays = Array.from({ length: lastDay }, (_, i) => ({
    day: i + 1,
    isPadding: false as const,
    dateStr: toDateStr(year, month, i + 1),
  }));

  // Next month padding to fill grid
  const totalCells = paddingBefore.length + currentDays.length;
  const remainder = totalCells % 7;
  const paddingAfter =
    remainder === 0
      ? []
      : Array.from({ length: 7 - remainder }, (_, i) => ({
          day: i + 1,
          isPadding: true as const,
          dateStr: "",
        }));

  const allDays = [...paddingBefore, ...currentDays, ...paddingAfter];

  function handleDayClick(dateStr: string) {
    const params = new URLSearchParams();
    const studentParam = searchParams.get("student");
    if (studentParam) {
      params.set("student", studentParam);
    }
    if (dateStr !== today) {
      params.set("date", dateStr);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
      {DAY_LABELS.map((label) => (
        <div
          key={label}
          className="bg-muted py-1.5 text-center text-xs font-medium text-muted-foreground"
        >
          {label}
        </div>
      ))}
      {allDays.map((cell, idx) => {
        const data = cell.isPadding ? null : (dayMap[cell.dateStr] ?? null);
        const isToday = !cell.isPadding && cell.dateStr === today;
        const hasLessons = data !== null && data.total > 0;
        const allComplete = hasLessons && data.completed === data.total;

        return (
          <button
            type="button"
            key={cell.dateStr || `pad-${idx}`}
            disabled={cell.isPadding}
            onClick={() => !cell.isPadding && handleDayClick(cell.dateStr)}
            className={cn(
              "flex flex-col items-center justify-start gap-0.5 bg-background p-1.5 text-sm transition-colors min-h-[52px]",
              cell.isPadding && "bg-muted/50 text-muted-foreground/40",
              !cell.isPadding && "hover:bg-accent cursor-pointer",
              isToday && "ring-2 ring-primary ring-inset",
            )}
          >
            <span
              className={cn(
                "text-xs tabular-nums",
                isToday && "font-bold text-primary",
              )}
            >
              {cell.day}
            </span>
            {hasLessons && showProgress && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                  allComplete
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
                )}
              >
                {data.completed}/{data.total}
              </span>
            )}
            {hasLessons && !showProgress && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  allComplete
                    ? "bg-green-500 dark:bg-green-400"
                    : "bg-blue-500 dark:bg-blue-400",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
