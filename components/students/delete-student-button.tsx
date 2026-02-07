"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteStudent } from "@/lib/actions/students";

export function DeleteStudentButton({ studentId }: { studentId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this student and all their data?")) return;
    await deleteStudent(studentId);
    router.push("/students");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
