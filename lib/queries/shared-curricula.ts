import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  sharedCurricula,
  sharedCurriculumStudents,
  sharedLessons,
  students,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function getSharedCurriculaWithProgress(studentId?: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
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
      and(
        eq(sharedCurricula.organizationId, organizationId),
        studentId
          ? eq(sharedCurriculumStudents.studentId, studentId)
          : undefined,
      ),
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
  const { organizationId } = await getTenantContext();
  return db.query.sharedCurricula.findFirst({
    where: and(
      eq(sharedCurricula.id, sharedCurriculumId),
      eq(sharedCurricula.organizationId, organizationId),
    ),
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
  const { organizationId } = await getTenantContext();
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
    .where(
      and(
        eq(sharedCurriculumStudents.organizationId, organizationId),
        eq(sharedCurriculumStudents.studentId, studentId),
      ),
    )
    .orderBy(asc(sharedCurricula.name));
}

export async function getStudentsNotInSharedCurriculum(
  sharedCurriculumId: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const existing = await db
    .select({ studentId: sharedCurriculumStudents.studentId })
    .from(sharedCurriculumStudents)
    .where(
      and(
        eq(sharedCurriculumStudents.organizationId, organizationId),
        eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurriculumId),
      ),
    );

  const memberIds = existing.map((row) => row.studentId);

  return db
    .select({
      id: students.id,
      name: students.name,
      color: students.color,
    })
    .from(students)
    .where(
      and(
        eq(students.organizationId, organizationId),
        memberIds.length > 0 ? notInArray(students.id, memberIds) : undefined,
      ),
    )
    .orderBy(asc(students.name));
}

export async function getSharedCurriculumMembershipOptionsForStudent(
  studentId: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
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
        eq(sharedCurriculumStudents.organizationId, organizationId),
        eq(sharedCurriculumStudents.studentId, studentId),
      ),
    )
    .where(eq(sharedCurricula.organizationId, organizationId))
    .orderBy(asc(sharedCurricula.name));

  return rows.map((row) => ({
    sharedCurriculumId: row.sharedCurriculumId,
    sharedCurriculumName: row.sharedCurriculumName,
    isMember: Boolean(row.membershipId),
  }));
}
