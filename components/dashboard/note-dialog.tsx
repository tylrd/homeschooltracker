"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertNote } from "@/lib/actions/notes";

function NoteForm({
  studentId,
  date,
  initialDailyPlan,
  initialContent,
  onClose,
}: {
  studentId: string;
  date: string;
  initialDailyPlan: string;
  initialContent: string;
  onClose: () => void;
}) {
  const [dailyPlan, setDailyPlan] = useState(initialDailyPlan);
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await upsertNote(studentId, date, dailyPlan, content);
      onClose();
    });
  }

  return (
    <div className="space-y-4 px-4 pb-8">
      <div className="space-y-2">
        <Label htmlFor="daily-plan">Daily plan</Label>
        <Textarea
          id="daily-plan"
          value={dailyPlan}
          onChange={(e) => setDailyPlan(e.target.value)}
          placeholder="What is the plan for today?"
          rows={3}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="daily-note">Note</Label>
        <Textarea
          id="daily-note"
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
  studentId,
  date,
  initialDailyPlan,
  initialContent,
  onClose,
}: {
  studentId: string | null;
  date: string;
  initialDailyPlan: string;
  initialContent: string;
  onClose: () => void;
}) {
  return (
    <Drawer open={!!studentId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Daily Note</DrawerTitle>
        </DrawerHeader>
        {studentId && (
          <NoteForm
            key={studentId}
            studentId={studentId}
            date={date}
            initialDailyPlan={initialDailyPlan}
            initialContent={initialContent}
            onClose={onClose}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
