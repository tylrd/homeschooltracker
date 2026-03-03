import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { and, eq, sql } from "drizzle-orm";
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
  const redemptions = (await import(
    "../lib/rewards/redemptions.ts"
  )) as typeof import("../lib/rewards/redemptions");

  return { ...dbMod, schema, redemptions };
}

function slug(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

async function seedOrgStudent(tx: DbTransaction, schema: DbSchema, xp = 60) {
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
    name: "Student",
    color: "blue",
  });

  await tx.insert(schema.studentXpLedger).values({
    organizationId,
    studentId,
    eventType: "lesson_completion",
    points: xp,
    eventDate: "2026-04-01",
    metadata: { source: "seed" },
  });

  return { organizationId, studentId };
}

async function getBalance(
  tx: DbTransaction,
  schema: DbSchema,
  organizationId: string,
  studentId: string,
) {
  const [row] = await tx
    .select({
      balance:
        sql<number>`coalesce(sum(${schema.studentXpLedger.points}), 0)`.mapWith(
          Number,
        ),
    })
    .from(schema.studentXpLedger)
    .where(
      and(
        eq(schema.studentXpLedger.organizationId, organizationId),
        eq(schema.studentXpLedger.studentId, studentId),
      ),
    );

  return row?.balance ?? 0;
}

test("reward redemption succeeds, is idempotent, and writes one negative ledger row", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, redemptions } = await loadModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const { organizationId, studentId } = await seedOrgStudent(
          tx,
          schema,
          80,
        );

        const first = await redemptions.redeemRewardTemplateInTransaction(tx, {
          organizationId,
          studentId,
          templateId: "movie_night",
          date: "2026-04-02",
        });
        const second = await redemptions.redeemRewardTemplateInTransaction(tx, {
          organizationId,
          studentId,
          templateId: "movie_night",
          date: "2026-04-02",
        });

        assert.equal(first.changed, true);
        assert.equal(second.changed, false);
        assert.equal(first.redemption.status, "pending");
        assert.equal(second.redemption.id, first.redemption.id);

        const redemptionRows = await tx.query.studentRewardRedemptions.findMany(
          {
            where: and(
              eq(
                schema.studentRewardRedemptions.organizationId,
                organizationId,
              ),
              eq(schema.studentRewardRedemptions.studentId, studentId),
            ),
          },
        );
        assert.equal(redemptionRows.length, 1);

        const ledgerRows = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(schema.studentXpLedger.organizationId, organizationId),
            eq(schema.studentXpLedger.studentId, studentId),
            eq(schema.studentXpLedger.eventType, "reward_redemption"),
          ),
        });
        assert.equal(ledgerRows.length, 1);
        assert.equal(ledgerRows[0]?.points, -50);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});

test("reward redemption fails on insufficient balance and writes no rows", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, redemptions } = await loadModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const { organizationId, studentId } = await seedOrgStudent(
          tx,
          schema,
          20,
        );

        await assert.rejects(() =>
          redemptions.redeemRewardTemplateInTransaction(tx, {
            organizationId,
            studentId,
            templateId: "movie_night",
            date: "2026-04-02",
          }),
        );

        const redemptionRows = await tx.query.studentRewardRedemptions.findMany(
          {
            where: and(
              eq(
                schema.studentRewardRedemptions.organizationId,
                organizationId,
              ),
              eq(schema.studentRewardRedemptions.studentId, studentId),
            ),
          },
        );
        assert.equal(redemptionRows.length, 0);

        const deductionRows = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(schema.studentXpLedger.organizationId, organizationId),
            eq(schema.studentXpLedger.studentId, studentId),
            eq(schema.studentXpLedger.eventType, "reward_redemption"),
          ),
        });
        assert.equal(deductionRows.length, 0);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});

