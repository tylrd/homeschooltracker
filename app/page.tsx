export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { CalendarCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StudentFilter } from "@/components/dashboard/student-filter";
import { LessonList } from "@/components/dashboard/lesson-list";
import { SickDayButton } from "@/components/dashboard/sick-day-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTodayLessons,
  getTodayNotes,
  getStudentsForFilter,
} from "@/lib/queries/dashboard";
import { getTodayDate, formatDate } from "@/lib/dates";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: studentId } = await searchParams;
  const today = getTodayDate();
  const [lessons, notes, students] = await Promise.all([
    getTodayLessons(today, studentId),
    getTodayNotes(today),
    getStudentsForFilter(),
  ]);

  const plannedCount = lessons.filter((l) => l.lessonStatus === "planned").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
        </div>
        {plannedCount > 0 && <SickDayButton date={today} />}
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
          date={today}
        />
      )}
    </div>
  );
}
