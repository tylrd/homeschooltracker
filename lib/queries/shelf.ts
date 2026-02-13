import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  absenceReasons,
  absences,
  globalAbsences,
  lessons,
  resources,
  students,
  subjects,
} from "@/db/schema";

export async function getAllResourcesWithProgress() {
  const db = getDb();
  const rows = await db
    .select({
      resourceId: resources.id,
      resourceName: resources.name,
      subjectName: subjects.name,
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
      totalLessons: count(lessons.id),
      completedLessons:
        sql<number>`count(case when ${lessons.status} = 'completed' then 1 end)`.mapWith(
          Number,
        ),
    })
    .from(resources)
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .leftJoin(lessons, eq(lessons.resourceId, resources.id))
    .groupBy(
      resources.id,
      resources.name,
      subjects.name,
      students.id,
      students.name,
      students.color,
    )
    .orderBy(students.name, subjects.name, resources.name);

  return rows;
}

export async function getResourceWithLessons(resourceId: string) {
  const db = getDb();
  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.lessonNumber)],
      },
      subject: {
        with: {
          student: true,
        },
      },
    },
  });

  return resource;
}

export async function getEffectiveAbsencesForStudent(studentId: string) {
  const db = getDb();

  const [explicitRows, globalRows, completedRows] = await Promise.all([
    db
      .select({
        date: absences.date,
        reasonName: absenceReasons.name,
        reasonColor: absenceReasons.color,
      })
      .from(absences)
      .innerJoin(absenceReasons, eq(absences.reasonId, absenceReasons.id))
      .where(eq(absences.studentId, studentId)),
    db
      .select({
        date: globalAbsences.date,
        reasonName: absenceReasons.name,
        reasonColor: absenceReasons.color,
      })
      .from(globalAbsences)
      .innerJoin(
        absenceReasons,
        eq(globalAbsences.reasonId, absenceReasons.id),
      ),
    db
      .select({
        completionDate: lessons.completionDate,
      })
      .from(lessons)
      .innerJoin(resources, eq(lessons.resourceId, resources.id))
      .innerJoin(subjects, eq(resources.subjectId, subjects.id))
      .where(
        and(eq(subjects.studentId, studentId), eq(lessons.status, "completed")),
      ),
  ]);

  const completedDates = new Set(
    completedRows
      .map((row) => row.completionDate)
      .filter((date): date is string => Boolean(date)),
  );

  const byDate: Record<
    string,
    { reasonName: string; reasonColor: string; source: "individual" | "global" }
  > = {};

  for (const row of explicitRows) {
    byDate[row.date] = {
      reasonName: row.reasonName,
      reasonColor: row.reasonColor,
      source: "individual",
    };
  }

  for (const row of globalRows) {
    if (byDate[row.date]) continue;
    if (completedDates.has(row.date)) continue;
    byDate[row.date] = {
      reasonName: row.reasonName,
      reasonColor: row.reasonColor,
      source: "global",
    };
  }

  return byDate;
}
