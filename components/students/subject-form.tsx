"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSubject } from "@/lib/actions/subjects";

export function SubjectForm({ studentId }: { studentId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("studentId", studentId);
    await createSubject(formData);
    setIsAdding(false);
    formRef.current?.reset();
  }

  if (!isAdding) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Add Subject
      </Button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <Input name="name" placeholder="Subject name" required autoFocus />
      <Button type="submit" size="sm">
        Add
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(false)}
      >
        Cancel
      </Button>
    </form>
  );
}
