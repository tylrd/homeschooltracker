"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { dailyNotes } from "@/db/schema";

export async function upsertNote(
  studentId: string,
  date: string,
  content: string,
) {
  const db = getDb();
  // Check for existing note
  const existing = await db.query.dailyNotes.findFirst({
    where: and(eq(dailyNotes.studentId, studentId), eq(dailyNotes.date, date)),
  });

  if (existing) {
    if (content.trim() === "") {
      await db.delete(dailyNotes).where(eq(dailyNotes.id, existing.id));
    } else {
      await db
        .update(dailyNotes)
        .set({ content })
        .where(eq(dailyNotes.id, existing.id));
    }
  } else if (content.trim() !== "") {
    await db.insert(dailyNotes).values({ studentId, date, content });
  }

  revalidatePath("/");
  revalidatePath("/attendance");
}
