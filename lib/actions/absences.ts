"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  absenceReasons,
  absences,
  globalAbsences,
  lessons,
  resources,
  students,
  subjects,
} from "@/db/schema";
import { bumpStudentLessons } from "@/lib/actions/lessons";
import { getTenantContext } from "@/lib/auth/session";
import { getAbsenceAutoBump } from "@/lib/queries/settings";

export async function logAbsence(
  studentId: string,
  date: string,
  reasonId: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  // Check if an absence already exists for this student+date
  const existing = await db
    .select()
    .from(absences)
    .where(
      and(
        eq(absences.organizationId, organizationId),
        eq(absences.studentId, studentId),
        eq(absences.date, date),
      ),
    );

  if (existing.length > 0) {
    // Update the existing absence reason
    await db
      .update(absences)
      .set({ reasonId })
      .where(
        and(
          eq(absences.id, existing[0].id),
          eq(absences.organizationId, organizationId),
        ),
      );
  } else {
    await db
      .insert(absences)
      .values({ organizationId, studentId, date, reasonId });
  }

  // Bump this student's planned lessons for the day (if auto-bump is enabled)
  const [autoBump, reason] = await Promise.all([
    getAbsenceAutoBump(),
    db.query.absenceReasons.findFirst({
      where: and(
        eq(absenceReasons.organizationId, organizationId),
        eq(absenceReasons.id, reasonId),
      ),
      columns: { countsAsPresent: true },
    }),
  ]);
  if (autoBump && !reason?.countsAsPresent) {
    await bumpStudentLessons(studentId, date);
  }

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function logAbsenceForAll(date: string, reasonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const existingGlobal = await db
    .select({ id: globalAbsences.id })
    .from(globalAbsences)
    .where(
      and(
        eq(globalAbsences.organizationId, organizationId),
        eq(globalAbsences.date, date),
      ),
    )
    .limit(1);

  if (existingGlobal.length > 0) {
    await db
      .update(globalAbsences)
      .set({ reasonId })
      .where(
        and(
          eq(globalAbsences.id, existingGlobal[0].id),
          eq(globalAbsences.organizationId, organizationId),
        ),
      );
  } else {
    await db.insert(globalAbsences).values({ organizationId, date, reasonId });
  }

  const [autoBump, reason] = await Promise.all([
    getAbsenceAutoBump(),
    db.query.absenceReasons.findFirst({
      where: and(
        eq(absenceReasons.organizationId, organizationId),
        eq(absenceReasons.id, reasonId),
      ),
      columns: { countsAsPresent: true },
    }),
  ]);
  if (!autoBump || reason?.countsAsPresent) {
    revalidatePath("/");
    revalidatePath("/attendance");
    return;
  }

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

  const completedStudentIds = new Set(completedRows.map((r) => r.studentId));
  const allStudents = await db
    .select({ studentId: students.id })
    .from(students)
    .where(eq(students.organizationId, organizationId));

  for (const { studentId } of allStudents) {
    if (completedStudentIds.has(studentId)) continue;
    await bumpStudentLessons(studentId, date);
  }

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function removeGlobalAbsence(globalAbsenceId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .delete(globalAbsences)
    .where(
      and(
        eq(globalAbsences.id, globalAbsenceId),
        eq(globalAbsences.organizationId, organizationId),
      ),
    );

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function removeAbsence(absenceId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .delete(absences)
    .where(
      and(
        eq(absences.id, absenceId),
        eq(absences.organizationId, organizationId),
      ),
    );

  revalidatePath("/");
  revalidatePath("/attendance");
}
