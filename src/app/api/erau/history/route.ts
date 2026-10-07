import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/session";
import { getHistory } from "@/lib/db";

export async function GET(request: Request) {
  const hasAccess = await hasValidSession();
  if (!hasAccess) {
    return NextResponse.json({ history: [] }, { status: 401 });
  }

  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  return NextResponse.json({ history: getHistory(limit) });
}
