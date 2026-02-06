"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { students } from "@/db/schema";

export async function createStudent(formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const gradeLevel = (formData.get("gradeLevel") as string) || null;

  if (!name || !color) {
    throw new Error("Name and color are required");
  }

  await db.insert(students).values({ name, color, gradeLevel });
  revalidatePath("/students");
}

export async function updateStudent(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const gradeLevel = (formData.get("gradeLevel") as string) || null;

  if (!name || !color) {
    throw new Error("Name and color are required");
  }

  await db.update(students).set({ name, color, gradeLevel }).where(eq(students.id, id));
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}

export async function deleteStudent(id: string) {
  await db.delete(students).where(eq(students.id, id));
  revalidatePath("/students");
}
