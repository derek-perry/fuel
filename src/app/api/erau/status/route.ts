import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/session";
import { getCollectorState } from "@/lib/db";

export async function GET() {
  const hasAccess = await hasValidSession();
  const collector = getCollectorState();

  return NextResponse.json({
    hasAccess,
    collectorHealthy: collector.hasAccess,
    collectorLastPollAt: collector.lastPollAt,
    collectorError: collector.lastError,
  });
}

