export const dynamic = "force-dynamic";

import { CalendarCheck } from "lucide-react";
import { Suspense } from "react";
import { DashboardSharedAddButton } from "@/components/dashboard/dashboard-shared-add-button";
import { DayNav } from "@/components/dashboard/day-nav";
import { LessonList } from "@/components/dashboard/lesson-list";
import { SickDayButton } from "@/components/dashboard/sick-day-button";
import { StudentFilter } from "@/components/dashboard/student-filter";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getTodayDate } from "@/lib/dates";
import { getOrCreateDefaultReasons } from "@/lib/queries/absence-reasons";
import {
  getAbsencesForDate,
  getGlobalAbsenceForDate,
  getSharedCurriculaForDashboardAdd,
  getStudentResourceMap,
  getStudentsForFilter,
  getTodayLessons,
  getTodayNotes,
  getTodaySharedLessons,
} from "@/lib/queries/dashboard";
import {
  getDashboardGrouping,
  getDashboardSharedLessonView,
  getShowCompletedLessons,
  getShowNoteButtons,
} from "@/lib/queries/settings";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; date?: string }>;
}) {
  await requireAppRouteAccess("/");

  const { student: studentId, date: dateParam } = await searchParams;
  const today = getTodayDate();
  const date = dateParam ?? today;
  const [
    lessons,
    sharedLessons,
    notes,
    students,
    absences,
    globalAbsence,
    reasons,
    showCompleted,
    dashboardGrouping,
    dashboardSharedLessonView,
    showNoteButtons,
    resourceRows,
    sharedCurriculumRows,
  ] = await Promise.all([
    getTodayLessons(date, studentId),
    getTodaySharedLessons(date, studentId),
    getTodayNotes(date),
    getStudentsForFilter(),
    getAbsencesForDate(date),
    getGlobalAbsenceForDate(date),
    getOrCreateDefaultReasons(),
    getShowCompletedLessons(),
    getDashboardGrouping(),
    getDashboardSharedLessonView(),
    getShowNoteButtons(),
    getStudentResourceMap(),
    getSharedCurriculaForDashboardAdd(date, studentId),
  ]);

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
    {
      absenceId: string | null;
      reasonName: string;
      reasonColor: string;
      source: "individual" | "global";
    }
  >();
  for (const a of absences) {
    absenceMap.set(a.studentId, {
      absenceId: a.absenceId,
      reasonName: a.reasonName,
      reasonColor: a.reasonColor,
      source: a.source,
    });
  }

  const renderDashboardActions = () => (
    <>
      <DashboardSharedAddButton date={date} options={sharedCurriculumRows} />
      {students.length > 0 && (
        <SickDayButton
          date={date}
          reasons={reasons.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
          }))}
          existingGlobalAbsence={
            globalAbsence
              ? {
                  absenceId: globalAbsence.globalAbsenceId,
                  reasonName: globalAbsence.reasonName,
                  reasonColor: globalAbsence.reasonColor,
                }
              : null
          }
        />
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <DayNav date={date} today={today} compact={false} />
          <div className="ml-auto flex items-center gap-2">
            {renderDashboardActions()}
          </div>
        </div>

        {students.length > 0 && (
          <Suspense fallback={<Skeleton className="h-8 w-full" />}>
            <StudentFilter students={students} activeStudentId={studentId} />
          </Suspense>
        )}
      </section>

      {lessons.length === 0 && sharedLessons.length === 0 && (
        <EmptyState
          icon={CalendarCheck}
          title="No lessons today"
          description={
            students.length === 0
              ? "Add students and generate lessons to see your daily dashboard."
              : "All caught up! No lessons scheduled for today."
          }
        />
      )}

      {students.length > 0 && (
        <LessonList
          lessons={lessons}
          sharedLessons={sharedLessons}
          allStudents={
            studentId
              ? students.filter((student) => student.id === studentId)
              : students
          }
          isStudentFiltered={!!studentId}
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
          defaultSharedLessonView={dashboardSharedLessonView}
          showNoteButtons={showNoteButtons}
          studentResourceMap={studentResourceMap}
        />
      )}
    </div>
  );
}
