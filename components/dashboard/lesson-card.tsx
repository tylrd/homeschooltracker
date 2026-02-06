"use client";

import { useTransition } from "react";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getColorClasses } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { completeLesson, uncompleteLesson, bumpLesson } from "@/lib/actions/lessons";

type LessonCardProps = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  status: string;
  resourceName: string;
  subjectName: string;
  studentColor: string;
  studentId: string;
  onNoteClick: (studentId: string) => void;
};

export function LessonCard({
  lessonId,
  lessonNumber,
  lessonTitle,
  status,
  resourceName,
  subjectName,
  studentColor,
  studentId,
  onNoteClick,
}: LessonCardProps) {
  const [isPending, startTransition] = useTransition();
  const colors = getColorClasses(studentColor);
  const isCompleted = status === "completed";

  function handleToggle() {
    startTransition(async () => {
      if (isCompleted) {
        await uncompleteLesson(lessonId);
      } else {
        await completeLesson(lessonId);
      }
    });
  }

  function handleBump() {
    startTransition(async () => {
      await bumpLesson(lessonId);
    });
  }

  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-lg border-l-4 bg-card px-3 py-2 transition-opacity",
        colors.border,
        isPending && "opacity-50",
        isCompleted && "opacity-60",
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        className="h-7 w-7 rounded-md"
        disabled={isPending}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", isCompleted && "line-through")}>
          {lessonTitle ?? `Lesson ${lessonNumber}`}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {subjectName} &middot; {resourceName}
        </p>
      </div>
      {!isCompleted && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleBump}
          disabled={isPending}
          title="Bump to next day"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onNoteClick(studentId)}
        title="Add note"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
}
