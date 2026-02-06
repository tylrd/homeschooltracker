"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createResource } from "@/lib/actions/resources";

export function ResourceForm({
  subjectId,
  studentId,
}: {
  subjectId: string;
  studentId: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("subjectId", subjectId);
    formData.set("studentId", studentId);
    await createResource(formData);
    setIsAdding(false);
    formRef.current?.reset();
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        Add resource
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <Input
        name="name"
        placeholder="Resource name"
        required
        autoFocus
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" className="h-8">
        Add
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={() => setIsAdding(false)}
      >
        Cancel
      </Button>
    </form>
  );
}
