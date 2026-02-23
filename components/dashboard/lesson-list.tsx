"use client";

import { Eye, EyeOff, Plus, Users, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { AbsenceDialog } from "@/components/dashboard/absence-dialog";
import { AddLessonDialog } from "@/components/dashboard/add-lesson-dialog";
import { LessonCard } from "@/components/dashboard/lesson-card";
import { NoteDialog } from "@/components/dashboard/note-dialog";
import { SpinSubjectWheelDialog } from "@/components/dashboard/spin-subject-wheel-dialog";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAbsenceColorClasses } from "@/lib/absence-colors";
import { getWheelCandidates } from "@/lib/dashboard/spin-wheel";
import type { LessonMoodOption } from "@/lib/lesson-moods";
import { cn } from "@/lib/utils";

type DashboardLesson = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  lessonPlan: string | null;
  lessonMood: string | null;
  lessonStatus: string;
  resourceId: string;
  resourceName: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentColor: string;
  workSampleCount: number;
  workSampleImageIds: string[];
};

type DashboardSharedLesson = {
  sharedLessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  lessonPlan: string | null;
  lessonMood: string | null;
  lessonStatus: string;
  sharedCurriculumId: string;
  sharedCurriculumName: string;
  studentId: string;
  studentName: string;
  studentColor: string;
  workSampleCount: number;
  workSampleImageIds: string[];
};

