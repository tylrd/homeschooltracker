import Link from "next/link";
import { StudentColorDot } from "@/components/student-color-dot";
import { getAbsenceColorClasses } from "@/lib/absence-colors";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CompletionLogEntry } from "@/lib/queries/attendance";

type AbsenceRow = {
  studentId: string;
  date: string;
  reasonName: string;
  reasonColor: string;
  studentName: string;
  studentColor: string;
};

export function AttendanceLog({
  completions,
  absences,
}: {
  completions: CompletionLogEntry[];
  absences: AbsenceRow[];
}) {
  // Group completions by date
  const byDate = new Map<string, CompletionLogEntry[]>();
  for (const entry of completions) {
    const list = byDate.get(entry.completionDate) ?? [];
    list.push(entry);
    byDate.set(entry.completionDate, list);
  }

  // Group absences by date
  const absencesByDate = new Map<string, AbsenceRow[]>();
  for (const a of absences) {
    const list = absencesByDate.get(a.date) ?? [];
    list.push(a);
    absencesByDate.set(a.date, list);
  }

  // Merge all dates and sort descending (most recent first)
  const allDates = new Set([...byDate.keys(), ...absencesByDate.keys()]);
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

  if (sortedDates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No completion data for this month.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((dateStr) => {
        const dayCompletions = byDate.get(dateStr) ?? [];
        const dayAbsences = absencesByDate.get(dateStr) ?? [];

        // Group completions by student
        const byStudent = new Map<
          string,
          {
            name: string;
            color: string;
            lessons: CompletionLogEntry[];
          }
        >();
        for (const entry of dayCompletions) {
          const existing = byStudent.get(entry.studentId);
          if (existing) {
            existing.lessons.push(entry);
          } else {
            byStudent.set(entry.studentId, {
              name: entry.studentName,
              color: entry.studentColor,
              lessons: [entry],
            });
          }
        }

        // Absence students who had no completions that day
        const absentOnly = dayAbsences.filter(
          (a) => !byStudent.has(a.studentId),
        );

        return (
          <div key={dateStr} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {formatDate(dateStr)}
            </h3>
            <div className="space-y-3">
              {Array.from(byStudent.entries()).map(([studentId, group]) => {
                const absence = dayAbsences.find(
                  (a) => a.studentId === studentId,
                );
                return (
                  <div
                    key={studentId}
                    className="rounded-md border px-3 py-2 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <StudentColorDot
                        color={group.color}
                        className="h-2.5 w-2.5"
                      />
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {group.lessons.length} lesson
                        {group.lessons.length !== 1 && "s"}
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
                    </div>
                    <ul className="space-y-0.5 pl-5">
                      {group.lessons.map((lesson) => (
                        <li key={lesson.lessonId} className="text-sm">
                          <Link
                            href={`/lessons/${lesson.lessonId}`}
                            className="hover:underline"
                          >
                            <span className="text-muted-foreground">
                              {lesson.subjectName} &middot;{" "}
                            </span>
                            {lesson.resourceName}{" "}
                            <span className="text-muted-foreground">
                              #{lesson.lessonNumber}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {absentOnly.map((a) => {
                const colorClasses = getAbsenceColorClasses(a.reasonColor);
                return (
                  <div
                    key={a.studentId}
                    className="rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <StudentColorDot
                        color={a.studentColor}
                        className="h-2.5 w-2.5"
                      />
                      <span className="text-sm font-medium">
                        {a.studentName}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          colorClasses.bg,
                          colorClasses.text,
                        )}
                      >
                        {a.reasonName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
