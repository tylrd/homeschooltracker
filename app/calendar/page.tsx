export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthNav } from "@/components/attendance/month-nav";
import { StudentFilter } from "@/components/dashboard/student-filter";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { getCalendarData } from "@/lib/queries/calendar";
import { getStudentsForFilter } from "@/lib/queries/dashboard";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; student?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;
  const studentId = params.student;

  const [calendarData, students] = await Promise.all([
    getCalendarData(year, month, studentId),
    getStudentsForFilter(),
  ]);

  // Convert Map to plain object for serialization to client component
  const dayMapObj: Record<string, { total: number; completed: number }> = {};
  for (const [key, value] of calendarData.dayMap) {
    dayMapObj[key] = value;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      <Suspense fallback={<Skeleton className="h-8 w-48" />}>
        <MonthNav year={year} month={month} basePath="/calendar" />
      </Suspense>

      {students.length > 0 && (
        <Suspense fallback={<Skeleton className="h-8 w-full" />}>
          <StudentFilter
            students={students}
            activeStudentId={studentId}
            basePath="/calendar"
          />
        </Suspense>
      )}

      <CalendarGrid
        year={year}
        month={month}
        lastDay={calendarData.lastDay}
        dayMap={dayMapObj}
        showProgress={!!studentId}
      />
    </div>
  );
}
