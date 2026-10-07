import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/session";
import { getLiveRequests } from "@/lib/db";

export async function GET() {
  const hasAccess = await hasValidSession();
  if (!hasAccess) {
    return NextResponse.json({ hasAccess: false, requests: [] });
  }

  return NextResponse.json({ hasAccess: true, requests: getLiveRequests() });
}

