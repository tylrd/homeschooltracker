"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { StudentColorDot } from "@/components/student-color-dot";
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
import { Textarea } from "@/components/ui/textarea";
import { suggestLessonTitleFromImage } from "@/lib/actions/lesson-title-suggestions";
import { scheduleMakeupSharedLesson } from "@/lib/actions/shared-lessons";

type SharedCurriculumOption = {
  sharedCurriculumId: string;
  sharedCurriculumName: string;
  students: { id: string; name: string; color: string }[];
  isScheduledToday: boolean;
};

export function AddSharedLessonDialog({
  open,
  onOpenChange,
  date,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  options: SharedCurriculumOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isAnalyzingCover, setIsAnalyzingCover] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(
    null,
  );
  const [titleEdited, setTitleEdited] = useState(false);
  const titleEditedRef = useRef(false);
  const coverImageRef = useRef<HTMLInputElement>(null);

  const selected =
    options.find((o) => o.sharedCurriculumId === selectedId) ?? null;

  function setTitleEditedState(value: boolean) {
    titleEditedRef.current = value;
    setTitleEdited(value);
  }

  function resetState() {
    setSelectedId(null);
    setTitle("");
    setNotes("");
    setTitleEditedState(false);
    setSuggestionMessage(null);
    setIsAnalyzingCover(false);
    if (coverImageRef.current) {
      coverImageRef.current.value = "";
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    if (!selected) return;
    startTransition(async () => {
      await scheduleMakeupSharedLesson(selected.sharedCurriculumId, date, {
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.refresh();
      handleOpenChange(false);
    });
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
      formData.set("sharedCurriculumName", selected.sharedCurriculumName);
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
                  onClick={() => setSelectedId(null)}
                  disabled={isPending}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Add Shared Lesson
              </span>
            ) : (
              "Add Shared Lesson"
            )}
          </DialogTitle>
        </DialogHeader>

        {selected ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              {selected.sharedCurriculumName}
            </p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {selected.students.length} students
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.students.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                  >
                    <StudentColorDot
                      color={student.color}
                      className="h-2.5 w-2.5"
                    />
                    {student.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shared-lesson-title">Lesson Name</Label>
              <Input
                id="shared-lesson-title"
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
              <Label htmlFor="shared-lesson-cover">
                Cover Photo (optional)
              </Label>
              <Input
                id="shared-lesson-cover"
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
              <Label htmlFor="shared-lesson-notes">Notes</Label>
              <Textarea
                id="shared-lesson-notes"
                placeholder="Optional lesson notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending}
            >
              Add Lesson
            </Button>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {options.map((option) => (
              <Button
                key={option.sharedCurriculumId}
                variant="outline"
                className="h-auto w-full justify-between py-2"
                onClick={() => {
                  setSelectedId(option.sharedCurriculumId);
                  setTitle("");
                  setNotes("");
                  setTitleEditedState(false);
                  setSuggestionMessage(null);
                  setIsAnalyzingCover(false);
                  if (coverImageRef.current) {
                    coverImageRef.current.value = "";
                  }
                }}
                disabled={isPending}
              >
                <span className="text-left">
                  <span className="block text-sm">
                    {option.sharedCurriculumName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.students.length} students
                  </span>
                </span>
                {option.isScheduledToday && (
                  <Badge variant="secondary" className="text-[10px]">
                    Scheduled
                  </Badge>
                )}
              </Button>
            ))}
            {options.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No shared curriculum found.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
