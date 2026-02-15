import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("tenant columns are non-null for core tables", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const checks = await sql<
    { table_name: string; null_count: string }[]
  >`select 'students'::text as table_name, count(*)::text as null_count from students where organization_id is null
     union all
     select 'resources'::text, count(*)::text from resources where organization_id is null
     union all
     select 'lessons'::text, count(*)::text from lessons where organization_id is null
     union all
     select 'app_settings'::text, count(*)::text from app_settings where organization_id is null`;

  for (const row of checks) {
    assert.equal(
      Number(row.null_count),
      0,
      `${row.table_name} has rows without organization_id`,
    );
  }
  await sql.end();
});

test("app_settings unique index is tenant-scoped", async (t) => {
  if (!databaseUrl) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const rollback = new Error("ROLLBACK_TEST_TX");

  await assert.rejects(
    async () =>
      sql.begin(async (tx) => {
        const orgA = randomUUID();
        const orgB = randomUUID();
        await tx.unsafe(
          `insert into "organization" (id, name, slug) values ('${orgA}'::uuid, 'Org A', 'org-a-${orgA.slice(0, 8)}')`,
        );
        await tx.unsafe(
          `insert into "organization" (id, name, slug) values ('${orgB}'::uuid, 'Org B', 'org-b-${orgB.slice(0, 8)}')`,
        );

        await tx.unsafe(
          `insert into app_settings (organization_id, key, value) values ('${orgA}'::uuid, 'schoolDays', '[1,2,3,4,5]')`,
        );
        await tx.unsafe(
          `insert into app_settings (organization_id, key, value) values ('${orgB}'::uuid, 'schoolDays', '[1,2,3,4,5]')`,
        );

        await assert.rejects(() =>
          tx.unsafe(
            `insert into app_settings (organization_id, key, value) values ('${orgA}'::uuid, 'schoolDays', '[1,2]')`,
          ),
        );

        throw rollback;
      }),
    (error: unknown) =>
      error instanceof Error && error.message === rollback.message,
  );

  await sql.end();
});
