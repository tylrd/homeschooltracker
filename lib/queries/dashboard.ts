import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import {
  lessons,
  resources,
  subjects,
  students,
  dailyNotes,
  absences,
  absenceReasons,
} from "@/db/schema";

export async function getTodayLessons(date: string, studentId?: string) {
  const db = getDb();
  const conditions = [eq(lessons.scheduledDate, date)];

  if (studentId) {
    conditions.push(eq(students.id, studentId));
  }

  const rows = await db
    .select({
      lessonId: lessons.id,
      lessonNumber: lessons.lessonNumber,
      lessonTitle: lessons.title,
      lessonStatus: lessons.status,
      scheduledDate: lessons.scheduledDate,
      resourceId: resources.id,
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
    .orderBy(students.name, subjects.name, lessons.lessonNumber);

  return rows;
}

export async function getTodayNotes(date: string) {
  const db = getDb();
  return db
    .select({
      noteId: dailyNotes.id,
      studentId: dailyNotes.studentId,
      content: dailyNotes.content,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(dailyNotes)
    .innerJoin(students, eq(dailyNotes.studentId, students.id))
    .where(eq(dailyNotes.date, date))
    .orderBy(students.name);
}

export async function getStudentsForFilter() {
  const db = getDb();
  return db.query.students.findMany({
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}

export async function getAbsencesForDate(date: string) {
  const db = getDb();
  const rows = await db
    .select({
      absenceId: absences.id,
      studentId: absences.studentId,
      reasonId: absenceReasons.id,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
    })
    .from(absences)
    .innerJoin(absenceReasons, eq(absences.reasonId, absenceReasons.id))
    .where(eq(absences.date, date));

  return rows;
}
