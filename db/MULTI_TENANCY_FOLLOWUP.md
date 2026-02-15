# Multi-Tenancy Follow-Up

`drizzle/0007_tenant_organizations.sql` intentionally sets a temporary default
for every tenant-scoped `organization_id` column:

- `'00000000-0000-0000-0000-000000000001'::uuid`

This keeps existing server actions operational until request-context tenant
resolution is implemented via Better Auth sessions.

## Follow-up migration status

This hardening has been implemented in:

- `drizzle/0008_remove_bootstrap_org_defaults.sql`

After applying `0008`, every insert path must explicitly provide
`organization_id` from active Better Auth organization context.

Do not remove `NOT NULL`; only remove bootstrap defaults.
