"use client";

import { ArrowRight, MessageSquare, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  bumpLesson,
  completeLesson,
  deleteLesson,
  uncompleteLesson,
} from "@/lib/actions/lessons";
import { getColorClasses } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LessonCardProps = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  status: string;
  resourceId: string;
  resourceName: string;
  subjectName: string;
  studentName: string;
  studentColor: string;
  studentId: string;
  date: string;
  isMakeup?: boolean;
  exiting?: boolean;
  showNoteButton?: boolean;
  showStudentName?: boolean;
  onNoteClick: (studentId: string) => void;
};

export function LessonCard({
  lessonId,
  lessonNumber,
  lessonTitle,
  status,
  resourceId: _resourceId,
  resourceName,
  subjectName,
  studentName,
  studentColor,
  studentId,
  date: _date,
  isMakeup,
  exiting,
  showNoteButton = true,
  showStudentName = false,
  onNoteClick,
}: LessonCardProps) {
  const [isPending, startTransition] = useTransition();
  const [bumping, setBumping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [swiped, setSwiped] = useState(false);
  const colors = getColorClasses(studentColor);
  const isCompleted = status === "completed";
  const swipeThreshold = 40;
  const revealWidth = 80;

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

  function handleDelete() {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setDeleting(true);
    startTransition(async () => {
      await deleteLesson(lessonId);
      toast.success("Lesson deleted");
    });
  }

  function closeSwipe() {
    setDragX(0);
    setSwiped(false);
  }

  function onTouchStart(clientX: number) {
    if (isPending || bumping || deleting) return;
    setStartX(clientX);
  }

  function onTouchMove(clientX: number) {
    if (startX === null || isPending || bumping || deleting) return;
    const delta = clientX - startX;
    // Allow swiping left, or swiping right to close when already revealed
    if (swiped) {
      setDragX(Math.min(0, Math.max(-revealWidth + delta, -revealWidth)));
    } else if (delta < 0) {
      setDragX(Math.max(delta, -revealWidth));
    }
  }

  function onTouchEnd() {
    if (swiped) {
      // If swiped right enough, close; otherwise snap back open
      if (dragX > -swipeThreshold) {
        closeSwipe();
      } else {
        setDragX(-revealWidth);
      }
    } else {
      // Snap open if past threshold, otherwise snap closed
      if (dragX <= -swipeThreshold) {
        setDragX(-revealWidth);
        setSwiped(true);
      } else {
        setDragX(0);
      }
    }
    setStartX(null);
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive"
        style={{ width: `${revealWidth}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
          disabled={isPending || deleting}
          onClick={handleDelete}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
      <div
        className={cn(
          "relative flex min-h-14 items-center gap-3 px-3 py-2.5 transition-[opacity,transform] duration-200",
          isCompleted
            ? "bg-muted/50 shadow-none opacity-50"
            : "bg-card shadow-sm",
          !isCompleted && colors.border,
          isPending && !bumping && "opacity-50",
          (bumping || exiting) && "animate-lesson-out",
          !bumping && !exiting && "animate-lesson-in",
        )}
        style={{ transform: `translateX(${dragX}px)` }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onTouchStart(e.touches[0].clientX);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          onTouchMove(e.touches[0].clientX);
        }}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={swiped ? closeSwipe : undefined}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3",
            swiped && "pointer-events-none",
          )}
        >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          className="h-7 w-7 rounded-md"
          disabled={isPending || bumping || deleting}
        />
        <Link href={`/lessons/${lessonId}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "text-sm font-medium",
                isCompleted && "line-through text-muted-foreground",
              )}
            >
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
            {showStudentName ? (
              <span className="inline-flex items-center gap-1">
                <StudentColorDot color={studentColor} className="h-2 w-2" />
                {studentName} &middot; {resourceName}
              </span>
            ) : (
              <>
                {subjectName} &middot; {resourceName}
              </>
            )}
          </p>
        </Link>
        {!isCompleted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleBump}
            disabled={isPending || bumping || deleting}
            title="Bump to next day"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {showNoteButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onNoteClick(studentId)}
            title="Add note"
            disabled={deleting}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}
