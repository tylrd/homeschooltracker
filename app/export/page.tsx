export const dynamic = "force-dynamic";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ExportForm } from "@/components/export/export-form";
import { Button } from "@/components/ui/button";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getAllStudents } from "@/lib/queries/attendance";

export default async function ExportPage() {
  await requireAppRouteAccess("/export");

  const students = await getAllStudents();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/attendance">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Export Report</h1>
      </div>

      {students.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add students and complete lessons to generate reports.
        </p>
      ) : (
        <ExportForm students={students} />
      )}
    </div>
  );
}
