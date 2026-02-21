import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { absenceReasons } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

const DEFAULT_REASONS = [
  { name: "Sick", color: "red", sortOrder: 0, countsAsPresent: false },
  { name: "Vacation", color: "blue", sortOrder: 1, countsAsPresent: false },
  { name: "Appointment", color: "amber", sortOrder: 2, countsAsPresent: false },
  { name: "Field Trip", color: "emerald", sortOrder: 3, countsAsPresent: true },
];

export async function getAbsenceReasons() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db
    .select()
    .from(absenceReasons)
    .where(eq(absenceReasons.organizationId, organizationId))
    .orderBy(asc(absenceReasons.sortOrder), asc(absenceReasons.name));
}

export async function getOrCreateDefaultReasons() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const existing = await db
    .select()
    .from(absenceReasons)
    .where(eq(absenceReasons.organizationId, organizationId));
  if (existing.length > 0) return existing;

  await db.insert(absenceReasons).values(
    DEFAULT_REASONS.map((reason) => ({
      ...reason,
      organizationId,
    })),
  );
  return db
    .select()
    .from(absenceReasons)
    .where(and(eq(absenceReasons.organizationId, organizationId)))
    .orderBy(asc(absenceReasons.sortOrder), asc(absenceReasons.name));
}
