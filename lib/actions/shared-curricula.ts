"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { sharedCurricula, sharedCurriculumStudents } from "@/db/schema";

export async function createSharedCurriculum(
  name: string,
  description?: string,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Name is required");
  }

  const db = getDb();
  await db.insert(sharedCurricula).values({
    name: trimmed,
    description: description?.trim() || null,
  });

  revalidatePath("/shelf");
  revalidatePath("/");
}

export async function addStudentToSharedCurriculum(
  sharedCurriculumId: string,
  studentId: string,
) {
  const db = getDb();
  await db
    .insert(sharedCurriculumStudents)
    .values({ sharedCurriculumId, studentId })
    .onConflictDoNothing();

  revalidatePath("/shelf");
  revalidatePath("/");
  revalidatePath("/attendance");
  revalidatePath(`/students/${studentId}`);
}

export async function removeStudentFromSharedCurriculum(
  sharedCurriculumId: string,
  studentId: string,
) {
  const db = getDb();
  await db
    .delete(sharedCurriculumStudents)
    .where(
      and(
        eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurriculumId),
        eq(sharedCurriculumStudents.studentId, studentId),
      ),
    );

  revalidatePath("/shelf");
  revalidatePath("/");
  revalidatePath("/attendance");
  revalidatePath(`/students/${studentId}`);
}
