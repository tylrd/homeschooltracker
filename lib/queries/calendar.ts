import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  lessons,
  resources,
  sharedCurriculumStudents,
  sharedLessons,
  students,
  subjects,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

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
  const { organizationId } = await getTenantContext();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const personalConditions = [
    eq(lessons.organizationId, organizationId),
    gte(lessons.scheduledDate, startDate),
    lte(lessons.scheduledDate, endDate),
  ];

  if (studentId) {
    personalConditions.push(eq(students.id, studentId));
  }

  const personalRows = await db
    .select({
      scheduledDate: lessons.scheduledDate,
      status: lessons.status,
    })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(and(...personalConditions));

  const sharedConditions = [
    eq(sharedLessons.organizationId, organizationId),
    gte(sharedLessons.scheduledDate, startDate),
    lte(sharedLessons.scheduledDate, endDate),
  ];
  if (studentId) {
    sharedConditions.push(eq(students.id, studentId));
  }

  const sharedRows = await db
    .select({
      scheduledDate: sharedLessons.scheduledDate,
      status: sharedLessons.status,
    })
    .from(sharedLessons)
    .innerJoin(
      sharedCurriculumStudents,
      eq(
        sharedLessons.sharedCurriculumId,
        sharedCurriculumStudents.sharedCurriculumId,
      ),
    )
    .innerJoin(students, eq(sharedCurriculumStudents.studentId, students.id))
    .where(and(...sharedConditions));

  const rows = [...personalRows, ...sharedRows];

  const dayMap = new Map<string, CalendarDay>();

  for (const row of rows) {
    if (!row.scheduledDate) continue;
    const existing = dayMap.get(row.scheduledDate) ?? {
      total: 0,
      completed: 0,
    };
    existing.total++;
    if (row.status === "completed") {
      existing.completed++;
    }
    dayMap.set(row.scheduledDate, existing);
  }

  return { dayMap, year, month, lastDay };
}
