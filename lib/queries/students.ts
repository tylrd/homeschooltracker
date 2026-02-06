import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { students } from "@/db/schema";

export async function getStudents() {
  const db = getDb();
  return db.query.students.findMany({
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}

export async function getStudentById(id: string) {
  const db = getDb();
  return db.query.students.findFirst({
    where: eq(students.id, id),
  });
}

export async function getStudentWithSubjectsAndResources(id: string) {
  const db = getDb();
  return db.query.students.findFirst({
    where: eq(students.id, id),
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
