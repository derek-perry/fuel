import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/session";
import { requestExists, setClaim, setFueled, getRequestRecord } from "@/lib/db";
import trucks from "@/data/trucks.json";
import fuelers from "@/data/fuelers.json";

interface ClaimLike {
  truck: string;
  fueler: string;
}

interface PatchBody {
  claim?: ClaimLike | null;
  fueled?: ClaimLike | null;
}

function isKnownTruck(truck: string): boolean {
  return trucks.some((t) => t.number === truck);
}

function isKnownFueler(fueler: string): boolean {
  return fuelers.some((f) => f.name === fueler);
}

function isValidClaimLike(value: unknown): value is ClaimLike {
  if (value === null || typeof value !== "object") return false;
  const { truck, fueler } = value as Record<string, unknown>;
  return typeof truck === "string" && typeof fueler === "string" && isKnownTruck(truck) && isKnownFueler(fueler);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const hasAccess = await hasValidSession();
  if (!hasAccess) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || !requestExists(requestId)) {
    return NextResponse.json({ error: "Unknown request." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body || (!("claim" in body) && !("fueled" in body))) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  if ("claim" in body) {
    if (body.claim !== null && !isValidClaimLike(body.claim)) {
      return NextResponse.json({ error: "Unknown truck or fueler." }, { status: 400 });
    }
    setClaim(requestId, body.claim ?? null);
  }

  if ("fueled" in body) {
    if (body.fueled !== null && !isValidClaimLike(body.fueled)) {
      return NextResponse.json({ error: "Unknown truck or fueler." }, { status: 400 });
    }
    setFueled(requestId, body.fueled ?? null);
  }

  return NextResponse.json({ request: getRequestRecord(requestId) });
}
