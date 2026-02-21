import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  absenceReasons,
  absences,
  dailyNotes,
  globalAbsences,
  lessons,
  resources,
  sharedCurricula,
  sharedCurriculumStudents,
  sharedLessons,
  students,
  subjects,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

type EffectiveAbsenceRow = {
  studentId: string;
  date: string;
  reasonName: string;
  reasonColor: string;
  studentName: string;
  studentColor: string;
};

type PresentReasonRow = EffectiveAbsenceRow;

async function getPresentReasonRows(
  organizationId: string,
  startDate: string,
  endDate: string,
) {
  const db = getDb();
  const explicitRows = await db
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
    .where(
      and(
        eq(absences.organizationId, organizationId),
        eq(absenceReasons.countsAsPresent, true),
        gte(absences.date, startDate),
        lte(absences.date, endDate),
      ),
    );

  const globalRows = await db
    .select({
      date: globalAbsences.date,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
    })
    .from(globalAbsences)
    .innerJoin(absenceReasons, eq(globalAbsences.reasonId, absenceReasons.id))
    .where(
      and(
        eq(globalAbsences.organizationId, organizationId),
        eq(absenceReasons.countsAsPresent, true),
        gte(globalAbsences.date, startDate),
        lte(globalAbsences.date, endDate),
      ),
    );

  if (globalRows.length === 0) {
    return explicitRows;
  }

  const allStudents = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(students)
    .where(eq(students.organizationId, organizationId))
    .orderBy(asc(students.name));

  const explicitKeys = new Set(
    explicitRows.map((row) => `${row.studentId}|${row.date}`),
  );
  const rows: PresentReasonRow[] = [...explicitRows];

  for (const globalRow of globalRows) {
    for (const student of allStudents) {
      const key = `${student.studentId}|${globalRow.date}`;
      if (explicitKeys.has(key)) continue;
      rows.push({
        studentId: student.studentId,
        date: globalRow.date,
        reasonName: globalRow.reasonName,
        reasonColor: globalRow.reasonColor,
        studentName: student.studentName,
        studentColor: student.studentColor,
      });
    }
  }

  return rows;
}

