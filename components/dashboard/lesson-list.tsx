"use client";

import { Eye, EyeOff, Plus, UserX } from "lucide-react";
import { useState } from "react";
import { AbsenceDialog } from "@/components/dashboard/absence-dialog";
import { AddLessonDialog } from "@/components/dashboard/add-lesson-dialog";
import { LessonCard } from "@/components/dashboard/lesson-card";
import { NoteDialog } from "@/components/dashboard/note-dialog";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAbsenceColorClasses } from "@/lib/absence-colors";
import { cn } from "@/lib/utils";

type DashboardLesson = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  lessonStatus: string;
  resourceId: string;
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

type StudentResource = {
  resourceId: string;
  resourceName: string;
  subjectName: string;
};

type StudentSummary = {
  id: string;
  name: string;
  color: string;
};

export function LessonList({
  lessons,
  notes,
  date,
  reasons,
  absenceMap,
  defaultShowCompleted,
  grouping = "student",
  showNoteButtons = true,
  studentResourceMap = {},
  allStudents = [],
}: {
  lessons: DashboardLesson[];
  notes: Note[];
  date: string;
  reasons: AbsenceReason[];
  absenceMap: Record<string, AbsenceInfo>;
  defaultShowCompleted: boolean;
  grouping?: "student" | "subject";
  showNoteButtons?: boolean;
  studentResourceMap?: Record<string, StudentResource[]>;
  allStudents?: StudentSummary[];
}) {
  // Per-student overrides: true/false means explicitly toggled, absent means use global
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [hidingStudents, setHidingStudents] = useState<Set<string>>(new Set());
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);
  const [absenceTarget, setAbsenceTarget] = useState<{
    studentId: string | null;
    studentName: string | null;
  } | null>(null);
  const [addLessonTarget, setAddLessonTarget] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);

  // Group by student
  const byStudent = new Map<
    string,
    { name: string; color: string; lessons: DashboardLesson[] }
  >();
  for (const student of allStudents) {
    byStudent.set(student.id, {
      name: student.name,
      color: student.color,
      lessons: [],
    });
  }
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

  // Group by subject
  const bySubject = new Map<
    string,
    { name: string; lessons: DashboardLesson[] }
  >();
  if (grouping === "subject") {
    for (const lesson of lessons) {
      const existing = bySubject.get(lesson.subjectName);
      if (existing) {
        existing.lessons.push(lesson);
      } else {
        bySubject.set(lesson.subjectName, {
          name: lesson.subjectName,
          lessons: [lesson],
        });
      }
    }
  }

  const noteForStudent = (studentId: string) =>
    notes.find((n) => n.studentId === studentId)?.content ?? "";

  return (
    <>
      <div className="space-y-4">
        {grouping === "subject"
          ? Array.from(bySubject.entries()).map(([subjectName, group]) => (
              <div key={subjectName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{subjectName}</h2>
                  <span className="text-xs text-muted-foreground">
                    {
                      group.lessons.filter(
                        (l) => l.lessonStatus === "completed",
                      ).length
                    }
                    /{group.lessons.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.lessons
                    .filter(
                      (l) =>
                        defaultShowCompleted || l.lessonStatus !== "completed",
                    )
                    .map((lesson) => (
                      <LessonCard
                        key={lesson.lessonId}
                        lessonId={lesson.lessonId}
                        lessonNumber={lesson.lessonNumber}
                        lessonTitle={lesson.lessonTitle}
                        status={lesson.lessonStatus}
                        resourceId={lesson.resourceId}
                        resourceName={lesson.resourceName}
                        subjectName={lesson.subjectName}
                        studentName={lesson.studentName}
                        studentColor={lesson.studentColor}
                        studentId={lesson.studentId}
                        date={date}
                        showNoteButton={showNoteButtons}
                        showStudentName
                        onNoteClick={setNoteStudentId}
                      />
                    ))}
                </div>
              </div>
            ))
          : Array.from(byStudent.entries()).map(([studentId, group]) => {
              const absence = absenceMap[studentId];
              return (
                <div key={studentId} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StudentColorDot color={group.color} className="h-3 w-3" />
                    <h2 className="text-sm font-semibold">{group.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {
                        group.lessons.filter(
                          (l) => l.lessonStatus === "completed",
                        ).length
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
                    <TooltipProvider>
                      <div className="flex items-center">
                        {(() => {
                          const studentShow =
                            overrides[studentId] ?? defaultShowCompleted;
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground"
                                  onClick={() => {
                                    if (studentShow) {
                                      setHidingStudents((s) =>
                                        new Set(s).add(studentId),
                                      );
                                      setTimeout(() => {
                                        setOverrides((prev) => ({
                                          ...prev,
                                          [studentId]: false,
                                        }));
                                        setHidingStudents((s) => {
                                          const next = new Set(s);
                                          next.delete(studentId);
                                          return next;
                                        });
                                      }, 300);
                                    } else {
                                      setOverrides((prev) => ({
                                        ...prev,
                                        [studentId]: true,
                                      }));
                                    }
                                  }}
                                >
                                  {studentShow ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {studentShow
                                  ? "Hide completed"
                                  : "Show completed"}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() =>
                                setAddLessonTarget({
                                  studentId,
                                  studentName: group.name,
                                })
                              }
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add Lesson</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() =>
                                setAbsenceTarget({
                                  studentId,
                                  studentName: group.name,
                                })
                              }
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Absent</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const studentShow =
                        overrides[studentId] ?? defaultShowCompleted;
                      const visible = studentShow
                        ? group.lessons
                        : group.lessons.filter(
                            (l) => l.lessonStatus !== "completed",
                          );

                      if (visible.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            No lessons scheduled.
                          </p>
                        );
                      }

                      const resourceCount = new Map<string, number>();
                      for (const l of visible) {
                        resourceCount.set(
                          l.resourceId,
                          (resourceCount.get(l.resourceId) ?? 0) + 1,
                        );
                      }
                      const resourceSeen = new Set<string>();
                      return visible.map((lesson) => {
                        const isDuplicate = resourceSeen.has(lesson.resourceId);
                        resourceSeen.add(lesson.resourceId);
                        const hasDuplicates =
                          (resourceCount.get(lesson.resourceId) ?? 0) > 1;
                        return (
                          <LessonCard
                            key={lesson.lessonId}
                            lessonId={lesson.lessonId}
                            lessonNumber={lesson.lessonNumber}
                            lessonTitle={lesson.lessonTitle}
                            status={lesson.lessonStatus}
                            resourceId={lesson.resourceId}
                            resourceName={lesson.resourceName}
                            subjectName={lesson.subjectName}
                            studentName={lesson.studentName}
                            studentColor={lesson.studentColor}
                            studentId={lesson.studentId}
                            date={date}
                            isMakeup={hasDuplicates && isDuplicate}
                            exiting={
                              hidingStudents.has(studentId) &&
                              lesson.lessonStatus === "completed"
                            }
                            showNoteButton={showNoteButtons}
                            onNoteClick={setNoteStudentId}
                          />
                        );
                      });
                    })()}
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

      <AddLessonDialog
        open={addLessonTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAddLessonTarget(null);
        }}
        studentId={addLessonTarget?.studentId ?? ""}
        studentName={addLessonTarget?.studentName ?? ""}
        date={date}
        resources={
          addLessonTarget
            ? (studentResourceMap[addLessonTarget.studentId] ?? [])
            : []
        }
        todayResourceIds={new Set(lessons.map((l) => l.resourceId))}
      />
    </>
  );
}
