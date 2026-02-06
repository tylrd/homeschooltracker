import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const globalForDb = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql;
}

export const db = drizzle(sql, { schema });
export { sql };
