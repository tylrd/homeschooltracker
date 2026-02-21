"use client";

import { AttendanceLog } from "@/components/attendance/attendance-log";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CompletionLogEntry,
  DailyLogNoteEntry,
} from "@/lib/queries/attendance";

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

type PresentReasonRow = AbsenceRow;

export function AttendanceView({
  gridData,
  logData,
  showDailyLogNotes,
}: {
  gridData: AttendanceData;
  logData: {
    completions: CompletionLogEntry[];
    absences: AbsenceRow[];
    presentReasons: PresentReasonRow[];
    notes: DailyLogNoteEntry[];
  };
  showDailyLogNotes: boolean;
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
          presentReasons={logData.presentReasons}
          notes={logData.notes}
          showNotes={showDailyLogNotes}
        />
      </TabsContent>
    </Tabs>
  );
}
