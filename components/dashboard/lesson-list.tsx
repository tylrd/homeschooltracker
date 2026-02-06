"use client";

import { useState } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentColorDot } from "@/components/student-color-dot";
import { LessonCard } from "@/components/dashboard/lesson-card";
import { NoteDialog } from "@/components/dashboard/note-dialog";
import { AbsenceDialog } from "@/components/dashboard/absence-dialog";
import { getAbsenceColorClasses } from "@/lib/absence-colors";
import { cn } from "@/lib/utils";

type DashboardLesson = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  lessonStatus: string;
  resourceName: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentColor: string;
};

type Note = {
  studentId: string;
  content: string;
};

type AbsenceReason = {
  id: string;
  name: string;
  color: string;
};

type AbsenceInfo = {
  absenceId: string;
  reasonName: string;
  reasonColor: string;
};

export function LessonList({
  lessons,
  notes,
  date,
  reasons,
  absenceMap,
}: {
  lessons: DashboardLesson[];
  notes: Note[];
  date: string;
  reasons: AbsenceReason[];
  absenceMap: Record<string, AbsenceInfo>;
}) {
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);
  const [absenceTarget, setAbsenceTarget] = useState<{
    studentId: string | null;
    studentName: string | null;
  } | null>(null);

  // Group by student
  const byStudent = new Map<
    string,
    { name: string; color: string; lessons: DashboardLesson[] }
  >();
  for (const lesson of lessons) {
    const existing = byStudent.get(lesson.studentId);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      byStudent.set(lesson.studentId, {
        name: lesson.studentName,
        color: lesson.studentColor,
        lessons: [lesson],
      });
    }
  }

  const noteForStudent = (studentId: string) =>
    notes.find((n) => n.studentId === studentId)?.content ?? "";

  return (
    <>
      <div className="space-y-4">
        {Array.from(byStudent.entries()).map(([studentId, group]) => {
          const absence = absenceMap[studentId];
          return (
            <div key={studentId} className="space-y-2">
              <div className="flex items-center gap-2">
                <StudentColorDot color={group.color} className="h-3 w-3" />
                <h2 className="text-sm font-semibold">{group.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {
                    group.lessons.filter((l) => l.lessonStatus === "completed")
                      .length
                  }
                  /{group.lessons.length}
                </span>
                {absence && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      getAbsenceColorClasses(absence.reasonColor).bg,
                      getAbsenceColorClasses(absence.reasonColor).text,
                    )}
                  >
                    {absence.reasonName}
                  </span>
                )}
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() =>
                    setAbsenceTarget({
                      studentId,
                      studentName: group.name,
                    })
                  }
                >
                  <UserX className="mr-1 h-3 w-3" />
                  Absent
                </Button>
              </div>
              <div className="space-y-2">
                {group.lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.lessonId}
                    lessonId={lesson.lessonId}
                    lessonNumber={lesson.lessonNumber}
                    lessonTitle={lesson.lessonTitle}
                    status={lesson.lessonStatus}
                    resourceName={lesson.resourceName}
                    subjectName={lesson.subjectName}
                    studentColor={lesson.studentColor}
                    studentId={lesson.studentId}
                    onNoteClick={setNoteStudentId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <NoteDialog
        studentId={noteStudentId}
        date={date}
        initialContent={noteStudentId ? noteForStudent(noteStudentId) : ""}
        onClose={() => setNoteStudentId(null)}
      />

      <AbsenceDialog
        open={absenceTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAbsenceTarget(null);
        }}
        studentId={absenceTarget?.studentId ?? null}
        studentName={absenceTarget?.studentName ?? null}
        date={date}
        reasons={reasons}
        existingAbsence={
          absenceTarget?.studentId
            ? (absenceMap[absenceTarget.studentId] ?? null)
            : null
        }
      />
    </>
  );
}
