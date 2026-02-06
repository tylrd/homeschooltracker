"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { absences, lessons, resources, subjects, students } from "@/db/schema";
import { bumpStudentLessons } from "@/lib/actions/lessons";

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

  // Bump this student's planned lessons for the day
  await bumpStudentLessons(studentId, date);

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function logAbsenceForAll(date: string, reasonId: string) {
  const db = getDb();

  // Find all students who have planned lessons on this date
  const rows = await db
    .select({ studentId: students.id })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(and(eq(lessons.scheduledDate, date), eq(lessons.status, "planned")));

  const studentIds = [...new Set(rows.map((r) => r.studentId))];

  for (const studentId of studentIds) {
    // Check if absence already exists
    const existing = await db
      .select()
      .from(absences)
      .where(and(eq(absences.studentId, studentId), eq(absences.date, date)));

    if (existing.length === 0) {
      await db.insert(absences).values({ studentId, date, reasonId });
    }

    await bumpStudentLessons(studentId, date);
  }

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function removeAbsence(absenceId: string) {
  const db = getDb();
  await db.delete(absences).where(eq(absences.id, absenceId));

  revalidatePath("/");
  revalidatePath("/attendance");
}
