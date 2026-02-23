"use client";

import { Gift, Lock, Trophy } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trackDailyCompletionReward } from "@/lib/actions/rewards";
import { cn } from "@/lib/utils";

type DailyRewardCardProps = {
  date: string;
  totalLessons: number;
  completedLessons: number;
  studentsWithLessons: number;
  completedStudents: number;
  isEligible: boolean;
  isTracked: boolean;
  points: number;
};

export function DailyRewardCard({
  date,
  totalLessons,
  completedLessons,
  studentsWithLessons,
  completedStudents,
  isEligible,
  isTracked,
  points,
}: DailyRewardCardProps) {
  const [isPending, startTransition] = useTransition();

  const lessonPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const isButtonDisabled = isTracked || !isEligible || isPending;
  const statusLabel = isTracked
    ? "Tracked"
    : isEligible
      ? "Unlocked"
      : "Locked";
  const summary = `${completedLessons}/${totalLessons} lessons · ${completedStudents}/${studentsWithLessons} students`;

  return (
    <section
      className={cn(
        "w-full rounded-lg border px-3 py-2 sm:max-w-sm",
        isTracked && "border-emerald-500/35 bg-emerald-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Daily Reward
            </p>
            <span className="text-[11px] text-muted-foreground">·</span>
            <p className="truncate text-xs font-medium">{statusLabel}</p>
          </div>
          <p className="truncate text-xs text-muted-foreground">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          {isTracked ? (
            <Trophy className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : isEligible ? (
            <Gift className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <Button
            size="sm"
            className="h-8 px-3"
            disabled={isButtonDisabled}
            onClick={() =>
              startTransition(async () => {
                await trackDailyCompletionReward(date);
              })
            }
          >
            {isTracked
              ? `+${points} Tracked`
              : isPending
                ? "Tracking..."
                : isEligible
                  ? `Track +${points}`
                  : "Locked"}
          </Button>
        </div>
      </div>

      <Progress value={lessonPercent} className="mt-2 h-1.5" />
    </section>
  );
}
