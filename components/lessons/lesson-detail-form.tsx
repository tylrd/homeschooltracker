"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeLesson,
  deleteLesson,
  uncompleteLesson,
  updateLessonContent,
  updateLessonScheduledDate,
} from "@/lib/actions/lessons";

type LessonDetailFormProps = {
  lessonId: string;
  title: string | null;
  status: string;
  plan: string | null;
  notes: string | null;
  scheduledDate: string | null;
};

export function LessonDetailForm({
  lessonId,
  title,
  status,
  plan,
  notes,
  scheduledDate,
}: LessonDetailFormProps) {
  const router = useRouter();
  const [planText, setPlanText] = useState(plan ?? "");
  const [notesText, setNotesText] = useState(notes ?? "");
  const [titleText, setTitleText] = useState(title ?? "");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = status === "completed";
  const savedPlan = plan ?? "";
  const savedNotes = notes ?? "";
  const savedTitle = title ?? "";
  const hasChanges =
    titleText !== savedTitle ||
    planText !== savedPlan ||
    notesText !== savedNotes;

  function handleToggle() {
    startTransition(async () => {
      if (isCompleted) {
        await uncompleteLesson(lessonId);
      } else {
        await completeLesson(lessonId);
      }
    });
  }

  function handleDateChange(newDate: string) {
    startTransition(async () => {
      await updateLessonScheduledDate(lessonId, newDate);
      toast.success("Date updated");
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateLessonContent(lessonId, titleText, planText, notesText);
      toast.success("Lesson saved");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setIsDeleting(true);
    startTransition(async () => {
      await deleteLesson(lessonId);
      toast.success("Lesson deleted");
      router.back();
      setTimeout(() => {
        router.replace("/");
      }, 200);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Checkbox
          id="completed"
          checked={isCompleted}
          onCheckedChange={handleToggle}
          className="h-6 w-6 rounded-md"
          disabled={isPending}
        />
        <Label htmlFor="completed" className="text-sm font-medium">
          Mark as completed
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Scheduled Date</Label>
        <DatePicker
          value={scheduledDate ?? ""}
          onChange={handleDateChange}
          placeholder="No date scheduled"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Lesson Name</Label>
        <Input
          id="title"
          placeholder="Lesson name"
          value={titleText}
          onChange={(e) => setTitleText(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <Textarea
          id="plan"
          rows={6}
          placeholder="What to cover in this lesson..."
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={6}
          placeholder="How did the lesson go?"
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          disabled={isPending}
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={!hasChanges || isPending}
      >
        {isPending ? "Saving..." : "Save"}
      </Button>

      <Button
        variant="outline"
        className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
        disabled={isPending || isDeleting}
        onClick={handleDelete}
      >
        <Trash2 className="mr-1 h-4 w-4" />
        {isDeleting ? "Deleting..." : "Delete Lesson"}
      </Button>
    </div>
  );
}
