import { dashboardAccess, dashboardAccessStatus } from "./api";
import { erauConfig } from "./config";
import { type CookieMap } from "./cookieJar";

export interface AccessCheckResult {
  hasAccess: boolean;
  cookies: CookieMap;
}

// Checks upstream access, silently re-submitting the server-configured ERAU_FUELER_ACCESS_CODE
// if the upstream session no longer reports access (e.g. after the OAM session expires).
export async function checkDashboardAccess(cookies: CookieMap): Promise<AccessCheckResult> {
  const status = await dashboardAccessStatus("Fueler", cookies);
  const merged = { ...cookies, ...status.cookies };

  if (status.data === true) {
    return { hasAccess: true, cookies: merged };
  }

  const code = erauConfig.fuelerAccessCode;
  if (!code) {
    return { hasAccess: false, cookies: merged };
  }

  const accessResult = await dashboardAccess("Fueler", code, merged);
  return { hasAccess: accessResult.data === true, cookies: { ...merged, ...accessResult.cookies } };
}
