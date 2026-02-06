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
