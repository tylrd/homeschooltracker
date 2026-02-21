import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import {
  DEFAULT_LESSON_MOODS,
  type LessonMoodOption,
  normalizeLessonMoodOptions,
} from "@/lib/lesson-moods";

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const rows = await db
    .select()
    .from(appSettings)
    .where(
      and(
        eq(appSettings.organizationId, organizationId),
        eq(appSettings.key, key),
      ),
    )
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function getShowCompletedLessons(): Promise<boolean> {
  const value = await getSetting("showCompletedLessons");
  return value !== "false";
}

export async function getSchoolDays(): Promise<number[]> {
  const value = await getSetting("schoolDays");
  if (!value) return [1, 2, 3, 4, 5];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [1, 2, 3, 4, 5];
  } catch {
    return [1, 2, 3, 4, 5];
  }
}

export async function getDefaultLessonCount(): Promise<number> {
  const value = await getSetting("defaultLessonCount");
  const num = value ? parseInt(value, 10) : 20;
  return Number.isNaN(num) || num < 1 ? 20 : num;
}

export async function getAbsenceAutoBump(): Promise<boolean> {
  const value = await getSetting("absenceAutoBump");
  return value !== "false";
}

export async function getShowNoteButtons(): Promise<boolean> {
  const value = await getSetting("showNoteButtons");
  return value !== "false";
}

export async function getShowDailyLogNotes(): Promise<boolean> {
  const value = await getSetting("showDailyLogNotes");
  return value !== "false";
}

export async function getDashboardGrouping(): Promise<"student" | "subject"> {
  const value = await getSetting("dashboardGrouping");
  return value === "subject" ? "subject" : "student";
}

export async function getDashboardSharedLessonView(): Promise<
  "group" | "student"
> {
  const value = await getSetting("dashboardSharedLessonView");
  return value === "student" ? "student" : "group";
}

export async function getBumpBehavior(): Promise<
  "next_school_day" | "same_day_next_week"
> {
  const value = await getSetting("bumpBehavior");
  return value === "same_day_next_week"
    ? "same_day_next_week"
    : "next_school_day";
}

export async function getCustomMoods(): Promise<LessonMoodOption[]> {
  const value = await getSetting("customMoods");
  if (!value) return DEFAULT_LESSON_MOODS;
  try {
    const parsed = JSON.parse(value);
    return normalizeLessonMoodOptions(parsed);
  } catch {
    return DEFAULT_LESSON_MOODS;
  }
}
