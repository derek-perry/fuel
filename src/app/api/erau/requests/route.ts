import { NextResponse } from "next/server";
import { dashboardAccessStatus, getRequestsForFueler } from "@/lib/erau/api";
import { erauConfig } from "@/lib/erau/config";
import { ensureUpstreamCookies, persistUpstreamCookies } from "@/lib/erau/cookies";
import { upstreamErrorResponse } from "@/lib/erau/errors";

export async function GET() {
  try {
    const cookies = await ensureUpstreamCookies();

    const accessStatus = await dashboardAccessStatus("Fueler", cookies);

    if (accessStatus.data !== true) {
      await persistUpstreamCookies(accessStatus.cookies);
      return NextResponse.json({ hasAccess: false, requests: [] });
    }

    const requestsResult = await getRequestsForFueler(erauConfig.campus, { ...cookies, ...accessStatus.cookies });
    await persistUpstreamCookies({ ...accessStatus.cookies, ...requestsResult.cookies });

    return NextResponse.json({ hasAccess: true, requests: requestsResult.data });
  } catch (error) {
    return upstreamErrorResponse(error);
  }
}
