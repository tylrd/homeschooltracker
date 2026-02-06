import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { lessons, resources, subjects, students } from "@/db/schema";

export type CalendarDay = {
  total: number;
  completed: number;
};

export async function getCalendarData(
  year: number,
  month: number,
  studentId?: string,
) {
  const db = getDb();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const conditions = [
    gte(lessons.scheduledDate, startDate),
    lte(lessons.scheduledDate, endDate),
  ];

  if (studentId) {
    conditions.push(eq(students.id, studentId));
  }

  const rows = await db
    .select({
      scheduledDate: lessons.scheduledDate,
      status: lessons.status,
    })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(and(...conditions));

  const dayMap = new Map<string, CalendarDay>();

  for (const row of rows) {
    if (!row.scheduledDate) continue;
    const existing = dayMap.get(row.scheduledDate) ?? { total: 0, completed: 0 };
    existing.total++;
    if (row.status === "completed") {
      existing.completed++;
    }
    dayMap.set(row.scheduledDate, existing);
  }

  return { dayMap, year, month, lastDay };
}
