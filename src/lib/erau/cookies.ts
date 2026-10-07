import { type CookieMap } from "./cookieJar";
import { warmUpSession } from "./client";
import { erauConfig } from "./config";

// Collector-only (no per-request/browser context here — this is a standalone long-running
// process, unlike the old per-browser httpOnly-cookie version this file used to be). The
// upstream session cookie just lives as module state for the life of the process; a restart
// simply re-warms-up once.
let currentCookies: CookieMap = {};

export async function readUpstreamCookies(): Promise<CookieMap> {
  return currentCookies;
}

// Merges new upstream cookies into the in-memory cookie map.
export async function persistUpstreamCookies(newCookies: CookieMap): Promise<void> {
  if (Object.keys(newCookies).length === 0) return;
  currentCookies = { ...currentCookies, ...newCookies };
}

export async function clearUpstreamCookies(): Promise<void> {
  currentCookies = {};
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
