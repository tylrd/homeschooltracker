"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import {
  type LessonMoodOption,
  normalizeLessonMoodOptions,
} from "@/lib/lesson-moods";

export async function setSetting(key: string, value: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .insert(appSettings)
    .values({ organizationId, key, value })
    .onConflictDoUpdate({
      target: [appSettings.organizationId, appSettings.key],
      set: { value },
    });

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/attendance");
}

export async function setShowCompletedLessons(show: boolean) {
  await setSetting("showCompletedLessons", String(show));
}

export async function setSchoolDays(days: number[]) {
  await setSetting("schoolDays", JSON.stringify(days));
}

export async function setDefaultLessonCount(count: number) {
  await setSetting("defaultLessonCount", String(count));
}

export async function setAbsenceAutoBump(enabled: boolean) {
  await setSetting("absenceAutoBump", String(enabled));
}

export async function setShowNoteButtons(show: boolean) {
  await setSetting("showNoteButtons", String(show));
}

export async function setDashboardGrouping(mode: "student" | "subject") {
  await setSetting("dashboardGrouping", mode);
}

export async function setDashboardSharedLessonView(mode: "group" | "student") {
  await setSetting("dashboardSharedLessonView", mode);
}

export async function setBumpBehavior(
  behavior: "next_school_day" | "same_day_next_week",
) {
  await setSetting("bumpBehavior", behavior);
}

export async function setShowDailyLogNotes(show: boolean) {
  await setSetting("showDailyLogNotes", String(show));
}

export async function setCustomMoods(moods: LessonMoodOption[]) {
  const sanitized = normalizeLessonMoodOptions(moods);
  await setSetting("customMoods", JSON.stringify(sanitized));
}
