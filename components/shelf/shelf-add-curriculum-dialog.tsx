"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPersonalCurriculumFromShelf } from "@/lib/actions/resources";
import { createSharedCurriculum } from "@/lib/actions/shared-curricula";

type StudentOption = {
  id: string;
  name: string;
  color: string;
  subjects: { id: string; name: string }[];
};

type FlowMode = "choose" | "personal" | "shared";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function ShelfAddCurriculumDialog({
  students,
}: {
  students: StudentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<FlowMode>("choose");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [personalStudentId, setPersonalStudentId] = useState("");
  const [personalSubjectId, setPersonalSubjectId] = useState("");
  const [personalNewSubjectName, setPersonalNewSubjectName] = useState("");
  const [personalName, setPersonalName] = useState("");

  const [sharedName, setSharedName] = useState("");
  const [sharedDescription, setSharedDescription] = useState("");
  const [sharedStudentIds, setSharedStudentIds] = useState<Set<string>>(
    new Set(),
  );

  const personalCoverRef = useRef<HTMLInputElement>(null);
  const sharedCoverRef = useRef<HTMLInputElement>(null);
  const hasStudents = students.length > 0;

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === personalStudentId) ?? null,
    [personalStudentId, students],
  );

  const canSubmitPersonal =
    !!personalStudentId &&
    !!personalName.trim() &&
    (!!personalSubjectId || !!personalNewSubjectName.trim());
  const canSubmitShared = !!sharedName.trim();

  function resetState() {
    setFlow("choose");
    setError(null);

    setPersonalStudentId("");
    setPersonalSubjectId("");
    setPersonalNewSubjectName("");
    setPersonalName("");
    if (personalCoverRef.current) {
      personalCoverRef.current.value = "";
    }

    setSharedName("");
    setSharedDescription("");
    setSharedStudentIds(new Set());
    if (sharedCoverRef.current) {
      sharedCoverRef.current.value = "";
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState();
    }
    setOpen(nextOpen);
  }

  function handleBack() {
    setFlow("choose");
    setError(null);
  }

  function toggleSharedStudent(studentId: string) {
    setSharedStudentIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }

  function submitPersonal() {
    if (!canSubmitPersonal) return;
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("studentId", personalStudentId);
        formData.set("name", personalName.trim());
        if (personalSubjectId) {
          formData.set("subjectId", personalSubjectId);
        }
        if (personalNewSubjectName.trim()) {
          formData.set("newSubjectName", personalNewSubjectName.trim());
        }
        const file = personalCoverRef.current?.files?.[0];
        if (file) {
          formData.set("coverImage", file);
        }
        await createPersonalCurriculumFromShelf(formData);
        handleOpenChange(false);
      } catch (submitError) {
        setError(getErrorMessage(submitError));
      }
    });
  }

  function submitShared() {
    if (!canSubmitShared) return;
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", sharedName.trim());
        formData.set("description", sharedDescription.trim());
        const file = sharedCoverRef.current?.files?.[0];
        if (file) {
          formData.set("coverImage", file);
        }
        for (const studentId of sharedStudentIds) {
          formData.append("studentIds", studentId);
        }

        await createSharedCurriculum(formData);
        handleOpenChange(false);
      } catch (submitError) {
        setError(getErrorMessage(submitError));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label="Add Curriculum"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {flow === "choose" ? (
              "Add Curriculum"
            ) : (
              <span className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleBack}
                  disabled={isPending}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {flow === "personal"
                  ? "Singular Student Curriculum"
                  : "Shared Curriculum"}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {flow === "choose" && (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3 text-left"
              onClick={() => {
                setFlow("personal");
                setError(null);
              }}
              disabled={!hasStudents}
            >
              Singular Student Curriculum
            </Button>
            {!hasStudents && (
              <p className="text-xs text-muted-foreground">
                Add a student first to create personal curriculum.
              </p>
            )}

            <Button
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3 text-left"
              onClick={() => {
                setFlow("shared");
                setError(null);
              }}
            >
              Shared Curriculum
            </Button>
          </div>
        )}

        {flow === "personal" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={personalStudentId}
                onValueChange={(value) => {
                  setPersonalStudentId(value);
                  setPersonalSubjectId("");
                  setPersonalNewSubjectName("");
                  setError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Existing Subject</Label>
              <Select
                value={personalSubjectId || "__none__"}
                onValueChange={(value) =>
                  setPersonalSubjectId(value === "__none__" ? "" : value)
                }
                disabled={!selectedStudent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose existing subject..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No subject selected</SelectItem>
                  {selectedStudent?.subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-subject">New Subject (optional)</Label>
              <Input
                id="new-subject"
                value={personalNewSubjectName}
                onChange={(event) =>
                  setPersonalNewSubjectName(event.target.value)
                }
                placeholder="Create subject instead..."
                disabled={!selectedStudent}
              />
              <p className="text-xs text-muted-foreground">
                Entering a new subject overrides the existing subject selection.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personal-name">Curriculum Name</Label>
              <Input
                id="personal-name"
                value={personalName}
                onChange={(event) => setPersonalName(event.target.value)}
                placeholder="Math-U-See Beta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personal-cover">Cover Image (optional)</Label>
              <Input
                id="personal-cover"
                ref={personalCoverRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full"
              onClick={submitPersonal}
              disabled={isPending || !canSubmitPersonal}
            >
              {isPending ? "Creating..." : "Create Curriculum"}
            </Button>
          </div>
        )}

        {flow === "shared" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shared-name">Name</Label>
              <Input
                id="shared-name"
                value={sharedName}
                onChange={(event) => setSharedName(event.target.value)}
                placeholder="Morning Group Reading"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-description">Description (optional)</Label>
              <Textarea
                id="shared-description"
                value={sharedDescription}
                onChange={(event) => setSharedDescription(event.target.value)}
                placeholder="Optional details..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-cover">Cover Image (optional)</Label>
              <Input
                id="shared-cover"
                ref={sharedCoverRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
            </div>

            <div className="space-y-2">
              <Label>Students (optional)</Label>
              {students.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No students yet. You can add memberships later.
                </p>
              ) : (
                <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-2">
                  {students.map((student) => {
                    const checkboxId = `shared-student-${student.id}`;
                    return (
                      <label
                        key={student.id}
                        htmlFor={checkboxId}
                        className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted/50"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={sharedStudentIds.has(student.id)}
                          onCheckedChange={() =>
                            toggleSharedStudent(student.id)
                          }
                        />
                        <StudentColorDot
                          color={student.color}
                          className="h-3 w-3"
                        />
                        <span className="text-sm">{student.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full"
              onClick={submitShared}
              disabled={isPending || !canSubmitShared}
            >
              {isPending ? "Creating..." : "Create Shared Curriculum"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
