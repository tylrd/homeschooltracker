"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { absenceReasons } from "@/db/schema";

export async function createAbsenceReason(name: string, color: string) {
  const db = getDb();

  // Get the next sort order
  const existing = await db.select().from(absenceReasons);
  const maxSort = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1);

  await db.insert(absenceReasons).values({
    name: name.trim(),
    color,
    sortOrder: maxSort + 1,
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function deleteAbsenceReason(reasonId: string) {
  const db = getDb();
  await db.delete(absenceReasons).where(eq(absenceReasons.id, reasonId));

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/attendance");
}
