import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "./drizzle" });
  await sql.end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
