import { NextResponse } from "next/server";
import { grantSession, isValidAccessCode } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";

  if (!code) {
    return NextResponse.json({ granted: false, message: "Enter an access code." }, { status: 400 });
  }

  if (!isValidAccessCode(code)) {
    return NextResponse.json({ granted: false, message: "Incorrect access code." }, { status: 401 });
  }

  await grantSession();
  return NextResponse.json({ granted: true });
}

