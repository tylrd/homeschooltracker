"use client";

import { useState } from "react";
import { StudentColorDot } from "@/components/student-color-dot";
import { LessonCard } from "@/components/dashboard/lesson-card";
import { NoteDialog } from "@/components/dashboard/note-dialog";

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

export function LessonList({
  lessons,
  notes,
  date,
}: {
  lessons: DashboardLesson[];
  notes: Note[];
  date: string;
}) {
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);

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
        {Array.from(byStudent.entries()).map(([studentId, group]) => (
          <div key={studentId} className="space-y-2">
            <div className="flex items-center gap-2">
              <StudentColorDot color={group.color} className="h-3 w-3" />
              <h2 className="text-sm font-semibold">{group.name}</h2>
              <span className="text-xs text-muted-foreground">
                {group.lessons.filter((l) => l.lessonStatus === "completed").length}
                /{group.lessons.length}
              </span>
            </div>
            <div className="space-y-1">
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
        ))}
      </div>

      <NoteDialog
        studentId={noteStudentId}
        date={date}
        initialContent={noteStudentId ? noteForStudent(noteStudentId) : ""}
        onClose={() => setNoteStudentId(null)}
      />
    </>
  );
}
