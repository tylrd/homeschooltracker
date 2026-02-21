import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveOrganizationId } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json(null, { status: 200 });
  }

  const activeOrganizationId = getActiveOrganizationId(session);

  return NextResponse.json(
    {
      userId: session.user?.id ?? null,
      activeOrganizationId,
      raw: session,
    },
    { status: 200 },
  );
}
