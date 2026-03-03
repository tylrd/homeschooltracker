import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { and, eq, ne } from "drizzle-orm";
import { normalizeRewardTemplates } from "../lib/rewards/templates.ts";

const databaseUrl = process.env.DATABASE_URL;
const rollback = new Error("ROLLBACK_TEST_TX");

function ensureAppEnvDefaults() {
  if (!process.env.BETTER_AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = "test_secret_for_rpg_tests_1234567890";
  }
  if (!process.env.BETTER_AUTH_BASE_URL) {
    process.env.BETTER_AUTH_BASE_URL = "http://localhost:3000";
  }
}

async function loadRpgModules() {
  ensureAppEnvDefaults();

  const dbMod = (await import(
    "../db/index.ts"
  )) as typeof import("../db/index");
  const schema = (await import(
    "../db/schema.ts"
  )) as typeof import("../db/schema");
  const xp = (await import(
    "../lib/rewards/xp.ts"
  )) as typeof import("../lib/rewards/xp");

  return { ...dbMod, schema, xp };
}

function slug(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

test("reward template normalization drops invalid rows and falls back to defaults", () => {
  const normalized = normalizeRewardTemplates([
    { name: "Movie night", xpCost: 50 },
    { name: "", xpCost: 20 },
    { name: "Broken", xpCost: 0 },
    { name: "Extra screen time", xpCost: "30", description: "30 min" },
  ]);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0]?.name, "Movie night");
  assert.equal(normalized[0]?.xpCost, 50);
  assert.equal(normalized[1]?.name, "Extra screen time");
  assert.equal(normalized[1]?.xpCost, 30);

  const fallback = normalizeRewardTemplates("not-an-array");
  assert.equal(fallback.length, 2);
  assert.equal(fallback[0]?.name, "Movie night");
  assert.equal(fallback[1]?.name, "Extra screen time");
});

test("personal lesson awards XP, applies streak bonus, and awards milestone badge once", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, xp } = await loadRpgModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const organizationId = randomUUID();
        const studentId = randomUUID();
        const subjectId = randomUUID();
        const resourceId = randomUUID();
        const lesson1Id = randomUUID();
        const lesson2Id = randomUUID();
        const lesson3Id = randomUUID();

        await tx.insert(schema.organizations).values({
          id: organizationId,
          name: slug("Org"),
          slug: slug("org"),
        });

        await tx.insert(schema.students).values({
          id: studentId,
          organizationId,
          name: "Student",
          color: "blue",
        });

        await tx.insert(schema.subjects).values({
          id: subjectId,
          organizationId,
          name: "Math",
          studentId,
        });

        await tx.insert(schema.resources).values({
          id: resourceId,
          organizationId,
          subjectId,
          name: "Workbook",
        });

        await tx.insert(schema.lessons).values([
          {
            id: lesson1Id,
            organizationId,
            resourceId,
            lessonNumber: 1,
            status: "planned",
            scheduledDate: "2026-01-01",
          },
          {
            id: lesson2Id,
            organizationId,
            resourceId,
            lessonNumber: 2,
            status: "planned",
            scheduledDate: "2026-01-02",
          },
          {
            id: lesson3Id,
            organizationId,
            resourceId,
            lessonNumber: 3,
            status: "planned",
            scheduledDate: "2026-01-03",
          },
        ]);

        await xp.awardPersonalLessonCompletion(tx, {
          organizationId,
          lessonId: lesson1Id,
          studentId,
          date: "2026-01-01",
        });

        await xp.awardPersonalLessonCompletion(tx, {
          organizationId,
          lessonId: lesson2Id,
          studentId,
          date: "2026-01-02",
        });

        await xp.awardPersonalLessonCompletion(tx, {
          organizationId,
          lessonId: lesson3Id,
          studentId,
          date: "2026-01-03",
        });

        // Same day extra completion should not duplicate streak bonus or badge.
        await xp.awardPersonalLessonCompletion(tx, {
          organizationId,
          lessonId: lesson3Id,
          studentId,
          date: "2026-01-03",
        });

        const ledgerRows = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(schema.studentXpLedger.organizationId, organizationId),
            eq(schema.studentXpLedger.studentId, studentId),
          ),
        });

        const bonusRows = ledgerRows.filter(
          (row) => row.eventType === "streak_bonus",
        );
        const completionRows = ledgerRows.filter(
          (row) => row.eventType === "lesson_completion",
        );

        assert.equal(completionRows.length, 4);
        assert.equal(bonusRows.length, 2);

        const streak = await tx.query.studentStreaks.findFirst({
          where: and(
            eq(schema.studentStreaks.organizationId, organizationId),
            eq(schema.studentStreaks.studentId, studentId),
          ),
        });

        assert.ok(streak);
        assert.equal(streak.currentStreak, 3);
        assert.equal(streak.longestStreak, 3);
        assert.equal(streak.lastRewardDate, "2026-01-03");

        const badges = await tx.query.studentBadges.findMany({
          where: and(
            eq(schema.studentBadges.organizationId, organizationId),
            eq(schema.studentBadges.studentId, studentId),
            eq(schema.studentBadges.badgeKey, "streak_3"),
          ),
        });

        assert.equal(badges.length, 1);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});

