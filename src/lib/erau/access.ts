import { dashboardAccess, dashboardAccessStatus } from "./api";
import { readStoredAccessCode, clearStoredAccessCode } from "./cookies";
import { type CookieMap } from "./cookieJar";

export interface AccessCheckResult {
  hasAccess: boolean;
  cookies: CookieMap;
}

// Checks upstream access, silently re-submitting a previously saved access code if the
// upstream session no longer reports access, so the user isn't re-prompted every time it expires.
export async function checkDashboardAccess(cookies: CookieMap): Promise<AccessCheckResult> {
  const status = await dashboardAccessStatus("Fueler", cookies);
  const merged = { ...cookies, ...status.cookies };

  if (status.data === true) {
    return { hasAccess: true, cookies: merged };
  }

  const savedCode = await readStoredAccessCode();
  if (!savedCode) {
    return { hasAccess: false, cookies: merged };
  }

  const accessResult = await dashboardAccess("Fueler", savedCode, merged);
  const withAccessCookies = { ...merged, ...accessResult.cookies };

  if (accessResult.data === true) {
    return { hasAccess: true, cookies: withAccessCookies };
  }

  // Saved code no longer works upstream — stop retrying with it.
  await clearStoredAccessCode();
  return { hasAccess: false, cookies: withAccessCookies };
}
