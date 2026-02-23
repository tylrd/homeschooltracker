"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { dailyRewards } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import { getDailyCompletionRewardStatus } from "@/lib/queries/rewards";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAILY_COMPLETION_REWARD_TYPE = "all_lessons_completed";

export async function trackDailyCompletionReward(date: string) {
  if (!DATE_RE.test(date)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  const status = await getDailyCompletionRewardStatus(date);
  if (!status.isEligible) {
    throw new Error("Reward is still locked until all lessons are completed.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();

  await db
    .insert(dailyRewards)
    .values({
      organizationId,
      rewardDate: date,
      rewardType: DAILY_COMPLETION_REWARD_TYPE,
      points: 1,
    })
    .onConflictDoNothing({
      target: [
        dailyRewards.organizationId,
        dailyRewards.rewardDate,
        dailyRewards.rewardType,
      ],
    });

  revalidatePath("/");
  revalidatePath("/dashboard");
}
