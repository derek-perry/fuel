import { NextResponse } from "next/server";
import { getRequestsForFueler } from "@/lib/erau/api";
import { checkDashboardAccess } from "@/lib/erau/access";
import { erauConfig } from "@/lib/erau/config";
import { ensureUpstreamCookies, persistUpstreamCookies } from "@/lib/erau/cookies";
import { upstreamErrorResponse } from "@/lib/erau/errors";

export async function GET() {
  try {
    const cookies = await ensureUpstreamCookies();

    const access = await checkDashboardAccess(cookies);

    if (!access.hasAccess) {
      await persistUpstreamCookies(access.cookies);
      return NextResponse.json({ hasAccess: false, requests: [] });
    }

    const requestsResult = await getRequestsForFueler(erauConfig.campus, access.cookies);
    await persistUpstreamCookies({ ...access.cookies, ...requestsResult.cookies });

    return NextResponse.json({ hasAccess: true, requests: requestsResult.data });
  } catch (error) {
    return upstreamErrorResponse(error);
  }
}
