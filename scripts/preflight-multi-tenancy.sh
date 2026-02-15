#!/usr/bin/env bash
set -euo pipefail

echo "== Multi-Tenancy Preflight =="
echo "pwd: $(pwd)"

if [[ ! -f "drizzle/0007_tenant_organizations.sql" ]]; then
  echo "ERROR: drizzle/0007_tenant_organizations.sql is missing"
  exit 1
fi

if [[ ! -f "drizzle/0008_remove_bootstrap_org_defaults.sql" ]]; then
  echo "ERROR: drizzle/0008_remove_bootstrap_org_defaults.sql is missing"
  exit 1
fi

if ! rg -q '"tag": "0007_tenant_organizations"' drizzle/meta/_journal.json; then
  echo "ERROR: drizzle/meta/_journal.json missing 0007 entry"
  exit 1
fi

if ! rg -q '"tag": "0008_remove_bootstrap_org_defaults"' drizzle/meta/_journal.json; then
  echo "ERROR: drizzle/meta/_journal.json missing 0008 entry"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "DATABASE_URL is set"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "select current_database(), current_user;"
echo "Preflight OK"
