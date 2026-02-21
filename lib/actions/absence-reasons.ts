"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { absenceReasons } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function createAbsenceReason(
  name: string,
  color: string,
  countsAsPresent = false,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  // Get the next sort order
  const existing = await db
    .select()
    .from(absenceReasons)
    .where(eq(absenceReasons.organizationId, organizationId));
  const maxSort = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1);

  const [createdReason] = await db
    .insert(absenceReasons)
    .values({
      organizationId,
      name: name.trim(),
      color,
      countsAsPresent,
      sortOrder: maxSort + 1,
    })
    .returning();

  revalidatePath("/settings");
  revalidatePath("/");

  return createdReason;
}

export async function deleteAbsenceReason(reasonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .delete(absenceReasons)
    .where(
      and(
        eq(absenceReasons.id, reasonId),
        eq(absenceReasons.organizationId, organizationId),
      ),
    );

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function reorderAbsenceReasons(orderedIds: string[]) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(absenceReasons)
        .set({ sortOrder: i })
        .where(
          and(
            eq(absenceReasons.id, orderedIds[i]),
            eq(absenceReasons.organizationId, organizationId),
          ),
        );
    }
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function updateAbsenceReasonCountsAsPresent(
  reasonId: string,
  countsAsPresent: boolean,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(absenceReasons)
    .set({ countsAsPresent })
    .where(
      and(
        eq(absenceReasons.id, reasonId),
        eq(absenceReasons.organizationId, organizationId),
      ),
    );

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/attendance");
}
