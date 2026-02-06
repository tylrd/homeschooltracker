"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { resources } from "@/db/schema";

export async function createResource(formData: FormData) {
  const name = formData.get("name") as string;
  const subjectId = formData.get("subjectId") as string;
  const studentId = formData.get("studentId") as string;

  if (!name || !subjectId) {
    throw new Error("Name and subject are required");
  }

  await db.insert(resources).values({ name, subjectId });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}

export async function deleteResource(
  id: string,
  studentId: string,
) {
  await db.delete(resources).where(eq(resources.id, id));
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}
