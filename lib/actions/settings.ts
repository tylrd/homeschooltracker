"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";

export async function setSetting(key: string, value: string) {
  const db = getDb();
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } });

  revalidatePath("/");
  revalidatePath("/settings");
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

export async function setBumpBehavior(
  behavior: "next_school_day" | "same_day_next_week",
) {
  await setSetting("bumpBehavior", behavior);
}
