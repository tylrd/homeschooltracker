"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  absences,
  globalAbsences,
  lessons,
  resources,
  students,
  subjects,
} from "@/db/schema";
import { bumpStudentLessons } from "@/lib/actions/lessons";
import { getAbsenceAutoBump } from "@/lib/queries/settings";

export async function logAbsence(
  studentId: string,
  date: string,
  reasonId: string,
) {
  const db = getDb();

  // Check if an absence already exists for this student+date
  const existing = await db
    .select()
    .from(absences)
    .where(and(eq(absences.studentId, studentId), eq(absences.date, date)));

  if (existing.length > 0) {
    // Update the existing absence reason
    await db
      .update(absences)
      .set({ reasonId })
      .where(eq(absences.id, existing[0].id));
  } else {
    await db.insert(absences).values({ studentId, date, reasonId });
  }

  // Bump this student's planned lessons for the day (if auto-bump is enabled)
  const autoBump = await getAbsenceAutoBump();
  if (autoBump) {
    await bumpStudentLessons(studentId, date);
  }

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function logAbsenceForAll(date: string, reasonId: string) {
  const db = getDb();

  const existingGlobal = await db
    .select({ id: globalAbsences.id })
    .from(globalAbsences)
    .where(eq(globalAbsences.date, date))
    .limit(1);

  if (existingGlobal.length > 0) {
    await db
      .update(globalAbsences)
      .set({ reasonId })
      .where(eq(globalAbsences.id, existingGlobal[0].id));
  } else {
    await db.insert(globalAbsences).values({ date, reasonId });
  }

  const autoBump = await getAbsenceAutoBump();
  if (!autoBump) {
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
      and(eq(lessons.status, "completed"), eq(lessons.completionDate, date)),
    );

  const completedStudentIds = new Set(completedRows.map((r) => r.studentId));
  const allStudents = await db
    .select({ studentId: students.id })
    .from(students);

  for (const { studentId } of allStudents) {
    if (completedStudentIds.has(studentId)) continue;
    await bumpStudentLessons(studentId, date);
  }

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function removeGlobalAbsence(globalAbsenceId: string) {
  const db = getDb();
  await db.delete(globalAbsences).where(eq(globalAbsences.id, globalAbsenceId));

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function removeAbsence(absenceId: string) {
  const db = getDb();
  await db.delete(absences).where(eq(absences.id, absenceId));

  revalidatePath("/");
  revalidatePath("/attendance");
}
