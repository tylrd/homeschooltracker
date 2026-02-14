"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLessonPlan } from "@/lib/actions/lessons";
import { upsertNote } from "@/lib/actions/notes";
import { updateSharedLessonPlan } from "@/lib/actions/shared-lessons";

type NoteTarget = {
  studentId: string;
  lessonId: string;
  lessonKind?: "personal" | "shared";
};

function NoteForm({
  target,
  date,
  plan,
  note,
  onPlanChange,
  onNoteChange,
  onClose,
}: {
  target: NoteTarget;
  date: string;
  plan: string;
  note: string;
  onPlanChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await Promise.all([
        target.lessonKind === "shared"
          ? updateSharedLessonPlan(target.lessonId, plan)
          : updateLessonPlan(target.lessonId, plan),
        upsertNote(target.studentId, date, note),
      ]);
      onClose();
    });
  }

  return (
    <div className="space-y-4 px-4 pb-8">
      <div className="space-y-2">
        <Label htmlFor="daily-plan">Daily plan</Label>
        <Textarea
          id="daily-plan"
          value={plan}
          onChange={(e) => onPlanChange(e.target.value)}
          placeholder="What is the plan for today?"
          rows={3}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="daily-note">Note</Label>
        <Textarea
          id="daily-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="How did today go?"
          rows={4}
        />
      </div>
      <Button onClick={handleSave} className="w-full" disabled={isPending}>
        Save Note
      </Button>
    </div>
  );
}

export function NoteDialog({
  target,
  date,
  plan,
  note,
  onPlanChange,
  onNoteChange,
  onClose,
}: {
  target: NoteTarget | null;
  date: string;
  plan: string;
  note: string;
  onPlanChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Drawer open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Daily Note</DrawerTitle>
        </DrawerHeader>
        {target && (
          <NoteForm
            target={target}
            date={date}
            plan={plan}
            note={note}
            onPlanChange={onPlanChange}
            onNoteChange={onNoteChange}
            onClose={onClose}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
