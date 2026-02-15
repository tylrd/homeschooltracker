# Multi-Tenancy Runbook

## Goal
Roll out tenant-enforced data access using Better Auth active organizations, with safe migration sequencing and verifiable tenant isolation.

## Invariants
- Every domain row has a non-null `organization_id`.
- Every app read/write path is scoped by active organization.
- Every mutation checks ownership (`id` + `organization_id`).
- `app_settings` uniqueness is `(organization_id, key)`.
- `global_absences` uniqueness is `(organization_id, date)`.

## Preflight
Run from the same repo/worktree you will deploy:

```bash
./scripts/preflight-multi-tenancy.sh
```

This checks:
- current working directory
- migration files `0007` and `0008`
- journal entries for `0007` and `0008`
- `DATABASE_URL` connectivity/target

## Deployment Sequence

1. Backup database.
2. Deploy code with auth route + tenant-scoped reads and writes.
3. Run migration `0007_tenant_organizations.sql` (`pnpm db:migrate`).
4. Verify tenant columns and bootstrap backfill.
5. Verify application flows under authenticated org context.
6. Run migration `0008_remove_bootstrap_org_defaults.sql` (`pnpm db:migrate`).
7. Verify inserts fail if `organization_id` is not explicitly set.

## Deployment Checklist
1. Run `./scripts/preflight-multi-tenancy.sh`.
2. Confirm code deploy includes `/sign-in`, `/org/select`, and app route guards.
3. Run `pnpm db:migrate` for `0007`.
4. Run tenant smoke checks (`pnpm test:tenancy`, Playwright auth-gate test).
5. Run `pnpm db:migrate` for `0008`.
6. Re-run tenant smoke checks.

## Verification Queries

```sql
-- Migration state
select * from drizzle.__drizzle_migrations order by created_at;

-- Column hardening state
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'students'
  and column_name = 'organization_id';

-- Null-safety checks
select count(*) from students where organization_id is null;
select count(*) from resources where organization_id is null;
select count(*) from lessons where organization_id is null;
select count(*) from app_settings where organization_id is null;
```

## Rollback Notes
- Schema rollback is not automatic; prefer restore from DB backup.
- If rollback of app code is required, do it only after confirming DB compatibility.
- Do not reintroduce global defaults for `organization_id` unless performing a controlled emergency rollback.

## Operational Troubleshooting
- If migrations appear “successful” but schema is unchanged:
  - confirm correct worktree
  - verify `drizzle/meta/_journal.json` contains target migration
  - verify `DATABASE_URL` points to expected DB
- If `db:migrate:run` fails due top-level await/CJS:
  - use `pnpm db:migrate` or updated `db/migrate.ts` main wrapper.
