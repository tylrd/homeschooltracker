"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { suggestLessonTitleFromImage } from "@/lib/actions/lesson-title-suggestions";
import {
  getUpcomingPlannedLessons,
  scheduleMakeupLesson,
  updateLessonScheduledDate,
} from "@/lib/actions/lessons";

type Resource = {
  resourceId: string;
  resourceName: string;
  subjectName: string;
};

type UpcomingLesson = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  scheduledDate: string | null;
  resourceName: string;
  subjectName: string;
};

type SelectedResource = {
  resourceId: string;
  resourceName: string;
  subjectName: string;
};

export function AddLessonDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  date,
  resources,
  todayResourceIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  date: string;
  resources: Resource[];
  todayResourceIds: Set<string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [upcoming, setUpcoming] = useState<UpcomingLesson[] | null>(null);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  // Second screen state for "Add New"
  const [selected, setSelected] = useState<SelectedResource | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isAnalyzingCover, setIsAnalyzingCover] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(
    null,
  );
  const [titleEdited, setTitleEdited] = useState(false);
  const titleEditedRef = useRef(false);
  const coverImageRef = useRef<HTMLInputElement>(null);

  function setTitleEditedState(value: boolean) {
    titleEditedRef.current = value;
    setTitleEdited(value);
  }

  function handleSelectResource(resource: SelectedResource) {
    setSelected(resource);
    setTitle("");
    setNotes("");
    setTitleEditedState(false);
    setSuggestionMessage(null);
    setIsAnalyzingCover(false);
    if (coverImageRef.current) {
      coverImageRef.current.value = "";
    }
  }

  function handleBack() {
    setSelected(null);
    setTitle("");
    setNotes("");
    setTitleEditedState(false);
    setSuggestionMessage(null);
    setIsAnalyzingCover(false);
    if (coverImageRef.current) {
      coverImageRef.current.value = "";
    }
  }

  function handleConfirmAdd() {
    if (!selected) return;
    startTransition(async () => {
      await scheduleMakeupLesson(selected.resourceId, date, {
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.refresh();
      handleOpenChange(false);
    });
  }

  function handleMoveExisting(lessonId: string) {
    startTransition(async () => {
      await updateLessonScheduledDate(lessonId, date);
      router.refresh();
      handleOpenChange(false);
    });
  }

  function handleTabChange(value: string) {
    if (value === "move" && upcoming === null && !loadingUpcoming) {
      setLoadingUpcoming(true);
      getUpcomingPlannedLessons(studentId, date).then((rows) => {
        setUpcoming(rows);
        setLoadingUpcoming(false);
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setUpcoming(null);
      setLoadingUpcoming(false);
      setSelected(null);
      setTitle("");
      setNotes("");
      setTitleEditedState(false);
      setSuggestionMessage(null);
      setIsAnalyzingCover(false);
      if (coverImageRef.current) {
        coverImageRef.current.value = "";
      }
    }
    onOpenChange(nextOpen);
  }

  async function handleCoverImageChange(file: File | null) {
    if (!file || !selected) {
      setSuggestionMessage(null);
      return;
    }

    setIsAnalyzingCover(true);
    setSuggestionMessage(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("resourceName", selected.resourceName);
      const result = await suggestLessonTitleFromImage(formData);

      if (result.reason === "ok" && result.suggestedTitle) {
        if (!titleEditedRef.current) {
          setTitle(result.suggestedTitle);
        }
        setSuggestionMessage(`Suggested title: ${result.suggestedTitle}`);
        return;
      }

      if (result.reason === "invalid_image") {
        setSuggestionMessage(
          "Could not analyze that file. Use JPG, PNG, or WEBP.",
        );
      } else if (result.reason === "no_text") {
        setSuggestionMessage("No readable book title found in image.");
      } else {
        setSuggestionMessage(
          "Suggestion unavailable. You can still add manually.",
        );
      }
    } finally {
      setIsAnalyzingCover(false);
    }
  }

  // Group resources by subject
  const bySubject = new Map<string, Resource[]>();
  for (const r of resources) {
    const existing = bySubject.get(r.subjectName);
    if (existing) {
      existing.push(r);
    } else {
      bySubject.set(r.subjectName, [r]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {selected ? (
              <span className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleBack}
                  disabled={isPending}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                New {selected.resourceName} Lesson
              </span>
            ) : (
              `Add Lesson for ${studentName}`
            )}
          </DialogTitle>
        </DialogHeader>

        {selected ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {selected.subjectName} &middot; {selected.resourceName}
            </p>
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Name</Label>
              <Input
                id="lesson-title"
                placeholder="Leave blank for default"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!titleEdited) {
                    setTitleEditedState(true);
                  }
                }}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-cover">Cover Photo (optional)</Label>
              <Input
                id="lesson-cover"
                ref={coverImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isPending || isAnalyzingCover}
                onChange={(e) =>
                  void handleCoverImageChange(e.target.files?.[0] ?? null)
                }
              />
              {isAnalyzingCover && (
                <p className="text-xs text-muted-foreground">
                  Analyzing cover...
                </p>
              )}
              {!isAnalyzingCover && suggestionMessage && (
                <p className="text-xs text-muted-foreground">
                  {suggestionMessage}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-notes">Notes</Label>
              <Textarea
                id="lesson-notes"
                placeholder="Optional lesson notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleConfirmAdd}
              disabled={isPending}
            >
              Add Lesson
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="new" onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="new">Add New</TabsTrigger>
              <TabsTrigger value="move">Move Existing</TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {Array.from(bySubject.entries()).map(
                  ([subjectName, subjectResources]) => (
                    <div key={subjectName} className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {subjectName}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {subjectResources.map((r) => {
                          const isScheduled = todayResourceIds.has(
                            r.resourceId,
                          );
                          return (
                            <Button
                              key={r.resourceId}
                              variant="outline"
                              onClick={() => handleSelectResource(r)}
                              className="justify-between"
                            >
                              <span className="text-sm">{r.resourceName}</span>
                              {isScheduled && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  Scheduled
                                </Badge>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )}
                {resources.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No resources found for this student.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="move">
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                {loadingUpcoming && (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                )}
                {upcoming && upcoming.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No upcoming planned lessons to move.
                  </p>
                )}
                {upcoming?.map((lesson) => (
                  <Button
                    key={lesson.lessonId}
                    variant="outline"
                    onClick={() => handleMoveExisting(lesson.lessonId)}
                    disabled={isPending}
                    className="w-full justify-start"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {lesson.lessonTitle ?? `Lesson ${lesson.lessonNumber}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.subjectName} &middot; {lesson.resourceName}
                        {lesson.scheduledDate && (
                          <> &middot; {lesson.scheduledDate}</>
                        )}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
