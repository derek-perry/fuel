import { NextResponse } from "next/server";

// Upstream failures (unexpected wire format, WAF/login block page, network error) surface as JSON instead of crashing the route with an HTML 500 page.
export function upstreamErrorResponse(error: unknown) {
  console.error("[erau] upstream call failed:", error);
  const message = error instanceof Error ? error.message : "Unknown upstream error";
  return NextResponse.json({ error: message }, { status: 502 });
}
