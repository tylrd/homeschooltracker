import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  absenceReasons,
  absences,
  dailyNotes,
  globalAbsences,
  lessons,
  lessonWorkSamples,
  resources,
  sharedCurricula,
  sharedCurriculumStudents,
  sharedLessons,
  sharedLessonWorkSamples,
  students,
  subjects,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

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
  const { organizationId } = await getTenantContext();
  const conditions = [
    eq(lessons.organizationId, organizationId),
    eq(lessons.scheduledDate, date),
  ];

  if (studentId) {
    conditions.push(eq(students.id, studentId));
  }

  const rows = await db
    .select({
      lessonId: lessons.id,
      lessonNumber: lessons.lessonNumber,
      lessonTitle: lessons.title,
      lessonPlan: lessons.plan,
      lessonMood: lessons.mood,
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

  const lessonIds = rows.map((row) => row.lessonId);
  if (lessonIds.length === 0) {
    return rows.map((row) => ({
      ...row,
      workSampleCount: 0,
      workSampleImageIds: [] as string[],
    }));
  }

  const sampleRows = await db.query.lessonWorkSamples.findMany({
    where: and(
      eq(lessonWorkSamples.organizationId, organizationId),
      inArray(lessonWorkSamples.lessonId, lessonIds),
    ),
    columns: { lessonId: true, imageId: true },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const sampleMap = new Map<string, string[]>();
  for (const sample of sampleRows) {
    const existing = sampleMap.get(sample.lessonId) ?? [];
    existing.push(sample.imageId);
    sampleMap.set(sample.lessonId, existing);
  }

  return rows.map((row) => {
    const imageIds = sampleMap.get(row.lessonId) ?? [];
    return {
      ...row,
      workSampleCount: imageIds.length,
      workSampleImageIds: imageIds.slice(0, 8),
    };
  });
}

export async function getTodaySharedLessons(date: string, studentId?: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const conditions = [
    eq(sharedLessons.organizationId, organizationId),
    eq(sharedLessons.scheduledDate, date),
  ];

  if (studentId) {
    conditions.push(eq(students.id, studentId));
  }

  const rows = await db
    .select({
      sharedLessonId: sharedLessons.id,
      lessonNumber: sharedLessons.lessonNumber,
      lessonTitle: sharedLessons.title,
      lessonPlan: sharedLessons.plan,
      lessonMood: sharedLessons.mood,
      lessonStatus: sharedLessons.status,
      scheduledDate: sharedLessons.scheduledDate,
      sharedCurriculumId: sharedCurricula.id,
      sharedCurriculumName: sharedCurricula.name,
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(sharedLessons)
    .innerJoin(
      sharedCurricula,
      eq(sharedLessons.sharedCurriculumId, sharedCurricula.id),
    )
    .innerJoin(
      sharedCurriculumStudents,
      eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurricula.id),
    )
    .innerJoin(students, eq(sharedCurriculumStudents.studentId, students.id))
    .where(and(...conditions))
    .orderBy(students.name, sharedCurricula.name, sharedLessons.lessonNumber);

  const sharedLessonIds = rows.map((row) => row.sharedLessonId);
  if (sharedLessonIds.length === 0) {
    return rows.map((row) => ({
      ...row,
      workSampleCount: 0,
      workSampleImageIds: [] as string[],
    }));
  }

  const sampleRows = await db.query.sharedLessonWorkSamples.findMany({
    where: and(
      eq(sharedLessonWorkSamples.organizationId, organizationId),
      inArray(sharedLessonWorkSamples.sharedLessonId, sharedLessonIds),
    ),
    columns: { sharedLessonId: true, imageId: true },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const sampleMap = new Map<string, string[]>();
  for (const sample of sampleRows) {
    const existing = sampleMap.get(sample.sharedLessonId) ?? [];
    existing.push(sample.imageId);
    sampleMap.set(sample.sharedLessonId, existing);
  }

  return rows.map((row) => {
    const imageIds = sampleMap.get(row.sharedLessonId) ?? [];
    return {
      ...row,
      workSampleCount: imageIds.length,
      workSampleImageIds: imageIds.slice(0, 8),
    };
  });
}

export async function getSharedCurriculaForDashboardAdd(
  date: string,
  studentId?: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const rows = await db
    .select({
      sharedCurriculumId: sharedCurricula.id,
      sharedCurriculumName: sharedCurricula.name,
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
      existingLessonId: sharedLessons.id,
    })
    .from(sharedCurricula)
    .innerJoin(
      sharedCurriculumStudents,
      eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurricula.id),
    )
    .innerJoin(students, eq(sharedCurriculumStudents.studentId, students.id))
    .leftJoin(
      sharedLessons,
      and(
        eq(sharedLessons.sharedCurriculumId, sharedCurricula.id),
        eq(sharedLessons.organizationId, organizationId),
        eq(sharedLessons.scheduledDate, date),
      ),
    )
    .where(
      and(
        eq(sharedCurricula.organizationId, organizationId),
        studentId ? eq(students.id, studentId) : undefined,
      ),
    )
    .orderBy(asc(sharedCurricula.name), asc(students.name));

  const byCurriculum = new Map<
    string,
    {
      sharedCurriculumId: string;
      sharedCurriculumName: string;
      students: { id: string; name: string; color: string }[];
      isScheduledToday: boolean;
      existingLessonId: string | null;
    }
  >();

  for (const row of rows) {
    const existing = byCurriculum.get(row.sharedCurriculumId);
    const student = {
      id: row.studentId,
      name: row.studentName,
      color: row.studentColor,
    };
    if (existing) {
      existing.students.push(student);
      existing.isScheduledToday =
        existing.isScheduledToday || !!row.existingLessonId;
      if (!existing.existingLessonId && row.existingLessonId) {
        existing.existingLessonId = row.existingLessonId;
      }
    } else {
      byCurriculum.set(row.sharedCurriculumId, {
        sharedCurriculumId: row.sharedCurriculumId,
        sharedCurriculumName: row.sharedCurriculumName,
        students: [student],
        isScheduledToday: !!row.existingLessonId,
        existingLessonId: row.existingLessonId,
      });
    }
  }

  return Array.from(byCurriculum.values());
}

export async function getTodayNotes(date: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
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
    .where(
      and(
        eq(dailyNotes.organizationId, organizationId),
        eq(dailyNotes.date, date),
      ),
    )
    .orderBy(students.name);
}

export async function getStudentsForFilter() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findMany({
    where: eq(students.organizationId, organizationId),
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}

export async function getAbsencesForDate(date: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const explicitRows = await db
    .select({
      absenceId: absences.id,
      studentId: absences.studentId,
      reasonId: absenceReasons.id,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
      countsAsPresent: absenceReasons.countsAsPresent,
    })
    .from(absences)
    .innerJoin(absenceReasons, eq(absences.reasonId, absenceReasons.id))
    .where(
      and(eq(absences.organizationId, organizationId), eq(absences.date, date)),
    );

  const globalRows = await db
    .select({
      globalAbsenceId: globalAbsences.id,
      reasonId: absenceReasons.id,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
      countsAsPresent: absenceReasons.countsAsPresent,
    })
    .from(globalAbsences)
    .innerJoin(absenceReasons, eq(globalAbsences.reasonId, absenceReasons.id))
    .where(
      and(
        eq(globalAbsences.organizationId, organizationId),
        eq(globalAbsences.date, date),
      ),
    )
    .limit(1);

  const rows: DashboardAbsenceRow[] = explicitRows
    .filter((row) => !row.countsAsPresent)
    .map((row) => ({
      absenceId: row.absenceId,
      studentId: row.studentId,
      reasonId: row.reasonId,
      reasonName: row.reasonName,
      reasonColor: row.reasonColor,
      source: "individual",
    }));

  const global = globalRows[0];
  if (!global) return rows;
  if (global.countsAsPresent) return rows;

  const completedRows = await db
    .select({ studentId: students.id })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(
      and(
        eq(lessons.organizationId, organizationId),
        eq(lessons.status, "completed"),
        eq(lessons.completionDate, date),
      ),
    );

  const explicitStudentIds = new Set(explicitRows.map((r) => r.studentId));
  const completedStudentIds = new Set(completedRows.map((r) => r.studentId));
  const allStudentRows = await db
    .select({ studentId: students.id })
    .from(students)
    .where(eq(students.organizationId, organizationId));

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
  const { organizationId } = await getTenantContext();
  const rows = await db
    .select({
      globalAbsenceId: globalAbsences.id,
      reasonId: absenceReasons.id,
      reasonName: absenceReasons.name,
      reasonColor: absenceReasons.color,
      countsAsPresent: absenceReasons.countsAsPresent,
    })
    .from(globalAbsences)
    .innerJoin(absenceReasons, eq(globalAbsences.reasonId, absenceReasons.id))
    .where(
      and(
        eq(globalAbsences.organizationId, organizationId),
        eq(globalAbsences.date, date),
      ),
    )
    .limit(1);

  const row = rows[0] ?? null;
  if (!row || row.countsAsPresent) return null;
  return row;
}

export async function getStudentResourceMap() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
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
    .where(eq(resources.organizationId, organizationId))
    .orderBy(asc(students.name), asc(subjects.name), asc(resources.name));

  return rows;
}
