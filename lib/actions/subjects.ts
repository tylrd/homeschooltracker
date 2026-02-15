"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { subjects } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function createSubject(formData: FormData) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const name = formData.get("name") as string;
  const studentId = formData.get("studentId") as string;

  if (!name || !studentId) {
    throw new Error("Name and student are required");
  }

  await db.insert(subjects).values({ organizationId, name, studentId });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}

export async function deleteSubject(id: string, studentId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .delete(subjects)
    .where(
      and(eq(subjects.id, id), eq(subjects.organizationId, organizationId)),
    );
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}
