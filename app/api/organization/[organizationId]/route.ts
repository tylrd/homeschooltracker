import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { members, organizations } from "@/db/schema";
import { auth } from "@/lib/auth";

type SessionLike = {
  user?: { id?: string | null } | null;
  session?: {
    userId?: string | null;
    activeOrganizationId?: string | null;
  } | null;
} | null;

function getUserId(session: SessionLike) {
  return session?.user?.id ?? session?.session?.userId ?? null;
}

function getActiveOrganizationId(session: SessionLike) {
  return session?.session?.activeOrganizationId ?? null;
}

function canManageOrganization(role: string) {
  return role === "owner" || role === "admin";
}

async function getAuthorizedMembership(
  request: Request,
  organizationId: string,
) {
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as SessionLike;

  const userId = getUserId(session);
  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const db = getDb();
  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, userId),
      eq(members.organizationId, organizationId),
    ),
  });

  if (!membership) {
    return {
      error: NextResponse.json(
        { error: "Organization not accessible" },
        { status: 403 },
      ),
    };
  }

  if (!canManageOrganization(membership.role)) {
    return {
      error: NextResponse.json(
        { error: "Only organization owners/admins can do this." },
        { status: 403 },
      ),
    };
  }

  return { session, userId, membership };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const authResult = await getAuthorizedMembership(request, organizationId);
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string | null;
  } | null;
  const name = body?.name?.trim() ?? "";

  if (!name) {
    return NextResponse.json(
      { error: "Organization name is required." },
      { status: 400 },
    );
  }

  if (name.length > 80) {
    return NextResponse.json(
      { error: "Organization name must be 80 characters or fewer." },
      { status: 400 },
    );
  }

  const db = getDb();
  const updated = await db
    .update(organizations)
    .set({ name })
    .where(eq(organizations.id, organizationId))
    .returning({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
    });

  const organization = updated[0];
  if (!organization) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, organization });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const authResult = await getAuthorizedMembership(request, organizationId);
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = (await request.json().catch(() => null)) as {
    confirmName?: string | null;
  } | null;
  const confirmName = body?.confirmName?.trim() ?? "";

  const db = getDb();
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 },
    );
  }

  if (confirmName !== organization.name) {
    return NextResponse.json(
      { error: "Confirmation name does not match organization name." },
      { status: 400 },
    );
  }

  await db.delete(organizations).where(eq(organizations.id, organizationId));

  const remainingMemberships = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, authResult.userId))
    .orderBy(asc(members.createdAt));

  const wasActive =
    getActiveOrganizationId(authResult.session) === organizationId;
  const nextActiveOrganizationId =
    remainingMemberships[0]?.organizationId ?? null;

  if (wasActive && nextActiveOrganizationId) {
    await auth.api.setActiveOrganization({
      headers: request.headers,
      body: { organizationId: nextActiveOrganizationId },
    });
  }

  return NextResponse.json({
    ok: true,
    deletedOrganizationId: organizationId,
    nextActiveOrganizationId: wasActive ? nextActiveOrganizationId : null,
  });
}
