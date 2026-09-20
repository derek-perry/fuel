import { NextResponse } from "next/server";
import { dashboardAccessStatus, getUserStatus } from "@/lib/erau/api";
import { ensureUpstreamCookies, persistUpstreamCookies } from "@/lib/erau/cookies";
import { upstreamErrorResponse } from "@/lib/erau/errors";

export async function GET() {
  try {
    const cookies = await ensureUpstreamCookies();

    const [userStatus, accessStatus] = await Promise.all([
      getUserStatus(cookies),
      dashboardAccessStatus("Fueler", cookies),
    ]);

    await persistUpstreamCookies({ ...userStatus.cookies, ...accessStatus.cookies });

    return NextResponse.json({ hasAccess: accessStatus.data === true });
  } catch (error) {
    return upstreamErrorResponse(error);
  }
}
