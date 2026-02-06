import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function getShowCompletedLessons(): Promise<boolean> {
  const value = await getSetting("showCompletedLessons");
  return value !== "false";
}
