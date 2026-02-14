import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  sharedCurricula,
  sharedCurriculumStudents,
  sharedLessons,
  students,
} from "@/db/schema";

export async function getSharedCurriculaWithProgress(studentId?: string) {
  const db = getDb();
  const rows = await db
    .select({
      sharedCurriculumId: sharedCurricula.id,
      sharedCurriculumName: sharedCurricula.name,
      sharedCurriculumDescription: sharedCurricula.description,
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
    .where(
      studentId ? eq(sharedCurriculumStudents.studentId, studentId) : undefined,
    )
    .groupBy(
      sharedCurricula.id,
      sharedCurricula.name,
      sharedCurricula.description,
    )
    .orderBy(asc(sharedCurricula.name));

  return rows;
}

export async function getSharedCurriculumWithLessons(
  sharedCurriculumId: string,
) {
  const db = getDb();
  return db.query.sharedCurricula.findFirst({
    where: eq(sharedCurricula.id, sharedCurriculumId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.lessonNumber)],
      },
      students: {
        with: {
          student: true,
        },
        orderBy: (memberships, { asc }) => [asc(memberships.createdAt)],
      },
    },
  });
}

export async function getSharedCurriculumMembershipsForStudent(
  studentId: string,
) {
  const db = getDb();
  return db
    .select({
      membershipId: sharedCurriculumStudents.id,
      sharedCurriculumId: sharedCurricula.id,
      sharedCurriculumName: sharedCurricula.name,
      sharedCurriculumDescription: sharedCurricula.description,
    })
    .from(sharedCurriculumStudents)
    .innerJoin(
      sharedCurricula,
      eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurricula.id),
    )
    .where(eq(sharedCurriculumStudents.studentId, studentId))
    .orderBy(asc(sharedCurricula.name));
}

export async function getStudentsNotInSharedCurriculum(
  sharedCurriculumId: string,
) {
  const db = getDb();
  const existing = await db
    .select({ studentId: sharedCurriculumStudents.studentId })
    .from(sharedCurriculumStudents)
    .where(eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurriculumId));

  const memberIds = existing.map((row) => row.studentId);

  return db
    .select({
      id: students.id,
      name: students.name,
      color: students.color,
    })
    .from(students)
    .where(
      memberIds.length > 0 ? notInArray(students.id, memberIds) : undefined,
    )
    .orderBy(asc(students.name));
}

export async function getSharedCurriculumMembershipOptionsForStudent(
  studentId: string,
) {
  const db = getDb();
  const rows = await db
    .select({
      sharedCurriculumId: sharedCurricula.id,
      sharedCurriculumName: sharedCurricula.name,
      membershipId: sharedCurriculumStudents.id,
    })
    .from(sharedCurricula)
    .leftJoin(
      sharedCurriculumStudents,
      and(
        eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurricula.id),
        eq(sharedCurriculumStudents.studentId, studentId),
      ),
    )
    .orderBy(asc(sharedCurricula.name));

  return rows.map((row) => ({
    sharedCurriculumId: row.sharedCurriculumId,
    sharedCurriculumName: row.sharedCurriculumName,
    isMember: Boolean(row.membershipId),
  }));
}
