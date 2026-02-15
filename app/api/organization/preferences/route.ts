import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { members, organizations, userDefaultOrganizations } from "@/db/schema";
import { auth } from "@/lib/auth";

type SessionLike = {
  user?: { id?: string | null } | null;
  session?: {
    userId?: string | null;
    activeOrganizationId?: string | null;
    activeOrganization?: { id?: string | null } | null;
  } | null;
  activeOrganizationId?: string | null;
  activeOrganization?: { id?: string | null } | null;
} | null;

function getUserId(session: SessionLike) {
  return session?.user?.id ?? session?.session?.userId ?? null;
}

function getActiveOrganizationId(session: SessionLike) {
  return (
    session?.session?.activeOrganizationId ??
    session?.session?.activeOrganization?.id ??
    session?.activeOrganizationId ??
    session?.activeOrganization?.id ??
    null
  );
}

export async function GET(request: Request) {
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as SessionLike;

  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const defaultRow = await db.query.userDefaultOrganizations.findFirst({
    where: eq(userDefaultOrganizations.userId, userId),
  });

  return NextResponse.json({
    organizations: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    })),
    defaultOrganizationId: defaultRow?.organizationId ?? null,
    activeOrganizationId: getActiveOrganizationId(session),
  });
}

export async function POST(request: Request) {
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as SessionLike;

  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    organizationId?: string | null;
  } | null;
  const organizationId = body?.organizationId ?? null;

  const db = getDb();

  if (!organizationId) {
    await db
      .delete(userDefaultOrganizations)
      .where(eq(userDefaultOrganizations.userId, userId));

    return NextResponse.json({ ok: true, defaultOrganizationId: null });
  }

  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, userId),
      eq(members.organizationId, organizationId),
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Organization not accessible" },
      { status: 403 },
    );
  }

  await db
    .insert(userDefaultOrganizations)
    .values({ userId, organizationId })
    .onConflictDoUpdate({
      target: userDefaultOrganizations.userId,
      set: { organizationId, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, defaultOrganizationId: organizationId });
}
