"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { upsertNote } from "@/lib/actions/notes";

function NoteForm({
  studentId,
  date,
  initialContent,
  onClose,
}: {
  studentId: string;
  date: string;
  initialContent: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await upsertNote(studentId, date, content);
      onClose();
    });
  }

  return (
    <div className="space-y-4 px-4 pb-8">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="How did today go?"
        rows={4}
        autoFocus
      />
      <Button onClick={handleSave} className="w-full" disabled={isPending}>
        Save Note
      </Button>
    </div>
  );
}

export function NoteDialog({
  studentId,
  date,
  initialContent,
  onClose,
}: {
  studentId: string | null;
  date: string;
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
            initialContent={initialContent}
            onClose={onClose}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