type UnifiedLesson = {
  lessonKind: "personal" | "shared";
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  lessonPlan: string | null;
  lessonMood: string | null;
  lessonStatus: string;
  resourceId: string;
  resourceName: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentColor: string;
  workSampleCount: number;
  workSampleImageIds: string[];
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
  absenceId: string | null;
  reasonName: string;
  reasonColor: string;
  source: "individual" | "global";
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
  sharedLessons,
  notes,
  date,
  reasons,
  absenceMap,
  defaultShowCompleted,
  grouping = "student",
  defaultSharedLessonView = "group",
  showNoteButtons = true,
  moodOptions,
  studentResourceMap = {},
  allStudents = [],
  isStudentFiltered = false,
}: {
  lessons: DashboardLesson[];
  sharedLessons: DashboardSharedLesson[];
  notes: Note[];
  date: string;
  reasons: AbsenceReason[];
  absenceMap: Record<string, AbsenceInfo>;
  defaultShowCompleted: boolean;
  grouping?: "student" | "subject";
  defaultSharedLessonView?: "group" | "student";
  showNoteButtons?: boolean;
  moodOptions?: LessonMoodOption[];
  studentResourceMap?: Record<string, StudentResource[]>;
  allStudents?: StudentSummary[];
  isStudentFiltered?: boolean;
}) {
  const sharedLessonView = defaultSharedLessonView;
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [hidingStudents, setHidingStudents] = useState<Set<string>>(new Set());
  const [noteTarget, setNoteTarget] = useState<{
    studentId: string;
    lessonId: string;
    lessonPlan: string | null;
    lessonKind?: "personal" | "shared";
  } | null>(null);
  const [draftPlan, setDraftPlan] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [absenceTarget, setAbsenceTarget] = useState<{
    studentId: string | null;
    studentName: string | null;
  } | null>(null);
  const [addLessonTarget, setAddLessonTarget] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);

  const mergedLessons = useMemo<UnifiedLesson[]>(() => {
    const personal = lessons.map((lesson) => ({
      lessonKind: "personal" as const,
      lessonId: lesson.lessonId,
      lessonNumber: lesson.lessonNumber,
      lessonTitle: lesson.lessonTitle,
      lessonPlan: lesson.lessonPlan,
      lessonMood: lesson.lessonMood,
      lessonStatus: lesson.lessonStatus,
      resourceId: lesson.resourceId,
      resourceName: lesson.resourceName,
      subjectName: lesson.subjectName,
      studentId: lesson.studentId,
      studentName: lesson.studentName,
      studentColor: lesson.studentColor,
      workSampleCount: lesson.workSampleCount,
      workSampleImageIds: lesson.workSampleImageIds,
    }));

    const shared = sharedLessons.map((lesson) => ({
      lessonKind: "shared" as const,
      lessonId: lesson.sharedLessonId,
      lessonNumber: lesson.lessonNumber,
      lessonTitle: lesson.lessonTitle,
      lessonPlan: lesson.lessonPlan,
      lessonMood: lesson.lessonMood,
      lessonStatus: lesson.lessonStatus,
      resourceId: lesson.sharedCurriculumId,
      resourceName: lesson.sharedCurriculumName,
      subjectName: "Shared Curriculum",
      studentId: lesson.studentId,
      studentName: lesson.studentName,
      studentColor: lesson.studentColor,
      workSampleCount: lesson.workSampleCount,
      workSampleImageIds: lesson.workSampleImageIds,
    }));

    return [...personal, ...shared];
  }, [lessons, sharedLessons]);

  const sharedGroupLessons = useMemo(() => {
    const byLesson = new Map<
      string,
      {
        lessonId: string;
        lessonNumber: number;
        lessonTitle: string | null;
        lessonPlan: string | null;
        lessonMood: string | null;
        lessonStatus: string;
        sharedCurriculumName: string;
        workSampleCount: number;
        workSampleImageIds: string[];
        students: { id: string; name: string; color: string }[];
      }
    >();

    for (const row of sharedLessons) {
      const existing = byLesson.get(row.sharedLessonId);
      const student = {
        id: row.studentId,
        name: row.studentName,
        color: row.studentColor,
      };
      if (existing) {
        existing.students.push(student);
      } else {
        byLesson.set(row.sharedLessonId, {
          lessonId: row.sharedLessonId,
          lessonNumber: row.lessonNumber,
          lessonTitle: row.lessonTitle,
          lessonPlan: row.lessonPlan,
          lessonMood: row.lessonMood,
          lessonStatus: row.lessonStatus,
          sharedCurriculumName: row.sharedCurriculumName,
          workSampleCount: row.workSampleCount,
          workSampleImageIds: row.workSampleImageIds,
          students: [student],
        });
      }
    }

    return Array.from(byLesson.values()).sort(
      (a, b) => a.lessonNumber - b.lessonNumber,
    );
  }, [sharedLessons]);

  const byStudent = new Map<
    string,
    { name: string; color: string; lessons: UnifiedLesson[] }
  >();
  for (const student of allStudents) {
    byStudent.set(student.id, {
      name: student.name,
      color: student.color,
      lessons: [],
    });
  }
  for (const lesson of mergedLessons) {
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

  const bySubject = new Map<
    string,
    { name: string; lessons: UnifiedLesson[] }
  >();
  if (grouping === "subject") {
    for (const lesson of mergedLessons) {
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

  const todayResourceIds = new Set(lessons.map((l) => l.resourceId));
  const wheelCandidates = useMemo(
    () => getWheelCandidates(mergedLessons),
    [mergedLessons],
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-center sm:justify-start">
          <SpinSubjectWheelDialog candidates={wheelCandidates} />
        </div>

        {grouping === "student" &&
          !isStudentFiltered &&
          sharedLessonView === "group" &&
          sharedGroupLessons.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Shared Curriculum</h2>
              </div>
              {sharedGroupLessons.map((lesson) => (
                <div
                  key={lesson.lessonId}
                  className="space-y-1 rounded-md border p-3"
                >
                  <LessonCard
                    lessonKind="shared"
                    lessonId={lesson.lessonId}
                    lessonNumber={lesson.lessonNumber}
                    lessonTitle={lesson.lessonTitle}
                    lessonPlan={lesson.lessonPlan}
                    lessonMood={lesson.lessonMood}
                    status={lesson.lessonStatus}
                    resourceId={lesson.lessonId}
                    resourceName={lesson.sharedCurriculumName}
                    subjectName="Shared Curriculum"
                    studentId={lesson.students[0]?.id ?? ""}
                    studentName={lesson.students[0]?.name ?? "Shared"}
                    studentColor={lesson.students[0]?.color ?? "blue"}
                    date={date}
                    workSampleCount={lesson.workSampleCount}
                    workSampleImageIds={lesson.workSampleImageIds}
                    showNoteButton={false}
                    moodOptions={moodOptions}
                    onNoteClick={() => {}}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lesson.students.map((student) => (
                      <span
                        key={student.id}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                      >
                        <StudentColorDot
                          color={student.color}
                          className="h-2.5 w-2.5"
                        />
                        {student.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                        key={`${lesson.lessonKind}:${lesson.lessonId}:${lesson.studentId}`}
                        lessonKind={lesson.lessonKind}
                        lessonId={lesson.lessonId}
                        lessonNumber={lesson.lessonNumber}
                        lessonTitle={lesson.lessonTitle}
                        lessonPlan={lesson.lessonPlan}
                        lessonMood={lesson.lessonMood}
                        status={lesson.lessonStatus}
                        resourceId={lesson.resourceId}
                        resourceName={lesson.resourceName}
                        subjectName={lesson.subjectName}
                        studentName={lesson.studentName}
                        studentColor={lesson.studentColor}
                        studentId={lesson.studentId}
                        date={date}
                        workSampleCount={lesson.workSampleCount}
                        workSampleImageIds={lesson.workSampleImageIds}
                        showNoteButton={showNoteButtons}
                        moodOptions={moodOptions}
                        showStudentName
                        onNoteClick={(target) => {
                          setNoteTarget(target);
                          setDraftPlan(target.lessonPlan ?? "");
                          setDraftNote(noteForStudent(target.studentId));
                        }}
                      />
                    ))}
                </div>
              </div>
            ))
          : Array.from(byStudent.entries()).map(([studentId, group]) => {
              const absence = absenceMap[studentId];
              const studentShow = overrides[studentId] ?? defaultShowCompleted;

              const filteredLessons = group.lessons.filter((lesson) => {
                if (
                  lesson.lessonKind === "shared" &&
                  !isStudentFiltered &&
                  sharedLessonView === "group"
                ) {
                  return false;
                }
                return studentShow || lesson.lessonStatus !== "completed";
              });

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
                            {studentShow ? "Hide completed" : "Show completed"}
                          </TooltipContent>
                        </Tooltip>
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
                    {filteredLessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No lessons scheduled.
                      </p>
                    ) : (
                      filteredLessons.map((lesson) => (
                        <LessonCard
                          key={`${lesson.lessonKind}:${lesson.lessonId}:${lesson.studentId}`}
                          lessonKind={lesson.lessonKind}
                          lessonId={lesson.lessonId}
                          lessonNumber={lesson.lessonNumber}
                          lessonTitle={lesson.lessonTitle}
                          lessonPlan={lesson.lessonPlan}
                          lessonMood={lesson.lessonMood}
                          status={lesson.lessonStatus}
                          resourceId={lesson.resourceId}
                          resourceName={lesson.resourceName}
                          subjectName={lesson.subjectName}
                          studentName={lesson.studentName}
                          studentColor={lesson.studentColor}
                          studentId={lesson.studentId}
                          date={date}
                          workSampleCount={lesson.workSampleCount}
                          workSampleImageIds={lesson.workSampleImageIds}
                          exiting={
                            hidingStudents.has(studentId) &&
                            lesson.lessonStatus === "completed"
                          }
                          showNoteButton={showNoteButtons}
                          moodOptions={moodOptions}
                          onNoteClick={(target) => {
                            setNoteTarget(target);
                            setDraftPlan(target.lessonPlan ?? "");
                            setDraftNote(noteForStudent(target.studentId));
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      <NoteDialog
        target={
          noteTarget
            ? {
                studentId: noteTarget.studentId,
                lessonId: noteTarget.lessonId,
                lessonKind: noteTarget.lessonKind,
              }
            : null
        }
        date={date}
        plan={draftPlan}
        note={draftNote}
        onPlanChange={setDraftPlan}
        onNoteChange={setDraftNote}
        onClose={() => {
          setNoteTarget(null);
          setDraftPlan("");
          setDraftNote("");
        }}
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
            ? (() => {
                const absence = absenceMap[absenceTarget.studentId];
                if (!absence) return null;
                return {
                  ...absence,
                  canRemove:
                    absence.source === "individual" &&
                    Boolean(absence.absenceId),
                };
              })()
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
        todayResourceIds={todayResourceIds}
      />
    </>
  );
}
