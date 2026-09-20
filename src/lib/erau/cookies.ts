import { cookies } from "next/headers";
import { type CookieMap } from "./cookieJar";
import { warmUpSession } from "./client";
import { erauConfig } from "./config";

const PROXY_COOKIE_NAME = "erau_cookies";

function readStoredMap(raw: string | undefined): CookieMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CookieMap;
  } catch {
    return {};
  }
}

export async function readUpstreamCookies(): Promise<CookieMap> {
  const store = await cookies();
  return readStoredMap(store.get(PROXY_COOKIE_NAME)?.value);
}

// Merges new upstream cookies into our single proxy cookie on the response.
export async function persistUpstreamCookies(newCookies: CookieMap): Promise<void> {
  if (Object.keys(newCookies).length === 0) return;
  const store = await cookies();
  const merged = { ...readStoredMap(store.get(PROXY_COOKIE_NAME)?.value), ...newCookies };
  store.set(PROXY_COOKIE_NAME, JSON.stringify(merged), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearUpstreamCookies(): Promise<void> {
  const store = await cookies();
  store.delete(PROXY_COOKIE_NAME);
}

// Like `readUpstreamCookies`, but loads the dashboard page first (once, when we don't already
// have a cookie) so the upstream WebGate treats subsequent `.cfc` calls as coming from a real
// page visit instead of rejecting them with an SSO login page.
export async function ensureUpstreamCookies(): Promise<CookieMap> {
  const existing = await readUpstreamCookies();
  if (Object.keys(existing).length > 0 || erauConfig.useMockData) return existing;

  const { cookies: warmedCookies } = await warmUpSession(existing);
  await persistUpstreamCookies(warmedCookies);
  return { ...existing, ...warmedCookies };
}
