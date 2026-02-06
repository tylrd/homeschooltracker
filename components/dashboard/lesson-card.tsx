"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, Plus, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getColorClasses } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  completeLesson,
  uncompleteLesson,
  bumpLesson,
  scheduleMakeupLesson,
} from "@/lib/actions/lessons";

type LessonCardProps = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  status: string;
  resourceId: string;
  resourceName: string;
  subjectName: string;
  studentColor: string;
  studentId: string;
  date: string;
  isMakeup?: boolean;
  exiting?: boolean;
  onNoteClick: (studentId: string) => void;
};

export function LessonCard({
  lessonId,
  lessonNumber,
  lessonTitle,
  status,
  resourceId,
  resourceName,
  subjectName,
  studentColor,
  studentId,
  date,
  isMakeup,
  exiting,
  onNoteClick,
}: LessonCardProps) {
  const [isPending, startTransition] = useTransition();
  const [bumping, setBumping] = useState(false);
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
    setBumping(true);
    setTimeout(() => {
      startTransition(async () => {
        await bumpLesson(lessonId);
      });
    }, 300);
  }

  function handleMakeup() {
    startTransition(async () => {
      await scheduleMakeupLesson(resourceId, date);
    });
  }

  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-lg px-3 py-2.5 transition-opacity",
        isCompleted
          ? "bg-muted/50 shadow-none opacity-50"
          : "bg-card shadow-sm",
        !isCompleted && colors.border,
        isPending && !bumping && "opacity-50",
        (bumping || exiting) && "animate-lesson-out",
        !bumping && !exiting && "animate-lesson-in",
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        className="h-7 w-7 rounded-md"
        disabled={isPending || bumping}
      />
      <Link href={`/lessons/${lessonId}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-sm font-medium", isCompleted && "line-through text-muted-foreground")}>
            {lessonTitle ?? `Lesson ${lessonNumber}`}
          </p>
          {isMakeup && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              <RotateCcw className="h-2.5 w-2.5" />
              Makeup
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {subjectName} &middot; {resourceName}
        </p>
      </Link>
      {!isCompleted && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleMakeup}
            disabled={isPending || bumping}
            title="Add makeup lesson"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleBump}
            disabled={isPending || bumping}
            title="Bump to next day"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
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
