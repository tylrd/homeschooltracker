export const dynamic = "force-dynamic";

import { PrintButton } from "@/components/export/print-button";
import { StudentColorDot } from "@/components/student-color-dot";
import { formatDate } from "@/lib/dates";
import { getExportData } from "@/lib/queries/export";

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; students?: string }>;
}) {
  const params = await searchParams;
  const startDate = params.start ?? "";
  const endDate = params.end ?? "";
  const studentIds = params.students ? params.students.split(",") : [];

  if (!startDate || !endDate) {
    return <p>Missing date range.</p>;
  }

  const { completedLessons, notes } = await getExportData(
    studentIds,
    startDate,
    endDate,
  );

  // Group lessons by student
  const byStudent = new Map<
    string,
    {
      name: string;
      color: string;
      lessons: typeof completedLessons;
    }
  >();
  for (const lesson of completedLessons) {
    const existing = byStudent.get(lesson.studentId);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      byStudent.set(lesson.studentId, {
        name: lesson.studentName,
        color: lesson.studentColor,
        lessons: [lesson],
      });
    }
  }

  // Group notes by student
  const notesByStudent = new Map<string, typeof notes>();
  for (const note of notes) {
    const existing = notesByStudent.get(note.studentId);
    if (existing) {
      existing.push(note);
    } else {
      notesByStudent.set(note.studentId, [note]);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      <div className="mb-8 flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold">Homeschool Report</h1>
        <PrintButton />
      </div>

      <div className="mb-4 print:mb-2">
        <h1 className="text-xl font-bold print:text-lg">Homeschool Report</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(startDate)} &mdash; {formatDate(endDate)}
        </p>
      </div>

      {Array.from(byStudent.entries()).map(([studentId, group], idx) => (
        <div key={studentId} className={idx > 0 ? "page-break" : ""}>
          <div className="mb-3 flex items-center gap-2 border-b pb-2">
            <StudentColorDot color={group.color} />
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <span className="text-sm text-muted-foreground">
              {group.lessons.length} lessons completed
            </span>
          </div>

          <table className="mb-6 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-1 pr-3 font-medium whitespace-nowrap">
                  Date
                </th>
                <th className="pb-1 pr-3 font-medium whitespace-nowrap">
                  Subject
                </th>
                <th className="pb-1 pr-3 font-medium w-full">Resource</th>
                <th className="pb-1 font-medium whitespace-nowrap text-right">
                  Lesson
                </th>
              </tr>
            </thead>
            <tbody>
              {group.lessons.map((lesson) => (
                <tr key={lesson.lessonId} className="border-b border-muted/30">
                  <td className="py-1 pr-3 whitespace-nowrap">
                    {lesson.completionDate
                      ? formatDate(lesson.completionDate)
                      : "—"}
                  </td>
                  <td className="py-1 pr-3 whitespace-nowrap">
                    {lesson.subjectName}
                  </td>
                  <td className="py-1 pr-3">{lesson.resourceName}</td>
                  <td className="py-1 whitespace-nowrap text-right">
                    {lesson.lessonTitle ?? `Lesson ${lesson.lessonNumber}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {notesByStudent.has(studentId) && (
            <div className="mb-6">
              <h3 className="mb-2 font-medium">Daily Notes</h3>
              {notesByStudent.get(studentId)?.map((note) => (
                <div key={note.id} className="mb-1 text-sm">
                  <span className="font-medium">{formatDate(note.date)}:</span>{" "}
                  {note.content}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {completedLessons.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No completed lessons in this date range.
        </p>
      )}
    </div>
  );
}
