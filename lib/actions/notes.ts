"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { dailyNotes } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function upsertNote(
  studentId: string,
  date: string,
  content: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  // Check for existing note
  const existing = await db.query.dailyNotes.findFirst({
    where: and(
      eq(dailyNotes.organizationId, organizationId),
      eq(dailyNotes.studentId, studentId),
      eq(dailyNotes.date, date),
    ),
  });

  if (existing) {
    if (content.trim() === "") {
      await db
        .delete(dailyNotes)
        .where(
          and(
            eq(dailyNotes.id, existing.id),
            eq(dailyNotes.organizationId, organizationId),
          ),
        );
    } else {
      await db
        .update(dailyNotes)
        .set({ content })
        .where(
          and(
            eq(dailyNotes.id, existing.id),
            eq(dailyNotes.organizationId, organizationId),
          ),
        );
    }
  } else if (content.trim() !== "") {
    await db
      .insert(dailyNotes)
      .values({ organizationId, studentId, date, content });
  }

  revalidatePath("/");
  revalidatePath("/attendance");
}
