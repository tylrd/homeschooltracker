import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json(null, { status: 200 });
  }

  const activeOrganizationId =
    session.session?.activeOrganizationId ??
    session.session?.activeOrganization?.id ??
    session.activeOrganizationId ??
    session.activeOrganization?.id ??
    null;

  return NextResponse.json(
    {
      userId: session.user?.id ?? null,
      activeOrganizationId,
      raw: session,
    },
    { status: 200 },
  );
}
