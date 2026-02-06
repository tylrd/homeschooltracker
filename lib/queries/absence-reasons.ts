import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { absenceReasons } from "@/db/schema";

const DEFAULT_REASONS = [
  { name: "Sick", color: "red", sortOrder: 0 },
  { name: "Vacation", color: "blue", sortOrder: 1 },
  { name: "Appointment", color: "amber", sortOrder: 2 },
];

export async function getAbsenceReasons() {
  const db = getDb();
  return db
    .select()
    .from(absenceReasons)
    .orderBy(asc(absenceReasons.sortOrder), asc(absenceReasons.name));
}

export async function getOrCreateDefaultReasons() {
  const db = getDb();
  const existing = await db.select().from(absenceReasons);
  if (existing.length > 0) return existing;

  await db.insert(absenceReasons).values(DEFAULT_REASONS);
  return db
    .select()
    .from(absenceReasons)
    .orderBy(asc(absenceReasons.sortOrder), asc(absenceReasons.name));
}
