import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  lessons,
  resources,
  subjects,
  students,
  absences,
  absenceReasons,
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
    attendanceMap.get(row.studentId)!.add(row.completionDate);

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
    absenceMap.get(row.studentId)!.set(row.date, {
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

export async function getAllStudents() {
  const db = getDb();
  return db.query.students.findMany({
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}
