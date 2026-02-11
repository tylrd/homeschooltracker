"use client";

import {
  ArrowRight,
  EllipsisVertical,
  MessageSquare,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  lessonPlan: string | null;
  date: string;
  isMakeup?: boolean;
  exiting?: boolean;
  showNoteButton?: boolean;
  showStudentName?: boolean;
  onNoteClick: (target: {
    studentId: string;
    lessonId: string;
    lessonPlan: string | null;
  }) => void;
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
  lessonPlan,
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
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
    setBumping(true);
    setTimeout(() => {
      startTransition(async () => {
        await bumpLesson(lessonId);
      });
    }, 300);
  }

  function handleDelete() {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setMenuOpen(false);
    setDeleting(true);
    startTransition(async () => {
      await deleteLesson(lessonId);
      toast.success("Lesson deleted");
    });
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
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
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
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
          {showNoteButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() =>
                onNoteClick({
                  studentId,
                  lessonId,
                  lessonPlan,
                })
              }
              title="Add note"
              disabled={deleting}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={isPending || deleting}
                title="Lesson actions"
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              {!isCompleted && (
                <Button
                  variant="ghost"
                  className="h-9 w-full justify-start"
                  onClick={handleBump}
                  disabled={isPending || bumping || deleting}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Bump to next day
                </Button>
              )}
              <Button
                variant="ghost"
                className="h-9 w-full justify-start text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending || deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete lesson
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
