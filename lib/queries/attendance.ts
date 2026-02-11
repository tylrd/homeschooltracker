import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  absenceReasons,
  absences,
  dailyNotes,
  lessons,
  resources,
  students,
  subjects,
} from "@/db/schema";

export async function getAttendanceForMonth(year: number, month: number) {
  const db = getDb();
  // month is 1-indexed (1 = January)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Get all completions in this month range
  const rows = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
      completionDate: lessons.completionDate,
    })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(
      and(
        eq(lessons.status, "completed"),
        gte(lessons.completionDate, startDate),
        lte(lessons.completionDate, endDate),
      ),
    );

  // Build set of unique (studentId, date) pairs
  const attendanceMap = new Map<string, Set<string>>();
  const studentInfo = new Map<string, { name: string; color: string }>();

  for (const row of rows) {
    if (!row.completionDate) continue;

    if (!attendanceMap.has(row.studentId)) {
      attendanceMap.set(row.studentId, new Set());
    }
    attendanceMap.get(row.studentId)?.add(row.completionDate);

    if (!studentInfo.has(row.studentId)) {
      studentInfo.set(row.studentId, {
        name: row.studentName,
        color: row.studentColor,
      });
    }
  }

  // Get absences for the month
  const absenceRows = await db
    .select({
      studentId: absences.studentId,
      date: absences.date,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(absences)
    .innerJoin(absenceReasons, eq(absences.reasonId, absenceReasons.id))
    .innerJoin(students, eq(absences.studentId, students.id))
    .where(and(gte(absences.date, startDate), lte(absences.date, endDate)));

  // Build absence map: studentId -> date -> { reasonName, reasonColor }
  const absenceMap = new Map<
    string,
    Map<string, { reasonName: string; reasonColor: string }>
  >();

  for (const row of absenceRows) {
    if (!absenceMap.has(row.studentId)) {
      absenceMap.set(row.studentId, new Map());
    }
    absenceMap.get(row.studentId)?.set(row.date, {
      reasonName: row.reasonName,
      reasonColor: row.reasonColor,
    });

    // Ensure students with absences but no completions still appear
    if (!studentInfo.has(row.studentId)) {
      studentInfo.set(row.studentId, {
        name: row.studentName,
        color: row.studentColor,
      });
    }
  }

  return { attendanceMap, absenceMap, studentInfo, year, month, lastDay };
}

export type CompletionLogEntry = {
  completionDate: string;
  studentId: string;
  studentName: string;
  studentColor: string;
  subjectName: string;
  resourceName: string;
  lessonTitle: string | null;
  lessonNumber: number;
  lessonId: string;
};

export type DailyLogNoteEntry = {
  studentId: string;
  date: string;
  content: string;
  studentName: string;
  studentColor: string;
};

export async function getCompletionLogForMonth(year: number, month: number) {
  const db = getDb();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db
    .select({
      completionDate: lessons.completionDate,
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
      subjectName: subjects.name,
      resourceName: resources.name,
      lessonTitle: lessons.title,
      lessonNumber: lessons.lessonNumber,
      lessonId: lessons.id,
    })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(
      and(
        eq(lessons.status, "completed"),
        gte(lessons.completionDate, startDate),
        lte(lessons.completionDate, endDate),
      ),
    )
    .orderBy(
      asc(lessons.completionDate),
      asc(students.name),
      asc(subjects.name),
      asc(lessons.lessonNumber),
    );

  // Get absences for the month
  const absenceRows = await db
    .select({
      studentId: absences.studentId,
      date: absences.date,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(absences)
    .innerJoin(absenceReasons, eq(absences.reasonId, absenceReasons.id))
    .innerJoin(students, eq(absences.studentId, students.id))
    .where(and(gte(absences.date, startDate), lte(absences.date, endDate)));

  const noteRows = await db
    .select({
      studentId: dailyNotes.studentId,
      date: dailyNotes.date,
      content: dailyNotes.content,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(dailyNotes)
    .innerJoin(students, eq(dailyNotes.studentId, students.id))
    .where(and(gte(dailyNotes.date, startDate), lte(dailyNotes.date, endDate)))
    .orderBy(asc(dailyNotes.date), asc(students.name));

  return {
    completions: rows as CompletionLogEntry[],
    absences: absenceRows,
    notes: noteRows as DailyLogNoteEntry[],
  };
}

export async function getAllStudents() {
  const db = getDb();
  return db.query.students.findMany({
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}
