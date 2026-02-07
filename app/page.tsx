export const dynamic = "force-dynamic";

import { CalendarCheck } from "lucide-react";
import { Suspense } from "react";
import { DayNav } from "@/components/dashboard/day-nav";
import { LessonList } from "@/components/dashboard/lesson-list";
import { SickDayButton } from "@/components/dashboard/sick-day-button";
import { StudentFilter } from "@/components/dashboard/student-filter";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getTodayDate } from "@/lib/dates";
import { getOrCreateDefaultReasons } from "@/lib/queries/absence-reasons";
import {
  getAbsencesForDate,
  getStudentResourceMap,
  getStudentsForFilter,
  getTodayLessons,
  getTodayNotes,
} from "@/lib/queries/dashboard";
import {
  getDashboardGrouping,
  getShowCompletedLessons,
  getShowNoteButtons,
} from "@/lib/queries/settings";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; date?: string }>;
}) {
  const { student: studentId, date: dateParam } = await searchParams;
  const today = getTodayDate();
  const date = dateParam ?? today;
  const [
    lessons,
    notes,
    students,
    absences,
    reasons,
    showCompleted,
    dashboardGrouping,
    showNoteButtons,
    resourceRows,
  ] = await Promise.all([
    getTodayLessons(date, studentId),
    getTodayNotes(date),
    getStudentsForFilter(),
    getAbsencesForDate(date),
    getOrCreateDefaultReasons(),
    getShowCompletedLessons(),
    getDashboardGrouping(),
    getShowNoteButtons(),
    getStudentResourceMap(),
  ]);

  const plannedCount = lessons.filter(
    (l) => l.lessonStatus === "planned",
  ).length;

  // Build student resource map: studentId -> resources[]
  const studentResourceMap: Record<
    string,
    { resourceId: string; resourceName: string; subjectName: string }[]
  > = {};
  for (const row of resourceRows) {
    const existing = studentResourceMap[row.studentId];
    if (existing) {
      existing.push({
        resourceId: row.resourceId,
        resourceName: row.resourceName,
        subjectName: row.subjectName,
      });
    } else {
      studentResourceMap[row.studentId] = [
        {
          resourceId: row.resourceId,
          resourceName: row.resourceName,
          subjectName: row.subjectName,
        },
      ];
    }
  }

  // Build absence map: studentId -> absence info
  const absenceMap = new Map<
    string,
    { absenceId: string; reasonName: string; reasonColor: string }
  >();
  for (const a of absences) {
    absenceMap.set(a.studentId, {
      absenceId: a.absenceId,
      reasonName: a.reasonName,
      reasonColor: a.reasonColor,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DayNav date={date} today={today} />
        {plannedCount > 0 && (
          <SickDayButton
            date={date}
            reasons={reasons.map((r) => ({
              id: r.id,
              name: r.name,
              color: r.color,
            }))}
          />
        )}
      </div>

      {students.length > 0 && (
        <Suspense fallback={<Skeleton className="h-8 w-full" />}>
          <StudentFilter students={students} activeStudentId={studentId} />
        </Suspense>
      )}

      {lessons.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No lessons today"
          description={
            students.length === 0
              ? "Add students and generate lessons to see your daily dashboard."
              : "All caught up! No lessons scheduled for today."
          }
        />
      ) : (
        <LessonList
          lessons={lessons}
          notes={notes.map((n) => ({
            studentId: n.studentId,
            content: n.content,
          }))}
          date={date}
          reasons={reasons.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
          }))}
          absenceMap={Object.fromEntries(absenceMap)}
          defaultShowCompleted={showCompleted}
          grouping={dashboardGrouping}
          showNoteButtons={showNoteButtons}
          studentResourceMap={studentResourceMap}
        />
      )}
    </div>
  );
}
