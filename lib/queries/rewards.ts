import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dailyRewards,
  lessons,
  resources,
  sharedCurriculumStudents,
  sharedLessons,
  studentPerks,
  studentRewardRedemptions,
  studentRpgProgress,
  studentStreaks,
  students,
  studentXpLedger,
  subjects,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import { toDateString } from "@/lib/dates";
import {
  calculateDailyRewardAwards,
  getDailyRewardModifier,
} from "@/lib/rewards/daily-modifiers";
import {
  BASE_PERK_SLOTS,
  MAX_STUDENT_LEVEL,
  PERK_LIBRARY,
  type PerkRarity,
} from "@/lib/rewards/perks";

const DAILY_COMPLETION_REWARD_TYPE = "all_lessons_completed";

type StudentProgress = {
  studentId: string;
  studentName: string;
  totalLessons: number;
  completedLessons: number;
};

export type DailyCompletionRewardStatus = {
  date: string;
  totalStudents: number;
  studentsWithLessons: number;
  completedStudents: number;
  totalLessons: number;
  completedLessons: number;
  isEligible: boolean;
  isTracked: boolean;
  trackedAt: Date | null;
  points: number;
  projectedPoints: number;
  modifierId: string;
  modifierName: string;
  modifierDescription: string;
  students: StudentProgress[];
};

export async function getStudentXpBalance(studentId: string): Promise<number> {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const student = await db.query.students.findFirst({
    where: and(
      eq(students.organizationId, organizationId),
      eq(students.id, studentId),
    ),
    columns: { id: true },
  });
  if (!student) {
    throw new Error("Student not found.");
  }

  const [row] = await db
    .select({
      balance: sql<number>`coalesce(sum(${studentXpLedger.points}), 0)`.mapWith(
        Number,
      ),
    })
    .from(studentXpLedger)
    .where(
      and(
        eq(studentXpLedger.organizationId, organizationId),
        eq(studentXpLedger.studentId, studentId),
      ),
    );

  return row?.balance ?? 0;
}

export async function getStudentRedemptions(studentId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const student = await db.query.students.findFirst({
    where: and(
      eq(students.organizationId, organizationId),
      eq(students.id, studentId),
    ),
    columns: { id: true },
  });
  if (!student) {
    throw new Error("Student not found.");
  }

  return db.query.studentRewardRedemptions.findMany({
    where: and(
      eq(studentRewardRedemptions.organizationId, organizationId),
      eq(studentRewardRedemptions.studentId, studentId),
    ),
    orderBy: (table, { desc }) => [desc(table.requestedAt)],
  });
}

export type StudentLevelingState = {
  level: number;
  maxLevel: number;
  prestigeCount: number;
  perkSlots: number;
  perkPoints: number;
  ownedPerkKeys: string[];
  equippedPerkKeys: string[];
  perks: {
    key: string;
    name: string;
    description: string;
    rarity: PerkRarity;
    unlockLevel: number;
    owned: boolean;
    equipped: boolean;
  }[];
};

export async function getStudentLevelingState(
  studentId: string,
): Promise<StudentLevelingState> {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const student = await db.query.students.findFirst({
    where: and(
      eq(students.organizationId, organizationId),
      eq(students.id, studentId),
    ),
    columns: { id: true },
  });
  if (!student) {
    throw new Error("Student not found.");
  }

  const [progress, perkRows] = await Promise.all([
    db.query.studentRpgProgress.findFirst({
      where: and(
        eq(studentRpgProgress.organizationId, organizationId),
        eq(studentRpgProgress.studentId, studentId),
      ),
    }),
    db.query.studentPerks.findMany({
      where: and(
        eq(studentPerks.organizationId, organizationId),
        eq(studentPerks.studentId, studentId),
      ),
      columns: {
        perkKey: true,
        isEquipped: true,
      },
    }),
  ]);

  const ownedPerkKeys = perkRows.map((perk) => perk.perkKey);
  const ownedSet = new Set(ownedPerkKeys);
  const equippedPerkKeys = perkRows
    .filter((perk) => perk.isEquipped)
    .map((perk) => perk.perkKey);
  const equippedSet = new Set(equippedPerkKeys);

  return {
    level: progress?.level ?? 1,
    maxLevel: MAX_STUDENT_LEVEL,
    prestigeCount: progress?.prestigeCount ?? 0,
    perkSlots: progress?.perkSlots ?? BASE_PERK_SLOTS,
    perkPoints: progress?.perkPoints ?? 0,
    ownedPerkKeys,
    equippedPerkKeys,
    perks: PERK_LIBRARY.map((perk) => ({
      ...perk,
      owned: ownedSet.has(perk.key),
      equipped: equippedSet.has(perk.key),
    })),
  };
}