test("cancellation refunds XP exactly once and fulfillment never changes XP", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, redemptions } = await loadModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const pendingSeed = await seedOrgStudent(tx, schema, 80);
        const pending = await redemptions.redeemRewardTemplateInTransaction(
          tx,
          {
            organizationId: pendingSeed.organizationId,
            studentId: pendingSeed.studentId,
            templateId: "movie_night",
            date: "2026-04-02",
          },
        );

        const cancelled = await redemptions.cancelRewardRedemptionInTransaction(
          tx,
          {
            organizationId: pendingSeed.organizationId,
            redemptionId: pending.redemption.id,
            date: "2026-04-03",
          },
        );
        const cancelledAgain =
          await redemptions.cancelRewardRedemptionInTransaction(tx, {
            organizationId: pendingSeed.organizationId,
            redemptionId: pending.redemption.id,
            date: "2026-04-03",
          });

        assert.equal(cancelled.changed, true);
        assert.equal(cancelledAgain.changed, false);
        assert.equal(cancelled.redemption.status, "cancelled");
        assert.equal(
          await getBalance(
            tx,
            schema,
            pendingSeed.organizationId,
            pendingSeed.studentId,
          ),
          80,
        );

        const refundRows = await tx.query.studentXpLedger.findMany({
          where: and(
            eq(
              schema.studentXpLedger.organizationId,
              pendingSeed.organizationId,
            ),
            eq(schema.studentXpLedger.studentId, pendingSeed.studentId),
            eq(schema.studentXpLedger.eventType, "reward_refund"),
          ),
        });
        assert.equal(refundRows.length, 1);
        assert.equal(refundRows[0]?.points, 50);

        const fulfilledSeed = await seedOrgStudent(tx, schema, 80);
        const toFulfill = await redemptions.redeemRewardTemplateInTransaction(
          tx,
          {
            organizationId: fulfilledSeed.organizationId,
            studentId: fulfilledSeed.studentId,
            templateId: "movie_night",
            date: "2026-04-04",
          },
        );
        const preFulfillBalance = await getBalance(
          tx,
          schema,
          fulfilledSeed.organizationId,
          fulfilledSeed.studentId,
        );

        const fulfilled =
          await redemptions.fulfillRewardRedemptionInTransaction(tx, {
            organizationId: fulfilledSeed.organizationId,
            redemptionId: toFulfill.redemption.id,
          });
        const fulfilledAgain =
          await redemptions.fulfillRewardRedemptionInTransaction(tx, {
            organizationId: fulfilledSeed.organizationId,
            redemptionId: toFulfill.redemption.id,
          });

        assert.equal(fulfilled.changed, true);
        assert.equal(fulfilledAgain.changed, false);
        assert.equal(fulfilled.redemption.status, "fulfilled");

        const postFulfillBalance = await getBalance(
          tx,
          schema,
          fulfilledSeed.organizationId,
          fulfilledSeed.studentId,
        );
        assert.equal(preFulfillBalance, postFulfillBalance);

        await assert.rejects(() =>
          redemptions.cancelRewardRedemptionInTransaction(tx, {
            organizationId: fulfilledSeed.organizationId,
            redemptionId: toFulfill.redemption.id,
            date: "2026-04-05",
          }),
        );

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});

test("cross-tenant access is denied for redemption mutations", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, redemptions } = await loadModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const { organizationId, studentId } = await seedOrgStudent(
          tx,
          schema,
          80,
        );
        const otherOrgId = randomUUID();

        await tx.insert(schema.organizations).values({
          id: otherOrgId,
          name: slug("Other Org"),
          slug: slug("other-org"),
        });

        await assert.rejects(() =>
          redemptions.redeemRewardTemplateInTransaction(tx, {
            organizationId: otherOrgId,
            studentId,
            templateId: "movie_night",
            date: "2026-04-02",
          }),
        );

        const redeemed = await redemptions.redeemRewardTemplateInTransaction(
          tx,
          {
            organizationId,
            studentId,
            templateId: "movie_night",
            date: "2026-04-02",
          },
        );

        await assert.rejects(() =>
          redemptions.cancelRewardRedemptionInTransaction(tx, {
            organizationId: otherOrgId,
            redemptionId: redeemed.redemption.id,
            date: "2026-04-03",
          }),
        );

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});

test("balance remains source-of-truth sum across deductions and refunds", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { getDb, schema, redemptions } = await loadModules();
  const db = getDb();

  await assert.rejects(
    async () =>
      db.transaction(async (tx) => {
        const { organizationId, studentId } = await seedOrgStudent(
          tx,
          schema,
          0,
        );

        await tx.insert(schema.studentXpLedger).values([
          {
            organizationId,
            studentId,
            eventType: "lesson_completion",
            points: 10,
            eventDate: "2026-04-01",
          },
          {
            organizationId,
            studentId,
            eventType: "lesson_completion_reversal",
            points: -10,
            eventDate: "2026-04-01",
          },
          {
            organizationId,
            studentId,
            eventType: "shared_lesson_completion",
            points: 10,
            eventDate: "2026-04-02",
          },
          {
            organizationId,
            studentId,
            eventType: "shared_lesson_completion",
            points: 50,
            eventDate: "2026-04-02",
          },
        ]);

        const redemption = await redemptions.redeemRewardTemplateInTransaction(
          tx,
          {
            organizationId,
            studentId,
            templateId: "movie_night",
            date: "2026-04-03",
          },
        );

        await redemptions.cancelRewardRedemptionInTransaction(tx, {
          organizationId,
          redemptionId: redemption.redemption.id,
          date: "2026-04-04",
        });

        const balance = await getBalance(tx, schema, organizationId, studentId);
        assert.equal(balance, 60);

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );
});
