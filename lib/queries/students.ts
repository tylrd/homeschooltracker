import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { students } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function getStudents() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findMany({
    where: eq(students.organizationId, organizationId),
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}

export async function getStudentById(id: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findFirst({
    where: and(
      eq(students.id, id),
      eq(students.organizationId, organizationId),
    ),
  });
}

export async function getStudentWithSubjectsAndResources(id: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findFirst({
    where: and(
      eq(students.id, id),
      eq(students.organizationId, organizationId),
    ),
    with: {
      subjects: {
        with: {
          resources: true,
        },
        orderBy: (subjects, { asc }) => [asc(subjects.name)],
      },
    },
  });
}

export async function getStudentsWithSubjectsForCurriculumAdd() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findMany({
    where: eq(students.organizationId, organizationId),
    columns: {
      id: true,
      name: true,
      color: true,
    },
    with: {
      subjects: {
        columns: {
          id: true,
          name: true,
        },
        orderBy: (subjects, { asc }) => [asc(subjects.name)],
      },
    },
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}
