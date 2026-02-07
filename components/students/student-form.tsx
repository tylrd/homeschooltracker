"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Student } from "@/db/schema";
import { createStudent, updateStudent } from "@/lib/actions/students";
import { STUDENT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StudentForm({
  student,
  trigger,
}: {
  student?: Student;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    student?.color ?? STUDENT_COLORS[0].value,
  );
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("color", selectedColor);
    if (student) {
      await updateStudent(student.id, formData);
    } else {
      await createStudent(formData);
    }
    setOpen(false);
    formRef.current?.reset();
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{student ? "Edit Student" : "Add Student"}</DrawerTitle>
        </DrawerHeader>
        <form
          ref={formRef}
          action={handleSubmit}
          className="space-y-4 px-4 pb-8"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Student name"
              defaultValue={student?.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level</Label>
            <Input
              id="gradeLevel"
              name="gradeLevel"
              placeholder="e.g. 3rd Grade"
              defaultValue={student?.gradeLevel ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {STUDENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    color.dot,
                    selectedColor === color.value
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "opacity-60 hover:opacity-100",
                  )}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">
            {student ? "Save Changes" : "Add Student"}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
