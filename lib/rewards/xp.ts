import { and, eq } from "drizzle-orm";
import type { getDb } from "../../db";
import {
  studentBadges,
  studentStreaks,
  studentXpLedger,
} from "../../db/schema";
import { parseDate, toDateString } from "../dates";

export const LESSON_COMPLETION_XP = 10;
export const DAILY_STREAK_BONUS_XP = 5;
export const STREAK_MILESTONES = [3, 7, 14, 30];

export type XpDbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

type BaseRewardArgs = {
  organizationId: string;
  studentId: string;
  date: string;
};

type PersonalRewardArgs = BaseRewardArgs & {
  lessonId: string;
};

type SharedRewardArgs = BaseRewardArgs & {
  sharedLessonId: string;
};

function previousDate(date: string): string {
  const parsed = parseDate(date);
  parsed.setDate(parsed.getDate() - 1);
  return toDateString(parsed);
}

export async function applyStreakForRewardDay(
  tx: XpDbTransaction,
  { organizationId, studentId, date }: BaseRewardArgs,
) {
  const streak = await tx.query.studentStreaks.findFirst({
    where: and(
      eq(studentStreaks.organizationId, organizationId),
      eq(studentStreaks.studentId, studentId),
    ),
    columns: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      lastRewardDate: true,
    },
  });

  if (!streak) {
    await tx.insert(studentStreaks).values({
      organizationId,
      studentId,
      currentStreak: 1,
      longestStreak: 1,
      lastRewardDate: date,
    });
    return;
  }

  if (streak.lastRewardDate === date) {
    return;
  }

  const continuesStreak = streak.lastRewardDate === previousDate(date);
  const nextCurrent = continuesStreak ? streak.currentStreak + 1 : 1;
  const nextLongest = Math.max(streak.longestStreak, nextCurrent);

  await tx
    .update(studentStreaks)
    .set({
      currentStreak: nextCurrent,
      longestStreak: nextLongest,
      lastRewardDate: date,
    })
    .where(
      and(
        eq(studentStreaks.id, streak.id),
        eq(studentStreaks.organizationId, organizationId),
      ),
    );

  if (continuesStreak) {
    await tx.insert(studentXpLedger).values({
      organizationId,
      studentId,
      eventType: "streak_bonus",
      points: DAILY_STREAK_BONUS_XP,
      eventDate: date,
      metadata: { streakLength: nextCurrent, source: "daily_streak" },
    });
  }

  if (STREAK_MILESTONES.includes(nextCurrent)) {
    await tx
      .insert(studentBadges)
      .values({
        organizationId,
        studentId,
        badgeKey: `streak_${nextCurrent}`,
        milestoneDays: nextCurrent,
        earnedDate: date,
      })
      .onConflictDoNothing({
        target: [
          studentBadges.organizationId,
          studentBadges.studentId,
          studentBadges.badgeKey,
        ],
      });
  }
}

export async function awardPersonalLessonCompletion(
  tx: XpDbTransaction,
  { organizationId, lessonId, studentId, date }: PersonalRewardArgs,
) {
  await tx.insert(studentXpLedger).values({
    organizationId,
    studentId,
    eventType: "lesson_completion",
    points: LESSON_COMPLETION_XP,
    eventDate: date,
    lessonId,
  });

  await applyStreakForRewardDay(tx, { organizationId, studentId, date });
}

export async function awardSharedLessonCompletion(
  tx: XpDbTransaction,
  { organizationId, sharedLessonId, studentId, date }: SharedRewardArgs,
) {
  await tx.insert(studentXpLedger).values({
    organizationId,
    studentId,
    eventType: "shared_lesson_completion",
    points: LESSON_COMPLETION_XP,
    eventDate: date,
    sharedLessonId,
  });

  await applyStreakForRewardDay(tx, { organizationId, studentId, date });
}

export async function reversePersonalLessonCompletion(
  tx: XpDbTransaction,
  { organizationId, lessonId, studentId, date }: PersonalRewardArgs,
) {
  await tx.insert(studentXpLedger).values({
    organizationId,
    studentId,
    eventType: "lesson_completion_reversal",
    points: -LESSON_COMPLETION_XP,
    eventDate: date,
    lessonId,
  });
}

export async function reverseSharedLessonCompletion(
  tx: XpDbTransaction,
  { organizationId, sharedLessonId, studentId, date }: SharedRewardArgs,
) {
  await tx.insert(studentXpLedger).values({
    organizationId,
    studentId,
    eventType: "shared_lesson_completion_reversal",
    points: -LESSON_COMPLETION_XP,
    eventDate: date,
    sharedLessonId,
  });
}
