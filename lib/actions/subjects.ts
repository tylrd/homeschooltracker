"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { subjects } from "@/db/schema";

export async function createSubject(formData: FormData) {
  const db = getDb();
  const name = formData.get("name") as string;
  const studentId = formData.get("studentId") as string;

  if (!name || !studentId) {
    throw new Error("Name and student are required");
  }

  await db.insert(subjects).values({ name, studentId });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}

export async function deleteSubject(id: string, studentId: string) {
  const db = getDb();
  await db.delete(subjects).where(eq(subjects.id, id));
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}
