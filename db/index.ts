import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: PostgresJsDatabase<typeof schema> | undefined;
  sql: postgres.Sql | undefined;
};

export function getSql() {
  if (!globalForDb.sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    globalForDb.sql = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
    });
  }
  return globalForDb.sql;
}

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getSql(), { schema });
  }
  return globalForDb.db;
}
