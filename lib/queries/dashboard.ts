import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  absenceReasons,
  absences,
  dailyNotes,
  globalAbsences,
  lessons,
  resources,
  students,
  subjects,
} from "@/db/schema";

type DashboardAbsenceRow = {
  absenceId: string | null;
  studentId: string;
  reasonId: string;
  reasonName: string;
  reasonColor: string;
  source: "individual" | "global";
};

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
      lessonPlan: lessons.plan,
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
  const explicitRows = await db
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

  const globalRows = await db
    .select({
      globalAbsenceId: globalAbsences.id,
      reasonId: absenceReasons.id,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
    })
    .from(globalAbsences)
    .innerJoin(absenceReasons, eq(globalAbsences.reasonId, absenceReasons.id))
    .where(eq(globalAbsences.date, date))
    .limit(1);

  const rows: DashboardAbsenceRow[] = explicitRows.map((row) => ({
    absenceId: row.absenceId,
    studentId: row.studentId,
    reasonId: row.reasonId,
    reasonName: row.reasonName,
    reasonColor: row.reasonColor,
    source: "individual",
  }));

  const global = globalRows[0];
  if (!global) return rows;

  const completedRows = await db
    .select({ studentId: students.id })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(
      and(eq(lessons.status, "completed"), eq(lessons.completionDate, date)),
    );

  const explicitStudentIds = new Set(explicitRows.map((r) => r.studentId));
  const completedStudentIds = new Set(completedRows.map((r) => r.studentId));
  const allStudentRows = await db
    .select({ studentId: students.id })
    .from(students);

  for (const { studentId } of allStudentRows) {
    if (explicitStudentIds.has(studentId)) continue;
    if (completedStudentIds.has(studentId)) continue;
    rows.push({
      absenceId: null,
      studentId,
      reasonId: global.reasonId,
      reasonName: global.reasonName,
      reasonColor: global.reasonColor,
      source: "global" as const,
    });
  }

  return rows;
}

export async function getGlobalAbsenceForDate(date: string) {
  const db = getDb();
  const rows = await db
    .select({
      globalAbsenceId: globalAbsences.id,
      reasonId: absenceReasons.id,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
    })
    .from(globalAbsences)
    .innerJoin(absenceReasons, eq(globalAbsences.reasonId, absenceReasons.id))
    .where(eq(globalAbsences.date, date))
    .limit(1);

  return rows[0] ?? null;
}

export async function getStudentResourceMap() {
  const db = getDb();
  const rows = await db
    .select({
      studentId: students.id,
      subjectName: subjects.name,
      resourceId: resources.id,
      resourceName: resources.name,
    })
    .from(resources)
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .orderBy(asc(students.name), asc(subjects.name), asc(resources.name));

  return rows;
}
