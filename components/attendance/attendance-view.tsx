"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { AttendanceLog } from "@/components/attendance/attendance-log";
import type { CompletionLogEntry } from "@/lib/queries/attendance";

type AttendanceData = {
  attendanceMap: Map<string, Set<string>>;
  absenceMap: Map<
    string,
    Map<string, { reasonName: string; reasonColor: string }>
  >;
  studentInfo: Map<string, { name: string; color: string }>;
  year: number;
  month: number;
  lastDay: number;
};

type AbsenceRow = {
  studentId: string;
  date: string;
  reasonName: string;
  reasonColor: string;
  studentName: string;
  studentColor: string;
};

export function AttendanceView({
  gridData,
  logData,
}: {
  gridData: AttendanceData;
  logData: { completions: CompletionLogEntry[]; absences: AbsenceRow[] };
}) {
  return (
    <Tabs defaultValue="grid">
      <TabsList>
        <TabsTrigger value="grid">Grid</TabsTrigger>
        <TabsTrigger value="log">Daily Log</TabsTrigger>
      </TabsList>
      <TabsContent value="grid">
        <AttendanceTable data={gridData} />
      </TabsContent>
      <TabsContent value="log">
        <AttendanceLog
          completions={logData.completions}
          absences={logData.absences}
        />
      </TabsContent>
    </Tabs>
  );
}
