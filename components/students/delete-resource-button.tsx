"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteResource } from "@/lib/actions/resources";

export function DeleteResourceButton({
  resourceId,
  studentId,
}: {
  resourceId: string;
  studentId: string;
}) {
  async function handleDelete() {
    if (!confirm("Delete this resource and all its lessons?")) return;
    await deleteResource(resourceId, studentId);
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
