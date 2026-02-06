import { Check } from "lucide-react";
import { StudentColorDot } from "@/components/student-color-dot";
import { getAbsenceColorClasses } from "@/lib/absence-colors";
import { cn } from "@/lib/utils";

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

export function AttendanceTable({ data }: { data: AttendanceData }) {
  const { attendanceMap, absenceMap, studentInfo, year, month, lastDay } = data;

  // Build weekday dates only (Mon-Fri)
  const weekdays: { day: number; dateStr: string }[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) {
      weekdays.push({
        day: d,
        dateStr: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
  }

  const studentEntries = Array.from(studentInfo.entries());

  // Collect unique absence reasons for the legend
  const legendReasons = new Map<string, { name: string; color: string }>();
  for (const [, dateMap] of absenceMap) {
    for (const [, info] of dateMap) {
      if (!legendReasons.has(info.reasonName)) {
        legendReasons.set(info.reasonName, {
          name: info.reasonName,
          color: info.reasonColor,
        });
      }
    }
  }

  if (studentEntries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No attendance data for this month.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">
                Student
              </th>
              {weekdays.map(({ day }) => (
                <th
                  key={day}
                  className="min-w-8 px-1 py-2 text-center font-normal text-muted-foreground"
                >
                  {day}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {studentEntries.map(([studentId, info]) => {
              const dates = attendanceMap.get(studentId) ?? new Set();
              const studentAbsences = absenceMap.get(studentId) ?? new Map();
              const total = weekdays.filter((w) => dates.has(w.dateStr)).length;
              return (
                <tr key={studentId} className="border-b last:border-0">
                  <td className="sticky left-0 z-10 bg-background px-3 py-2">
                    <div className="flex items-center gap-2">
                      <StudentColorDot color={info.color} />
                      <span className="whitespace-nowrap">{info.name}</span>
                    </div>
                  </td>
                  {weekdays.map(({ day, dateStr }) => {
                    const present = dates.has(dateStr);
                    const absence = studentAbsences.get(dateStr);
                    return (
                      <td key={day} className="px-1 py-2 text-center">
                        {present ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : absence ? (
                          <div
                            className={cn(
                              "mx-auto h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white",
                              getAbsenceColorClasses(absence.reasonColor)
                                .bgSolid,
                            )}
                            title={absence.reasonName}
                          >
                            {absence.reasonName[0]}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-medium">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {legendReasons.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" />
            <span>Present</span>
          </div>
          {Array.from(legendReasons.values()).map((reason) => {
            const colorClasses = getAbsenceColorClasses(reason.color);
            return (
              <div key={reason.name} className="flex items-center gap-1">
                <div
                  className={cn("h-3 w-3 rounded-full", colorClasses.bgSolid)}
                />
                <span>{reason.name}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/30">-</span>
            <span>No data</span>
          </div>
        </div>
      )}
    </div>
  );
}
