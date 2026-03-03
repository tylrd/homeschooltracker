"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { dailyRewards, studentStreaks, studentXpLedger } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import { toDateString } from "@/lib/dates";
import { getDailyCompletionRewardStatus } from "@/lib/queries/rewards";
import { calculateDailyRewardAwards } from "@/lib/rewards/daily-modifiers";
import {
  levelUpStudentInTransaction,
  prestigeStudentInTransaction,
  togglePerkEquippedInTransaction,
  unlockPerkInTransaction,
} from "@/lib/rewards/leveling";
import {
  cancelRewardRedemptionInTransaction,
  fulfillRewardRedemptionInTransaction,
  redeemRewardTemplateInTransaction,
} from "@/lib/rewards/redemptions";

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
  const qualifyingStudents = status.students.filter(
    (student) =>
      student.totalLessons > 0 &&
      student.totalLessons === student.completedLessons,
  );
  const qualifyingIds = qualifyingStudents.map((student) => student.studentId);
  if (qualifyingIds.length === 0) {
    throw new Error("No qualifying students for this daily reward.");
  }

  await db.transaction(async (tx) => {
    const [xpRows, streakRows] = await Promise.all([
      tx
        .select({
          studentId: studentXpLedger.studentId,
          xpBalance:
            sql<number>`coalesce(sum(${studentXpLedger.points}), 0)`.mapWith(
              Number,
            ),
        })
        .from(studentXpLedger)
        .where(
          and(
            eq(studentXpLedger.organizationId, organizationId),
            inArray(studentXpLedger.studentId, qualifyingIds),
          ),
        )
        .groupBy(studentXpLedger.studentId),
      tx.query.studentStreaks.findMany({
        where: and(
          eq(studentStreaks.organizationId, organizationId),
          inArray(studentStreaks.studentId, qualifyingIds),
        ),
        columns: {
          studentId: true,
          currentStreak: true,
        },
      }),
    ]);

    const xpByStudent = new Map(
      xpRows.map((row) => [row.studentId, row.xpBalance] as const),
    );
    const streakByStudent = new Map(
      streakRows.map((row) => [row.studentId, row.currentStreak] as const),
    );

    const rewardPlan = calculateDailyRewardAwards({
      organizationId,
      date,
      students: qualifyingStudents.map((student) => ({
        studentId: student.studentId,
        totalLessons: student.totalLessons,
        xpBalance: xpByStudent.get(student.studentId) ?? 0,
        currentStreak: streakByStudent.get(student.studentId) ?? 0,
      })),
    });

    const [trackedReward] = await tx
      .insert(dailyRewards)
      .values({
        organizationId,
        rewardDate: date,
        rewardType: DAILY_COMPLETION_REWARD_TYPE,
        points: rewardPlan.totalAwardedXp,
      })
      .onConflictDoNothing({
        target: [
          dailyRewards.organizationId,
          dailyRewards.rewardDate,
          dailyRewards.rewardType,
        ],
      })
      .returning({ id: dailyRewards.id });

    if (!trackedReward) {
      return;
    }

    await tx.insert(studentXpLedger).values(
      rewardPlan.awards.map((award) => ({
        organizationId,
        studentId: award.studentId,
        eventType: "daily_reward" as const,
        points: award.totalXp,
        eventDate: date,
        metadata: {
          rewardDate: date,
          rewardType: DAILY_COMPLETION_REWARD_TYPE,
          modifierId: rewardPlan.modifier.id,
          modifierName: rewardPlan.modifier.name,
          reason: award.reason,
          baseXp: award.baseXp,
          bonusXp: award.bonusXp,
        },
      })),
    );
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/rewards");
  revalidatePath("/settings");
}

export async function redeemRewardTemplate({
  studentId,
  templateId,
}: {
  studentId: string;
  templateId: string;
}) {
  if (!studentId || !templateId) {
    throw new Error("studentId and templateId are required.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const today = toDateString(new Date());

  const result = await db.transaction((tx) =>
    redeemRewardTemplateInTransaction(tx, {
      organizationId,
      studentId,
      templateId,
      date: today,
    }),
  );

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/rewards");
  revalidatePath("/settings");

  return {
    redemptionId: result.redemption.id,
    status: result.redemption.status,
    changed: result.changed,
  };
}

export async function levelUpStudent(studentId: string) {
  if (!studentId) {
    throw new Error("studentId is required.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const progress = await db.transaction((tx) =>
    levelUpStudentInTransaction(tx, { organizationId, studentId }),
  );

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/rewards");

  return progress;
}

export async function unlockStudentPerk({
  studentId,
  perkKey,
}: {
  studentId: string;
  perkKey: string;
}) {
  if (!studentId || !perkKey) {
    throw new Error("studentId and perkKey are required.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const result = await db.transaction((tx) =>
    unlockPerkInTransaction(tx, { organizationId, studentId, perkKey }),
  );

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/rewards");

  return result;
}

export async function toggleStudentPerk({
  studentId,
  perkKey,
}: {
  studentId: string;
  perkKey: string;
}) {
  if (!studentId || !perkKey) {
    throw new Error("studentId and perkKey are required.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const result = await db.transaction((tx) =>
    togglePerkEquippedInTransaction(tx, { organizationId, studentId, perkKey }),
  );

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/rewards");

  return result;
}

export async function prestigeStudent(studentId: string) {
  if (!studentId) {
    throw new Error("studentId is required.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const progress = await db.transaction((tx) =>
    prestigeStudentInTransaction(tx, { organizationId, studentId }),
  );

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/rewards");

  return progress;
}

export async function fulfillRedemption(redemptionId: string) {
  if (!redemptionId) {
    throw new Error("redemptionId is required.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();

  const result = await db.transaction((tx) =>
    fulfillRewardRedemptionInTransaction(tx, {
      organizationId,
      redemptionId,
    }),
  );

  revalidatePath(`/students/${result.redemption.studentId}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/rewards");
  revalidatePath("/settings");

  return {
    redemptionId: result.redemption.id,
    status: result.redemption.status,
    changed: result.changed,
  };
}

export async function cancelRedemption(redemptionId: string) {
  if (!redemptionId) {
    throw new Error("redemptionId is required.");
  }

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const today = toDateString(new Date());

  const result = await db.transaction((tx) =>
    cancelRewardRedemptionInTransaction(tx, {
      organizationId,
      redemptionId,
      date: today,
    }),
  );

  revalidatePath(`/students/${result.redemption.studentId}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/rewards");
  revalidatePath("/settings");

  return {
    redemptionId: result.redemption.id,
    status: result.redemption.status,
    changed: result.changed,
  };
}
