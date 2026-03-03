import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { and, eq } from "drizzle-orm";
import type { getDb } from "../db/index";
import type * as schemaModule from "../db/schema";

const databaseUrl = process.env.DATABASE_URL;
const rollback = new Error("ROLLBACK_TEST_TX");
type DbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];
type DbSchema = typeof schemaModule;

function ensureAppEnvDefaults() {
  if (!process.env.BETTER_AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = "test_secret_for_rpg_tests_1234567890";
  }
  if (!process.env.BETTER_AUTH_BASE_URL) {
    process.env.BETTER_AUTH_BASE_URL = "http://localhost:3000";
  }
}

async function loadModules() {
  ensureAppEnvDefaults();

  const dbMod = (await import(
    "../db/index.ts"
  )) as typeof import("../db/index");
  const schema = (await import(
    "../db/schema.ts"
  )) as typeof import("../db/schema");
  const leveling = (await import(
    "../lib/rewards/leveling.ts"
  )) as typeof import("../lib/rewards/leveling");

  return { ...dbMod, schema, leveling };
}

function slug(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

async function seedStudent(tx: DbTransaction, schema: DbSchema, xp = 25000) {
  const organizationId = randomUUID();
  const studentId = randomUUID();

  await tx.insert(schema.organizations).values({
    id: organizationId,
    name: slug("Org"),
    slug: slug("org"),
  });

  await tx.insert(schema.students).values({
    id: studentId,
    organizationId,
    name: "Level Student",
    color: "blue",
  });

  if (xp > 0) {
    await tx.insert(schema.studentXpLedger).values({
      organizationId,
      studentId,
      eventType: "lesson_completion",
      points: xp,
      eventDate: "2026-05-01",
      metadata: { source: "leveling_test_seed" },
    });
  }

  return { organizationId, studentId };
}

test("leveling supports unlock/equip caps and prestige reset", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, leveling } = await loadModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const { organizationId, studentId } = await seedStudent(tx, schema);

        await leveling.levelUpStudentInTransaction(tx, {
          organizationId,
          studentId,
        });
        await leveling.levelUpStudentInTransaction(tx, {
          organizationId,
          studentId,
        });
        await leveling.levelUpStudentInTransaction(tx, {
          organizationId,
          studentId,
        });

        let progress = await tx.query.studentRpgProgress.findFirst({
          where: and(
            eq(schema.studentRpgProgress.organizationId, organizationId),
            eq(schema.studentRpgProgress.studentId, studentId),
          ),
        });
        assert.ok(progress);
        assert.equal(progress.level, 4);
        assert.equal(progress.perkPoints, 3);
        assert.equal(progress.perkSlots, 3);

        await leveling.unlockPerkInTransaction(tx, {
          organizationId,
          studentId,
          perkKey: "keen_focus",
        });
        await leveling.unlockPerkInTransaction(tx, {
          organizationId,
          studentId,
          perkKey: "steady_hands",
        });
        await leveling.unlockPerkInTransaction(tx, {
          organizationId,
          studentId,
          perkKey: "daily_ritual",
        });

        await leveling.togglePerkEquippedInTransaction(tx, {
          organizationId,
          studentId,
          perkKey: "keen_focus",
        });
        await leveling.togglePerkEquippedInTransaction(tx, {
          organizationId,
          studentId,
          perkKey: "steady_hands",
        });
        await leveling.togglePerkEquippedInTransaction(tx, {
          organizationId,
          studentId,
          perkKey: "daily_ritual",
        });

        await leveling.levelUpStudentInTransaction(tx, {
          organizationId,
          studentId,
        });
        await leveling.unlockPerkInTransaction(tx, {
          organizationId,
          studentId,
          perkKey: "comeback_drive",
        });

        await assert.rejects(() =>
          leveling.togglePerkEquippedInTransaction(tx, {
            organizationId,
            studentId,
            perkKey: "comeback_drive",
          }),
        );

        progress = await tx.query.studentRpgProgress.findFirst({
          where: and(
            eq(schema.studentRpgProgress.organizationId, organizationId),
            eq(schema.studentRpgProgress.studentId, studentId),
          ),
        });
        assert.ok(progress);

        for (let level = progress.level; level < 20; level++) {
          await leveling.levelUpStudentInTransaction(tx, {
            organizationId,
            studentId,
          });
        }

        progress = await tx.query.studentRpgProgress.findFirst({
          where: and(
            eq(schema.studentRpgProgress.organizationId, organizationId),
            eq(schema.studentRpgProgress.studentId, studentId),
          ),
        });
        assert.ok(progress);
        assert.equal(progress.level, 20);

        await leveling.prestigeStudentInTransaction(tx, {
          organizationId,
          studentId,
        });

        const postPrestige = await tx.query.studentRpgProgress.findFirst({
          where: and(
            eq(schema.studentRpgProgress.organizationId, organizationId),
            eq(schema.studentRpgProgress.studentId, studentId),
          ),
        });
        assert.ok(postPrestige);
        assert.equal(postPrestige.level, 1);
        assert.equal(postPrestige.prestigeCount, 1);
        assert.equal(postPrestige.perkSlots, 4);
        assert.equal(postPrestige.perkPoints, 0);

        const perkRows = await tx.query.studentPerks.findMany({
          where: and(
            eq(schema.studentPerks.organizationId, organizationId),
            eq(schema.studentPerks.studentId, studentId),
          ),
        });
        assert.equal(perkRows.length, 0);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});

test("level-up is blocked until XP threshold is reached", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, leveling } = await loadModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const { organizationId, studentId } = await seedStudent(tx, schema, 50);

        await assert.rejects(() =>
          leveling.levelUpStudentInTransaction(tx, {
            organizationId,
            studentId,
          }),
        );

        await tx.insert(schema.studentXpLedger).values({
          organizationId,
          studentId,
          eventType: "lesson_completion",
          points: 50,
          eventDate: "2026-05-02",
          metadata: { source: "leveling_threshold_topup" },
        });

        const updated = await leveling.levelUpStudentInTransaction(tx, {
          organizationId,
          studentId,
        });
        assert.equal(updated.level, 2);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});
