import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/session";
import { getHistoryBetween, getHistoryDays } from "@/lib/db";

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function parseIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// GET ?tz=<IANA zone>        -> { days: [{ day, count }] } (newest first)
// GET ?from=<iso>&to=<iso>   -> { history: [...] } for completions in [from, to)
export async function GET(request: Request) {
  const hasAccess = await hasValidSession();
  if (!hasAccess) {
    return NextResponse.json({ history: [], days: [] }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;

  const timeZone = params.get("tz");
  if (timeZone) {
    if (!isValidTimeZone(timeZone)) {
      return NextResponse.json({ error: "Invalid time zone" }, { status: 400 });
    }
    return NextResponse.json({ days: getHistoryDays(timeZone) });
  }

  const from = parseIso(params.get("from"));
  const to = parseIso(params.get("to"));
  if (!from || !to) {
    return NextResponse.json({ error: "Provide tz, or from and to" }, { status: 400 });
  }

  return NextResponse.json({ history: getHistoryBetween(from, to) });
}
