import { NextResponse } from "next/server";
import { getUserStatus } from "@/lib/erau/api";
import { checkDashboardAccess } from "@/lib/erau/access";
import { ensureUpstreamCookies, persistUpstreamCookies } from "@/lib/erau/cookies";
import { upstreamErrorResponse } from "@/lib/erau/errors";

export async function GET() {
  try {
    const cookies = await ensureUpstreamCookies();

    const [userStatus, access] = await Promise.all([
      getUserStatus(cookies),
      checkDashboardAccess(cookies),
    ]);

    await persistUpstreamCookies({ ...userStatus.cookies, ...access.cookies });

    return NextResponse.json({ hasAccess: access.hasAccess });
  } catch (error) {
    return upstreamErrorResponse(error);
  }
}
