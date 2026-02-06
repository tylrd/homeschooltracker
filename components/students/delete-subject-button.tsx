"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSubject } from "@/lib/actions/subjects";

export function DeleteSubjectButton({
  subjectId,
  studentId,
}: {
  subjectId: string;
  studentId: string;
}) {
  async function handleDelete() {
    if (!confirm("Delete this subject and all its resources?")) return;
    await deleteSubject(subjectId, studentId);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-destructive hover:text-destructive"
      onClick={handleDelete}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}
