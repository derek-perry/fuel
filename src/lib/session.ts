import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

// Local-only dashboard login — unrelated to ERAU. Replaces the old flow where the user's typed
// access code was forwarded to and validated by upstream; now the collector is the only thing
// that talks to ERAU (see src/lib/erau/access.ts + ERAU_FUELER_ACCESS_CODE), so this is just a
// shared-secret gate protecting the dashboard itself.
const SESSION_COOKIE_NAME = "fuel_session";
const SESSION_LABEL = "granted";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function getSessionSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret) throw new Error("DASHBOARD_SESSION_SECRET is not set");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function grantSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, sign(SESSION_LABEL), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function hasValidSession(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE_NAME)?.value;
  return value != null && safeEqual(value, sign(SESSION_LABEL));
}

// Constant-time compare for the code the user types into AccessCodeModal.
export function isValidAccessCode(code: string): boolean {
  const expected = process.env.DASHBOARD_ACCESS_CODE;
  return expected != null && expected.length > 0 && safeEqual(code, expected);
}
