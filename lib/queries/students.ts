import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  studentBadges,
  studentRpgProgress,
  studentStreaks,
  students,
  studentXpLedger,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import { BASE_PERK_SLOTS } from "@/lib/rewards/perks";

type StudentRpgSummary = {
  xpBalance: number;
  currentStreak: number;
  newestBadgeKey: string | null;
  level: number;
  prestigeCount: number;
  perkSlots: number;
  perkPoints: number;
};

async function getStudentRpgSummaryMap(
  organizationId: string,
  studentIds: string[],
) {
  const db = getDb();
  const ids = Array.from(new Set(studentIds.filter(Boolean)));
  const summaryMap = new Map<string, StudentRpgSummary>();

  for (const id of ids) {
    summaryMap.set(id, {
      xpBalance: 0,
      currentStreak: 0,
      newestBadgeKey: null,
      level: 1,
      prestigeCount: 0,
      perkSlots: BASE_PERK_SLOTS,
      perkPoints: 0,
    });
  }
  if (ids.length === 0) {
    return summaryMap;
  }

  const [xpRows, streakRows, badgeRows, progressRows] = await Promise.all([
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
          inArray(studentXpLedger.studentId, ids),
        ),
      )
      .groupBy(studentXpLedger.studentId),
    db.query.studentStreaks.findMany({
      where: and(
        eq(studentStreaks.organizationId, organizationId),
        inArray(studentStreaks.studentId, ids),
      ),
      columns: {
        studentId: true,
        currentStreak: true,
      },
    }),
    db.query.studentBadges.findMany({
      where: and(
        eq(studentBadges.organizationId, organizationId),
        inArray(studentBadges.studentId, ids),
      ),
      columns: {
        studentId: true,
        badgeKey: true,
      },
      orderBy: (table) => [desc(table.earnedDate), desc(table.createdAt)],
    }),
    db.query.studentRpgProgress.findMany({
      where: and(
        eq(studentRpgProgress.organizationId, organizationId),
        inArray(studentRpgProgress.studentId, ids),
      ),
      columns: {
        studentId: true,
        level: true,
        prestigeCount: true,
        perkSlots: true,
        perkPoints: true,
      },
    }),
  ]);

  for (const row of xpRows) {
    const existing = summaryMap.get(row.studentId);
    if (!existing) continue;
    existing.xpBalance = row.xpBalance;
  }

  for (const row of streakRows) {
    const existing = summaryMap.get(row.studentId);
    if (!existing) continue;
    existing.currentStreak = row.currentStreak;
  }

  const seenBadgeStudentIds = new Set<string>();
  for (const row of badgeRows) {
    if (seenBadgeStudentIds.has(row.studentId)) continue;
    const existing = summaryMap.get(row.studentId);
    if (!existing) continue;
    existing.newestBadgeKey = row.badgeKey;
    seenBadgeStudentIds.add(row.studentId);
  }

  for (const row of progressRows) {
    const existing = summaryMap.get(row.studentId);
    if (!existing) continue;
    existing.level = row.level;
    existing.prestigeCount = row.prestigeCount;
    existing.perkSlots = row.perkSlots;
    existing.perkPoints = row.perkPoints;
  }

  return summaryMap;
}

export async function getStudents() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const rows = await db.query.students.findMany({
    where: eq(students.organizationId, organizationId),
    orderBy: (students, { asc }) => [asc(students.name)],
  });

  const summaryMap = await getStudentRpgSummaryMap(
    organizationId,
    rows.map((row) => row.id),
  );

  return rows.map((row) => {
    const summary = summaryMap.get(row.id);
    return {
      ...row,
      xpBalance: summary?.xpBalance ?? 0,
      currentStreak: summary?.currentStreak ?? 0,
      newestBadgeKey: summary?.newestBadgeKey ?? null,
      level: summary?.level ?? 1,
      prestigeCount: summary?.prestigeCount ?? 0,
      perkSlots: summary?.perkSlots ?? BASE_PERK_SLOTS,
      perkPoints: summary?.perkPoints ?? 0,
    };
  });
}

export async function getStudentById(id: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findFirst({
    where: and(
      eq(students.id, id),
      eq(students.organizationId, organizationId),
    ),
  });
}

export async function getStudentWithSubjectsAndResources(id: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findFirst({
    where: and(
      eq(students.id, id),
      eq(students.organizationId, organizationId),
    ),
    with: {
      subjects: {
        with: {
          resources: true,
        },
        orderBy: (subjects, { asc }) => [asc(subjects.name)],
      },
    },
  });
}

export async function getStudentRpgSummary(
  studentId: string,
): Promise<StudentRpgSummary> {
  const { organizationId } = await getTenantContext();
  const map = await getStudentRpgSummaryMap(organizationId, [studentId]);
  return (
    map.get(studentId) ?? {
      xpBalance: 0,
      currentStreak: 0,
      newestBadgeKey: null,
      level: 1,
      prestigeCount: 0,
      perkSlots: BASE_PERK_SLOTS,
      perkPoints: 0,
    }
  );
}

export async function getStudentsWithSubjectsForCurriculumAdd() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db.query.students.findMany({
    where: eq(students.organizationId, organizationId),
    columns: {
      id: true,
      name: true,
      color: true,
    },
    with: {
      subjects: {
        columns: {
          id: true,
          name: true,
        },
        orderBy: (subjects, { asc }) => [asc(subjects.name)],
      },
    },
    orderBy: (students, { asc }) => [asc(students.name)],
  });
}
