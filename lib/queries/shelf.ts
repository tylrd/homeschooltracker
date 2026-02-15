import { and, asc, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  absenceReasons,
  absences,
  globalAbsences,
  lessons,
  resources,
  sharedCurricula,
  sharedCurriculumStudents,
  sharedLessons,
  students,
  subjects,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function getAllResourcesWithProgress() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const rows = await db
    .select({
      resourceId: resources.id,
      resourceName: resources.name,
      coverImageId: resources.coverImageId,
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
    .where(eq(resources.organizationId, organizationId))
    .groupBy(
      resources.id,
      resources.name,
      resources.coverImageId,
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
  const { organizationId } = await getTenantContext();
  const resource = await db.query.resources.findFirst({
    where: and(
      eq(resources.id, resourceId),
      eq(resources.organizationId, organizationId),
    ),
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

export async function getAllSharedCurriculaWithProgress() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const rows = await db
    .select({
      sharedCurriculumId: sharedCurricula.id,
      sharedCurriculumName: sharedCurricula.name,
      sharedCurriculumDescription: sharedCurricula.description,
      coverImageId: sharedCurricula.coverImageId,
      memberCount:
        sql<number>`count(distinct ${sharedCurriculumStudents.studentId})`.mapWith(
          Number,
        ),
      totalLessons: sql<number>`count(distinct ${sharedLessons.id})`.mapWith(
        Number,
      ),
      completedLessons:
        sql<number>`count(distinct case when ${sharedLessons.status} = 'completed' then ${sharedLessons.id} end)`.mapWith(
          Number,
        ),
    })
    .from(sharedCurricula)
    .leftJoin(
      sharedCurriculumStudents,
      eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurricula.id),
    )
    .leftJoin(
      sharedLessons,
      eq(sharedLessons.sharedCurriculumId, sharedCurricula.id),
    )
    .where(eq(sharedCurricula.organizationId, organizationId))
    .groupBy(
      sharedCurricula.id,
      sharedCurricula.name,
      sharedCurricula.description,
      sharedCurricula.coverImageId,
    )
    .orderBy(asc(sharedCurricula.name));

  return rows;
}

export async function getSharedCurriculumWithLessons(
  sharedCurriculumId: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.sharedCurricula.findFirst({
    where: and(
      eq(sharedCurricula.id, sharedCurriculumId),
      eq(sharedCurricula.organizationId, organizationId),
    ),
    with: {
      lessons: {
        orderBy: (sharedLessons, { asc }) => [asc(sharedLessons.lessonNumber)],
      },
      students: {
        with: {
          student: true,
        },
      },
    },
  });
}

export async function getEffectiveAbsencesForStudent(studentId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const [explicitRows, globalRows, completedRows] = await Promise.all([
    db
      .select({
        date: absences.date,
        reasonName: absenceReasons.name,
        reasonColor: absenceReasons.color,
      })
      .from(absences)
      .innerJoin(absenceReasons, eq(absences.reasonId, absenceReasons.id))
      .where(
        and(
          eq(absences.organizationId, organizationId),
          eq(absences.studentId, studentId),
        ),
      ),
    db
      .select({
        date: globalAbsences.date,
        reasonName: absenceReasons.name,
        reasonColor: absenceReasons.color,
      })
      .from(globalAbsences)
      .innerJoin(absenceReasons, eq(globalAbsences.reasonId, absenceReasons.id))
      .where(eq(globalAbsences.organizationId, organizationId)),
    db
      .select({
        completionDate: lessons.completionDate,
      })
      .from(lessons)
      .innerJoin(resources, eq(lessons.resourceId, resources.id))
      .innerJoin(subjects, eq(resources.subjectId, subjects.id))
      .where(
        and(
          eq(lessons.organizationId, organizationId),
          eq(subjects.studentId, studentId),
          eq(lessons.status, "completed"),
        ),
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
