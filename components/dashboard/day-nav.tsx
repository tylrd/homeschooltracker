"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DayNav({
  date,
  today,
  compact = false,
}: {
  date: string;
  today: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isToday = date === today;

  function navigate(newDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newDate === today) {
      params.delete("date");
    } else {
      params.set("date", newDate);
    }
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate(addDays(date, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className={cn(
          "text-center font-bold",
          compact ? "min-w-[88px] text-base" : "min-w-[120px] text-lg",
        )}
      >
        {isToday ? "Today" : formatLabel(date)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate(addDays(date, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isToday && (
        <button
          type="button"
          className="ml-1 text-xs text-muted-foreground underline hover:text-foreground"
          onClick={() => navigate(today)}
        >
          Today
        </button>
      )}
    </div>
  );
}
