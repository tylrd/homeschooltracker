"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { students } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function createStudent(formData: FormData) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const gradeLevel = (formData.get("gradeLevel") as string) || null;

  if (!name || !color) {
    throw new Error("Name and color are required");
  }

  await db.insert(students).values({ organizationId, name, color, gradeLevel });
  revalidatePath("/students");
}

export async function updateStudent(id: string, formData: FormData) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const gradeLevel = (formData.get("gradeLevel") as string) || null;

  if (!name || !color) {
    throw new Error("Name and color are required");
  }

  await db
    .update(students)
    .set({ name, color, gradeLevel })
    .where(
      and(eq(students.id, id), eq(students.organizationId, organizationId)),
    );
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}

export async function deleteStudent(id: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .delete(students)
    .where(
      and(eq(students.id, id), eq(students.organizationId, organizationId)),
    );
  revalidatePath("/students");
}
