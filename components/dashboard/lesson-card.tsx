"use client";

import {
  ArrowRight,
  EllipsisVertical,
  Images,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  bumpSharedLesson,
  completeSharedLesson,
  deleteSharedLesson,
  uncompleteSharedLesson,
} from "@/lib/actions/shared-lessons";
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
  lessonKind?: "personal" | "shared";
  studentName: string;
  studentColor: string;
  studentId: string;
  lessonPlan: string | null;
  date: string;
  workSampleCount: number;
  workSampleImageIds: string[];
  isMakeup?: boolean;
  exiting?: boolean;
  showNoteButton?: boolean;
  showStudentName?: boolean;
  onNoteClick: (target: {
    studentId: string;
    lessonId: string;
    lessonPlan: string | null;
    lessonKind?: "personal" | "shared";
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
  lessonKind = "personal",
  studentName,
  studentColor,
  studentId,
  lessonPlan,
  date: _date,
  workSampleCount,
  workSampleImageIds,
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
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [selectedSampleImageId, setSelectedSampleImageId] = useState<
    string | null
  >(null);
  const [sampleZoom, setSampleZoom] = useState(1);
  const colors = getColorClasses(studentColor);
  const isCompleted = status === "completed";

  function handleToggle() {
    startTransition(async () => {
      if (lessonKind === "shared") {
        if (isCompleted) {
          await uncompleteSharedLesson(lessonId);
        } else {
          await completeSharedLesson(lessonId);
        }
        return;
      }

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
        if (lessonKind === "shared") {
          await bumpSharedLesson(lessonId);
        } else {
          await bumpLesson(lessonId);
        }
      });
    }, 300);
  }

  function handleDelete() {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setMenuOpen(false);
    setDeleting(true);
    startTransition(async () => {
      if (lessonKind === "shared") {
        await deleteSharedLesson(lessonId);
      } else {
        await deleteLesson(lessonId);
      }
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
              {workSampleCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  title={`${workSampleCount} work samples`}
                >
                  <Paperclip className="h-2.5 w-2.5" />
                  {workSampleCount}
                </span>
              )}
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
              ) : lessonKind === "shared" ? (
                `Shared \u00b7 ${resourceName}`
              ) : (
                `${subjectName} \u00b7 ${resourceName}`
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
                  lessonKind,
                })
              }
              title="Add note"
              disabled={deleting}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          {workSampleCount > 0 && (
            <Dialog
              open={samplesOpen}
              onOpenChange={(open) => {
                setSamplesOpen(open);
                if (!open) {
                  setSelectedSampleImageId(null);
                  setSampleZoom(1);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  title="View work samples"
                  disabled={deleting}
                >
                  <Images className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Work Samples ({workSampleCount})</DialogTitle>
                </DialogHeader>
                {selectedSampleImageId && (
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setSampleZoom((value) => Math.max(1, value - 0.25))
                        }
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="w-14 text-center text-xs text-muted-foreground">
                        {Math.round(sampleZoom * 100)}%
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setSampleZoom((value) => Math.min(4, value + 0.25))
                        }
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-[50vh] overflow-auto rounded-md border bg-muted/20 p-2">
                      <Image
                        src={`/api/curriculum-images/${selectedSampleImageId}`}
                        alt="Work sample"
                        width={1280}
                        height={960}
                        className="mx-auto h-auto max-w-none origin-top rounded-md"
                        style={{ transform: `scale(${sampleZoom})` }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                  {workSampleImageIds.map((imageId) => (
                    <button
                      key={imageId}
                      type="button"
                      onClick={() => {
                        setSelectedSampleImageId(imageId);
                        setSampleZoom(1);
                      }}
                    >
                      <Image
                        src={`/api/curriculum-images/${imageId}`}
                        alt="Work sample"
                        width={640}
                        height={480}
                        className="h-32 w-full rounded-md border object-cover"
                      />
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
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
