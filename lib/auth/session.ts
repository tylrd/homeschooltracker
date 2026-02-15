import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { members } from "@/db/schema";
import { auth } from "@/lib/auth";

export type TenantContext = {
  userId: string;
  organizationId: string;
};

type BetterAuthSessionLike = {
  user?: { id?: string | null } | null;
  session?: {
    userId?: string | null;
    activeOrganizationId?: string | null;
    activeOrganization?: { id?: string | null } | null;
  } | null;
  activeOrganizationId?: string | null;
  activeOrganization?: { id?: string | null } | null;
} | null;

function getActiveOrganizationId(session: BetterAuthSessionLike) {
  return (
    session?.session?.activeOrganizationId ??
    session?.session?.activeOrganization?.id ??
    session?.activeOrganizationId ??
    session?.activeOrganization?.id ??
    null
  );
}

function getSessionUserId(session: BetterAuthSessionLike) {
  return session?.user?.id ?? session?.session?.userId ?? null;
}

function withNext(path: string, nextPath?: string) {
  if (!nextPath) {
    return path;
  }
  const searchParams = new URLSearchParams({ next: nextPath });
  return `${path}?${searchParams.toString()}`;
}

export async function getSessionOrNull(requestHeaders?: Headers) {
  const authHeaders = requestHeaders ?? (await headers());
  const session = (await auth.api.getSession({
    headers: authHeaders,
  })) as BetterAuthSessionLike;

  return session;
}

export async function requireSession() {
  const session = await getSessionOrNull();

  if (!session) {
    console.warn("[auth] missing_session");
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireActiveOrganization() {
  const session = await requireSession();
  const organizationId = getActiveOrganizationId(session);

  if (!organizationId) {
    console.warn("[auth] missing_active_organization");
    throw new Error("No active organization selected");
  }

  return organizationId;
}

export async function getTenantContext(): Promise<TenantContext> {
  const session = await requireSession();
  const userId = getSessionUserId(session);
  const organizationId = getActiveOrganizationId(session);

  if (!userId) {
    console.warn("[auth] missing_user_id");
    throw new Error("Unauthorized");
  }
  if (!organizationId) {
    console.warn("[auth] missing_active_organization");
    throw new Error("No active organization selected");
  }

  return { userId, organizationId };
}

export async function requireAppRouteAccess(nextPath?: string) {
  const requestHeaders = await headers();
  const session = await getSessionOrNull(requestHeaders);

  if (!session) {
    console.warn("[auth] app_route_missing_session", { nextPath });
    redirect(withNext("/sign-in", nextPath));
  }

  const userId = getSessionUserId(session);
  if (!userId) {
    console.warn("[auth] app_route_missing_user_id", { nextPath });
    redirect(withNext("/sign-in", nextPath));
  }

  const organizationId = getActiveOrganizationId(session);
  if (organizationId) {
    return { userId, organizationId };
  }

  const db = getDb();
  const memberships = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId));

  if (memberships.length === 1) {
    const onlyOrganizationId = memberships[0]?.organizationId;
    if (onlyOrganizationId) {
      await auth.api.setActiveOrganization({
        headers: requestHeaders,
        body: { organizationId: onlyOrganizationId },
      });
      return { userId, organizationId: onlyOrganizationId };
    }
  }

  console.warn("[auth] app_route_missing_active_organization", { nextPath });
  redirect(withNext("/sign-in", nextPath));
}
