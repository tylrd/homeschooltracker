import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { memoryAdapter } from "better-auth/adapters/memory";
import { organization } from "better-auth/plugins/organization";
import { getDb } from "@/db";
import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  teamMembers,
  teams,
  users,
  verifications,
} from "@/db/schema";

const betterAuthSchema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  organization: organizations,
  member: members,
  invitation: invitations,
  team: teams,
  teamMember: teamMembers,
};

const isDevelopment = process.env.NODE_ENV === "development";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (isDevelopment && !hasDatabaseUrl) {
  throw new Error(
    "DATABASE_URL must be defined in development. Add it to your .env.local before starting the app.",
  );
}

const databaseAdapter = hasDatabaseUrl
  ? drizzleAdapter(getDb(), {
      provider: "pg",
      schema: betterAuthSchema,
    })
  : memoryAdapter({});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? process.env.BETTER_AUTH_URL,
  database: databaseAdapter,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