async function getEffectiveAbsenceRows(
  organizationId: string,
  startDate: string,
  endDate: string,
  completedByDate: Map<string, Set<string>>,
) {
  const db = getDb();

  const explicitRows = await db
    .select({
      studentId: absences.studentId,
      date: absences.date,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
      countsAsPresent: absenceReasons.countsAsPresent,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(absences)
    .innerJoin(absenceReasons, eq(absences.reasonId, absenceReasons.id))
    .innerJoin(students, eq(absences.studentId, students.id))
    .where(
      and(
        eq(absences.organizationId, organizationId),
        gte(absences.date, startDate),
        lte(absences.date, endDate),
      ),
    );

  const globalRows = await db
    .select({
      date: globalAbsences.date,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
      countsAsPresent: absenceReasons.countsAsPresent,
    })
    .from(globalAbsences)
    .innerJoin(absenceReasons, eq(globalAbsences.reasonId, absenceReasons.id))
    .where(
      and(
        eq(globalAbsences.organizationId, organizationId),
        gte(globalAbsences.date, startDate),
        lte(globalAbsences.date, endDate),
      ),
    );

  const filteredExplicit = explicitRows.filter((row) => !row.countsAsPresent);
  if (globalRows.length === 0) {
    return filteredExplicit.map((row) => ({
      studentId: row.studentId,
      date: row.date,
      reasonName: row.reasonName,
      reasonColor: row.reasonColor,
      studentName: row.studentName,
      studentColor: row.studentColor,
    }));
  }

  const allStudents = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(students)
    .where(eq(students.organizationId, organizationId))
    .orderBy(asc(students.name));

  const explicitKeys = new Set(
    filteredExplicit.map((row) => `${row.studentId}|${row.date}`),
  );
  const rows: EffectiveAbsenceRow[] = filteredExplicit.map((row) => ({
    studentId: row.studentId,
    date: row.date,
    reasonName: row.reasonName,
    reasonColor: row.reasonColor,
    studentName: row.studentName,
    studentColor: row.studentColor,
  }));

  for (const globalRow of globalRows) {
    if (globalRow.countsAsPresent) continue;
    const completedForDate = completedByDate.get(globalRow.date) ?? new Set();
    for (const student of allStudents) {
      if (completedForDate.has(student.studentId)) continue;
      const key = `${student.studentId}|${globalRow.date}`;
      if (explicitKeys.has(key)) continue;
      rows.push({
        studentId: student.studentId,
        date: globalRow.date,
        reasonName: globalRow.reasonName,
        reasonColor: globalRow.reasonColor,
        studentName: student.studentName,
        studentColor: student.studentColor,
      });
    }
  }

  return rows;
}

export async function getAttendanceForMonth(year: number, month: number) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  // month is 1-indexed (1 = January)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Get all completions in this month range
  const personalRows = await db
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
        eq(lessons.organizationId, organizationId),
        eq(lessons.status, "completed"),
        gte(lessons.completionDate, startDate),
        lte(lessons.completionDate, endDate),
      ),
    );

  const sharedRows = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
      completionDate: sharedLessons.completionDate,
    })
    .from(sharedLessons)
    .innerJoin(
      sharedCurriculumStudents,
      eq(
        sharedLessons.sharedCurriculumId,
        sharedCurriculumStudents.sharedCurriculumId,
      ),
    )
    .innerJoin(students, eq(sharedCurriculumStudents.studentId, students.id))
    .where(
      and(
        eq(sharedLessons.organizationId, organizationId),
        eq(sharedLessons.status, "completed"),
        gte(sharedLessons.completionDate, startDate),
        lte(sharedLessons.completionDate, endDate),
      ),
    );

  const rows = [...personalRows, ...sharedRows];
  const presentRows = await getPresentReasonRows(
    organizationId,
    startDate,
    endDate,
  );

  // Build set of unique (studentId, date) pairs
  const attendanceMap = new Map<string, Set<string>>();
  const completedByDate = new Map<string, Set<string>>();
  const studentInfo = new Map<string, { name: string; color: string }>();

  for (const row of rows) {
    if (!row.completionDate) continue;

    if (!attendanceMap.has(row.studentId)) {
      attendanceMap.set(row.studentId, new Set());
    }
    attendanceMap.get(row.studentId)?.add(row.completionDate);

    if (!completedByDate.has(row.completionDate)) {
      completedByDate.set(row.completionDate, new Set());
    }
    completedByDate.get(row.completionDate)?.add(row.studentId);

    if (!studentInfo.has(row.studentId)) {
      studentInfo.set(row.studentId, {
        name: row.studentName,
        color: row.studentColor,
      });
    }
  }

  for (const row of presentRows) {
    if (!attendanceMap.has(row.studentId)) {
      attendanceMap.set(row.studentId, new Set());
    }
    attendanceMap.get(row.studentId)?.add(row.date);

    if (!completedByDate.has(row.date)) {
      completedByDate.set(row.date, new Set());
    }
    completedByDate.get(row.date)?.add(row.studentId);

    if (!studentInfo.has(row.studentId)) {
      studentInfo.set(row.studentId, {
        name: row.studentName,
        color: row.studentColor,
      });
    }
  }

  const absenceRows = await getEffectiveAbsenceRows(
    organizationId,
    startDate,
    endDate,
    completedByDate,
  );

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
  lessonKind: "personal" | "shared";
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
  const { organizationId } = await getTenantContext();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const personalRows = await db
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
      lessonKind: sql<"personal">`'personal'`,
    })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(
      and(
        eq(lessons.organizationId, organizationId),
        eq(lessons.status, "completed"),
        gte(lessons.completionDate, startDate),
        lte(lessons.completionDate, endDate),
      ),
    );

  const sharedRows = await db
    .select({
      completionDate: sharedLessons.completionDate,
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
      subjectName: sql<string>`'Shared Curriculum'`,
      resourceName: sharedCurricula.name,
      lessonTitle: sharedLessons.title,
      lessonNumber: sharedLessons.lessonNumber,
      lessonId: sharedLessons.id,
      lessonKind: sql<"shared">`'shared'`,
    })
    .from(sharedLessons)
    .innerJoin(
      sharedCurricula,
      eq(sharedLessons.sharedCurriculumId, sharedCurricula.id),
    )
    .innerJoin(
      sharedCurriculumStudents,
      eq(
        sharedLessons.sharedCurriculumId,
        sharedCurriculumStudents.sharedCurriculumId,
      ),
    )
    .innerJoin(students, eq(sharedCurriculumStudents.studentId, students.id))
    .where(
      and(
        eq(sharedLessons.organizationId, organizationId),
        eq(sharedLessons.status, "completed"),
        gte(sharedLessons.completionDate, startDate),
        lte(sharedLessons.completionDate, endDate),
      ),
    );

  const rows = [...personalRows, ...sharedRows].sort((a, b) => {
    const byDate = (a.completionDate ?? "").localeCompare(
      b.completionDate ?? "",
    );
    if (byDate !== 0) return byDate;
    const byStudent = a.studentName.localeCompare(b.studentName);
    if (byStudent !== 0) return byStudent;
    const bySubject = a.subjectName.localeCompare(b.subjectName);
    if (bySubject !== 0) return bySubject;
    return a.lessonNumber - b.lessonNumber;
  });

  const completedByDate = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.completionDate) continue;
    if (!completedByDate.has(row.completionDate)) {
      completedByDate.set(row.completionDate, new Set());
    }
    completedByDate.get(row.completionDate)?.add(row.studentId);
  }

  const presentReasons = await getPresentReasonRows(
    organizationId,
    startDate,
    endDate,
  );
  for (const row of presentReasons) {
    if (!completedByDate.has(row.date)) {
      completedByDate.set(row.date, new Set());
    }
    completedByDate.get(row.date)?.add(row.studentId);
  }

  const absenceRows = await getEffectiveAbsenceRows(
    organizationId,
    startDate,
    endDate,
    completedByDate,
  );

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
    .where(
      and(
        eq(dailyNotes.organizationId, organizationId),
        gte(dailyNotes.date, startDate),
        lte(dailyNotes.date, endDate),
      ),
    )
    .orderBy(asc(dailyNotes.date), asc(students.name));

  return {
    completions: rows as CompletionLogEntry[],
    absences: absenceRows,
    presentReasons,
    notes: noteRows as DailyLogNoteEntry[],
  };
}

export async function getAllStudents() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findMany({
    where: eq(students.organizationId, organizationId),
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}
