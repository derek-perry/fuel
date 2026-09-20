import { NextResponse } from "next/server";
import { dashboardAccess, fuelerDashboardData } from "@/lib/erau/api";
import { ensureUpstreamCookies, persistUpstreamCookies } from "@/lib/erau/cookies";
import { upstreamErrorResponse } from "@/lib/erau/errors";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";

  if (!code) {
    return NextResponse.json({ granted: false, message: "Enter an access code." }, { status: 400 });
  }

  try {
    const cookies = await ensureUpstreamCookies();

    // The upstream itself validates this — it's the actual auth check, not just client UX.
    const accessResult = await dashboardAccess("Fueler", code, cookies);
    const heartbeat = await fuelerDashboardData({ ...cookies, ...accessResult.cookies });

    await persistUpstreamCookies({ ...accessResult.cookies, ...heartbeat.cookies });

    const granted = accessResult.data === true;
    if (!granted) {
      // Diagnostic: see exactly what upstream said when it declines.
      console.log(`[erau] dashboardAccess did not grant access: data=${JSON.stringify(accessResult.data)} message=${accessResult.message}`);
    }

    return NextResponse.json({
      granted,
      message: granted ? undefined : accessResult.message || "The server did not grant access. Please try again.",
    });
  } catch (error) {
    return upstreamErrorResponse(error);
  }
}
