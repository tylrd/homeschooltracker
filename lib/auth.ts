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
  userDefaultOrganizations,
  users,
  verifications,
} from "@/db/schema";
import { env } from "@/lib/env";

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

const hasDatabaseUrl = Boolean(env.DATABASE_URL);
const betterAuthOrigin = new URL(env.BETTER_AUTH_BASE_URL).origin;

const databaseAdapter = hasDatabaseUrl
  ? drizzleAdapter(getDb(), {
      provider: "pg",
      schema: betterAuthSchema,
    })
  : memoryAdapter({});

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [betterAuthOrigin],
  database: databaseAdapter,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          const db = getDb();
          const organizationId = crypto.randomUUID();

          await db.transaction(async (tx) => {
            await tx.insert(organizations).values({
              id: organizationId,
              name: "default",
              slug: `default-${organizationId.slice(0, 8)}`,
            });

            await tx.insert(members).values({
              organizationId,
              userId: user.id,
              role: "owner",
            });

            await tx
              .insert(userDefaultOrganizations)
              .values({
                userId: user.id,
                organizationId,
              })
              .onConflictDoUpdate({
                target: userDefaultOrganizations.userId,
                set: {
                  organizationId,
                  updatedAt: new Date(),
                },
              });
          });
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
