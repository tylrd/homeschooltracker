"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  completeLesson,
  uncompleteLesson,
  updateLessonContent,
} from "@/lib/actions/lessons";

type LessonDetailFormProps = {
  lessonId: string;
  status: string;
  plan: string | null;
  notes: string | null;
};

export function LessonDetailForm({
  lessonId,
  status,
  plan,
  notes,
}: LessonDetailFormProps) {
  const [planText, setPlanText] = useState(plan ?? "");
  const [notesText, setNotesText] = useState(notes ?? "");
  const [isPending, startTransition] = useTransition();

  const isCompleted = status === "completed";
  const savedPlan = plan ?? "";
  const savedNotes = notes ?? "";
  const hasChanges = planText !== savedPlan || notesText !== savedNotes;

  function handleToggle() {
    startTransition(async () => {
      if (isCompleted) {
        await uncompleteLesson(lessonId);
      } else {
        await completeLesson(lessonId);
      }
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateLessonContent(lessonId, planText, notesText);
      toast.success("Lesson saved");
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
    </div>
  );
}