test("shared lesson awards per student and reversal adds negative entries", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, xp } = await loadRpgModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const organizationId = randomUUID();
        const studentAId = randomUUID();
        const studentBId = randomUUID();
        const sharedCurriculumId = randomUUID();
        const sharedLessonId = randomUUID();

        await tx.insert(schema.organizations).values({
          id: organizationId,
          name: slug("Org"),
          slug: slug("org"),
        });

        await tx.insert(schema.students).values([
          {
            id: studentAId,
            organizationId,
            name: "A",
            color: "blue",
          },
          {
            id: studentBId,
            organizationId,
            name: "B",
            color: "green",
          },
        ]);

        await tx.insert(schema.sharedCurricula).values({
          id: sharedCurriculumId,
          organizationId,
          name: "Shared Reading",
        });

        await tx.insert(schema.sharedCurriculumStudents).values([
          {
            organizationId,
            sharedCurriculumId,
            studentId: studentAId,
          },
          {
            organizationId,
            sharedCurriculumId,
            studentId: studentBId,
          },
        ]);

        await tx.insert(schema.sharedLessons).values({
          id: sharedLessonId,
          organizationId,
          sharedCurriculumId,
          lessonNumber: 1,
          status: "planned",
          scheduledDate: "2026-02-01",
        });

        await xp.awardSharedLessonCompletion(tx, {
          organizationId,
          sharedLessonId,
          studentId: studentAId,
          date: "2026-02-01",
        });
        await xp.awardSharedLessonCompletion(tx, {
          organizationId,
          sharedLessonId,
          studentId: studentBId,
          date: "2026-02-01",
        });

        await xp.reverseSharedLessonCompletion(tx, {
          organizationId,
          sharedLessonId,
          studentId: studentAId,
          date: "2026-02-02",
        });
        await xp.reverseSharedLessonCompletion(tx, {
          organizationId,
          sharedLessonId,
          studentId: studentBId,
          date: "2026-02-02",
        });

        const rows = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(schema.studentXpLedger.organizationId, organizationId),
            eq(schema.studentXpLedger.sharedLessonId, sharedLessonId),
          ),
        });

        const awards = rows.filter(
          (row) =>
            row.eventType === "shared_lesson_completion" && row.points === 10,
        );
        const reversals = rows.filter(
          (row) =>
            row.eventType === "shared_lesson_completion_reversal" &&
            row.points === -10,
        );

        assert.equal(awards.length, 2);
        assert.equal(reversals.length, 2);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});

test("guarded completion transition prevents duplicate XP and only gives one same-day streak bonus", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, xp } = await loadRpgModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const organizationId = randomUUID();
        const studentId = randomUUID();
        const subjectId = randomUUID();
        const resourceId = randomUUID();
        const lessonA = randomUUID();
        const lessonB = randomUUID();
        const lessonC = randomUUID();

        await tx.insert(schema.organizations).values({
          id: organizationId,
          name: slug("Org"),
          slug: slug("org"),
        });

        await tx.insert(schema.students).values({
          id: studentId,
          organizationId,
          name: "Student",
          color: "blue",
        });

        await tx.insert(schema.subjects).values({
          id: subjectId,
          organizationId,
          name: "Science",
          studentId,
        });

        await tx.insert(schema.resources).values({
          id: resourceId,
          organizationId,
          subjectId,
          name: "Science Book",
        });

        await tx.insert(schema.lessons).values([
          {
            id: lessonA,
            organizationId,
            resourceId,
            lessonNumber: 1,
            status: "planned",
            scheduledDate: "2026-03-01",
          },
          {
            id: lessonB,
            organizationId,
            resourceId,
            lessonNumber: 2,
            status: "planned",
            scheduledDate: "2026-03-02",
          },
          {
            id: lessonC,
            organizationId,
            resourceId,
            lessonNumber: 3,
            status: "planned",
            scheduledDate: "2026-03-02",
          },
        ]);

        async function completeWithGuard(lessonId: string, date: string) {
          const [updated] = await tx
            .update(schema.lessons)
            .set({ status: "completed", completionDate: date })
            .where(
              and(
                eq(schema.lessons.organizationId, organizationId),
                eq(schema.lessons.id, lessonId),
                ne(schema.lessons.status, "completed"),
              ),
            )
            .returning({ id: schema.lessons.id });

          if (!updated) {
            return false;
          }

          await xp.awardPersonalLessonCompletion(tx, {
            organizationId,
            lessonId,
            studentId,
            date,
          });
          return true;
        }

        const first = await completeWithGuard(lessonA, "2026-03-01");
        const second = await completeWithGuard(lessonB, "2026-03-02");
        const third = await completeWithGuard(lessonC, "2026-03-02");
        const duplicate = await completeWithGuard(lessonB, "2026-03-02");

        await xp.reversePersonalLessonCompletion(tx, {
          organizationId,
          lessonId: lessonB,
          studentId,
          date: "2026-03-03",
        });

        assert.equal(first, true);
        assert.equal(second, true);
        assert.equal(third, true);
        assert.equal(duplicate, false);

        const lessonBRows = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(schema.studentXpLedger.organizationId, organizationId),
            eq(schema.studentXpLedger.lessonId, lessonB),
            eq(schema.studentXpLedger.eventType, "lesson_completion"),
          ),
        });
        assert.equal(lessonBRows.length, 1);

        const dayTwoBonuses = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(schema.studentXpLedger.organizationId, organizationId),
            eq(schema.studentXpLedger.studentId, studentId),
            eq(schema.studentXpLedger.eventType, "streak_bonus"),
            eq(schema.studentXpLedger.eventDate, "2026-03-02"),
          ),
        });
        assert.equal(dayTwoBonuses.length, 1);

        const reversalRows = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(schema.studentXpLedger.organizationId, organizationId),
            eq(schema.studentXpLedger.lessonId, lessonB),
            eq(schema.studentXpLedger.eventType, "lesson_completion_reversal"),
            eq(schema.studentXpLedger.points, -10),
          ),
        });
        assert.equal(reversalRows.length, 1);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});
