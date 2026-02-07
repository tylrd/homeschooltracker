import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dailyNotes,
  lessons,
  resources,
  students,
  subjects,
} from "@/db/schema";

export async function getExportData(
  studentIds: string[],
  startDate: string,
  endDate: string,
) {
  const db = getDb();
  const conditions = [
    gte(lessons.completionDate, startDate),
    lte(lessons.completionDate, endDate),
    eq(lessons.status, "completed"),
  ];

  if (studentIds.length > 0) {
    conditions.push(inArray(students.id, studentIds));
  }

  const completedLessons = await db
    .select({
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      lessonNumber: lessons.lessonNumber,
      completionDate: lessons.completionDate,
      resourceName: resources.name,
      subjectName: subjects.name,
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(and(...conditions))
    .orderBy(students.name, lessons.completionDate, subjects.name);

  // Get daily notes in range
  const noteConditions = [
    gte(dailyNotes.date, startDate),
    lte(dailyNotes.date, endDate),
  ];

  if (studentIds.length > 0) {
    noteConditions.push(inArray(dailyNotes.studentId, studentIds));
  }

  const notes = await db
    .select({
      id: dailyNotes.id,
      date: dailyNotes.date,
      content: dailyNotes.content,
      studentId: dailyNotes.studentId,
      studentName: students.name,
    })
    .from(dailyNotes)
    .innerJoin(students, eq(dailyNotes.studentId, students.id))
    .where(and(...noteConditions))
    .orderBy(students.name, dailyNotes.date);

  return { completedLessons, notes };
}
