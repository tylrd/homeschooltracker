import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { members, organizations, userDefaultOrganizations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSessionOrNull } from "@/lib/auth/session";
import { OrgSelectClient } from "./org-select-client";

export const dynamic = "force-dynamic";

function getUserId(session: Awaited<ReturnType<typeof getSessionOrNull>>) {
  return session?.user?.id ?? session?.session?.userId ?? null;
}

function getActiveOrganizationId(
  session: Awaited<ReturnType<typeof getSessionOrNull>>,
) {
  return (
    session?.session?.activeOrganizationId ??
    session?.session?.activeOrganization?.id ??
    session?.activeOrganizationId ??
    session?.activeOrganization?.id ??
    null
  );
}

export default async function OrgSelectPage() {
  const session = await getSessionOrNull();

  if (!session) {
    redirect("/sign-in?next=%2Forg%2Fselect");
  }

  const userId = getUserId(session);
  if (!userId) {
    redirect("/sign-in?next=%2Forg%2Fselect");
  }

  const db = getDb();
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      memberCreatedAt: members.createdAt,
    })
    .from(members)
    .innerJoin(
      organizations,
      and(
        eq(members.organizationId, organizations.id),
        eq(members.userId, userId),
      ),
    )
    .orderBy(asc(members.createdAt));

  const activeOrganizationId = getActiveOrganizationId(session);

  const defaultRow = await db.query.userDefaultOrganizations.findFirst({
    where: eq(userDefaultOrganizations.userId, userId),
  });

  const autoOrganizationId = activeOrganizationId
    ? null
    : rows.length === 1
      ? rows[0]?.id
      : defaultRow?.organizationId;

  if (autoOrganizationId && rows.some((row) => row.id === autoOrganizationId)) {
    const requestHeaders = await headers();
    await auth.api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: autoOrganizationId },
    });
    redirect("/dashboard");
  }

  return (
    <OrgSelectClient
      initialOrganizations={rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
      }))}
      activeOrganizationId={activeOrganizationId}
      defaultOrganizationId={defaultRow?.organizationId ?? null}
    />
  );
}
