import { count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { lessons, resources, students, subjects } from "@/db/schema";

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
