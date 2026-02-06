export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { MonthNav } from "@/components/attendance/month-nav";
import { getAttendanceForMonth } from "@/lib/queries/attendance";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const data = await getAttendanceForMonth(year, month);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <Link href="/export">
          <Button variant="outline" size="sm">
            <FileText className="mr-1 h-4 w-4" />
            Export
          </Button>
        </Link>
      </div>

      <Suspense fallback={<Skeleton className="h-8 w-48" />}>
        <MonthNav year={year} month={month} />
      </Suspense>

      <AttendanceTable data={data} />
    </div>
  );
}