export type WeeklyXpSummary = {
  fromDate: string;
  toDate: string;
  totalEarned: number;
  totalSpent: number;
  daily: {
    date: string;
    earned: number;
    spent: number;
    net: number;
  }[];
  streakDistribution: {
    bucket: string;
    count: number;
  }[];
};

export async function getWeeklyXpSummary(): Promise<WeeklyXpSummary> {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const toDate = toDateString(new Date());
  const from = new Date(`${toDate}T00:00:00`);
  from.setDate(from.getDate() - 6);
  const fromDate = toDateString(from);

  const [weeklyRows, streakRows] = await Promise.all([
    db
      .select({
        date: studentXpLedger.eventDate,
        earned:
          sql<number>`coalesce(sum(case when ${studentXpLedger.points} > 0 then ${studentXpLedger.points} else 0 end), 0)`.mapWith(
            Number,
          ),
        spent:
          sql<number>`coalesce(sum(case when ${studentXpLedger.points} < 0 then -${studentXpLedger.points} else 0 end), 0)`.mapWith(
            Number,
          ),
      })
      .from(studentXpLedger)
      .where(
        and(
          eq(studentXpLedger.organizationId, organizationId),
          gte(studentXpLedger.eventDate, fromDate),
        ),
      )
      .groupBy(studentXpLedger.eventDate)
      .orderBy(asc(studentXpLedger.eventDate)),
    db.query.studentStreaks.findMany({
      where: eq(studentStreaks.organizationId, organizationId),
      columns: { currentStreak: true },
    }),
  ]);

  const byDay = new Map<
    string,
    {
      earned: number;
      spent: number;
    }
  >();
  for (const row of weeklyRows) {
    byDay.set(row.date, {
      earned: row.earned,
      spent: row.spent,
    });
  }

  const daily: WeeklyXpSummary["daily"] = [];
  const cursor = new Date(`${fromDate}T00:00:00`);
  for (let i = 0; i < 7; i++) {
    const date = toDateString(cursor);
    const values = byDay.get(date) ?? { earned: 0, spent: 0 };
    daily.push({
      date,
      earned: values.earned,
      spent: values.spent,
      net: values.earned - values.spent,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const buckets = {
    "0": 0,
    "1-2": 0,
    "3-6": 0,
    "7-13": 0,
    "14-29": 0,
    "30+": 0,
  };
  for (const row of streakRows) {
    const streak = row.currentStreak;
    if (streak <= 0) {
      buckets["0"] += 1;
    } else if (streak <= 2) {
      buckets["1-2"] += 1;
    } else if (streak <= 6) {
      buckets["3-6"] += 1;
    } else if (streak <= 13) {
      buckets["7-13"] += 1;
    } else if (streak <= 29) {
      buckets["14-29"] += 1;
    } else {
      buckets["30+"] += 1;
    }
  }

  return {
    fromDate,
    toDate,
    totalEarned: daily.reduce((sum, row) => sum + row.earned, 0),
    totalSpent: daily.reduce((sum, row) => sum + row.spent, 0),
    daily,
    streakDistribution: [
      { bucket: "0", count: buckets["0"] },
      { bucket: "1-2", count: buckets["1-2"] },
      { bucket: "3-6", count: buckets["3-6"] },
      { bucket: "7-13", count: buckets["7-13"] },
      { bucket: "14-29", count: buckets["14-29"] },
      { bucket: "30+", count: buckets["30+"] },
    ],
  };
}

export async function getDailyCompletionRewardStatus(
  date: string,
): Promise<DailyCompletionRewardStatus> {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const [studentRows, personalRows, sharedRows, rewardRow] = await Promise.all([
    db
      .select({
        studentId: students.id,
        studentName: students.name,
      })
      .from(students)
      .where(eq(students.organizationId, organizationId)),
    db
      .select({
        studentId: students.id,
        lessonStatus: lessons.status,
      })
      .from(lessons)
      .innerJoin(resources, eq(lessons.resourceId, resources.id))
      .innerJoin(subjects, eq(resources.subjectId, subjects.id))
      .innerJoin(students, eq(subjects.studentId, students.id))
      .where(
        and(
          eq(lessons.organizationId, organizationId),
          eq(lessons.scheduledDate, date),
        ),
      ),
    db
      .select({
        studentId: students.id,
        lessonStatus: sharedLessons.status,
      })
      .from(sharedLessons)
      .innerJoin(
        sharedCurriculumStudents,
        eq(
          sharedCurriculumStudents.sharedCurriculumId,
          sharedLessons.sharedCurriculumId,
        ),
      )
      .innerJoin(students, eq(sharedCurriculumStudents.studentId, students.id))
      .where(
        and(
          eq(sharedLessons.organizationId, organizationId),
          eq(sharedCurriculumStudents.organizationId, organizationId),
          eq(sharedLessons.scheduledDate, date),
        ),
      ),
    db.query.dailyRewards.findFirst({
      where: and(
        eq(dailyRewards.organizationId, organizationId),
        eq(dailyRewards.rewardDate, date),
        eq(dailyRewards.rewardType, DAILY_COMPLETION_REWARD_TYPE),
      ),
    }),
  ]);

  const progressMap = new Map<string, StudentProgress>();

  for (const student of studentRows) {
    progressMap.set(student.studentId, {
      studentId: student.studentId,
      studentName: student.studentName,
      totalLessons: 0,
      completedLessons: 0,
    });
  }

  const allRows = [...personalRows, ...sharedRows];
  for (const row of allRows) {
    const entry = progressMap.get(row.studentId);
    if (!entry) continue;
    entry.totalLessons += 1;
    if (row.lessonStatus === "completed") {
      entry.completedLessons += 1;
    }
  }

  const studentsProgress = Array.from(progressMap.values());
  const studentsWithLessonsRows = studentsProgress.filter(
    (student) => student.totalLessons > 0,
  );

  const totalLessons = allRows.length;
  const completedLessons = allRows.filter(
    (row) => row.lessonStatus === "completed",
  ).length;
  const studentsWithLessons = studentsWithLessonsRows.length;
  const completedStudents = studentsWithLessonsRows.filter(
    (student) => student.totalLessons === student.completedLessons,
  ).length;

  const isEligible =
    totalLessons > 0 &&
    studentsWithLessons > 0 &&
    completedStudents === studentsWithLessons;

  const qualifyingStudents = studentsProgress.filter(
    (student) =>
      student.totalLessons > 0 &&
      student.totalLessons === student.completedLessons,
  );
  const qualifyingIds = qualifyingStudents.map((student) => student.studentId);

  const selectedModifier = getDailyRewardModifier({ organizationId, date });
  let projectedPoints = 1;

  if (qualifyingIds.length > 0) {
    const [xpRows, streakRows] = await Promise.all([
      db
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
      db.query.studentStreaks.findMany({
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

    const awardPlan = calculateDailyRewardAwards({
      organizationId,
      date,
      students: qualifyingStudents.map((student) => ({
        studentId: student.studentId,
        totalLessons: student.totalLessons,
        xpBalance: xpByStudent.get(student.studentId) ?? 0,
        currentStreak: streakByStudent.get(student.studentId) ?? 0,
      })),
    });
    projectedPoints = awardPlan.totalAwardedXp;
  }

  return {
    date,
    totalStudents: studentRows.length,
    studentsWithLessons,
    completedStudents,
    totalLessons,
    completedLessons,
    isEligible,
    isTracked: Boolean(rewardRow),
    trackedAt: rewardRow?.createdAt ?? null,
    points: rewardRow?.points ?? projectedPoints,
    projectedPoints,
    modifierId: selectedModifier.id,
    modifierName: selectedModifier.name,
    modifierDescription: selectedModifier.description,
    students: studentsProgress,
  };
}
