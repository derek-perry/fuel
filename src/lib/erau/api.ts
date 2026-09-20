import { callCfc } from "./client";
import { type CookieMap } from "./cookieJar";
import { erauConfig } from "./config";
import { mockFuelRequests, mockFuelerDashboardData, mockUserStatus } from "./mockData";
import type { FuelerDashboardData, UserStatus } from "@/types/erau";
import type { FuelRequest } from "@/types/fuelRequest";

export interface ErauCallResult<T> {
  data: T;
  message: string;
  cookies: CookieMap;
}

export async function getUserStatus(cookies: CookieMap): Promise<ErauCallResult<UserStatus>> {
  if (erauConfig.useMockData) return { data: mockUserStatus, message: "", cookies: {} };
  const { json, cookies: resultCookies } = await callCfc<UserStatus>("loginController", "getUserStatus", {}, cookies);
  return { data: json.data, message: json.message, cookies: resultCookies };
}

export async function dashboardAccessStatus(type: "Fueler", cookies: CookieMap): Promise<ErauCallResult<boolean>> {
  if (erauConfig.useMockData) {
    // Simulate session state so the mock flow still exercises the real cookie relay.
    return { data: cookies[`mock_access_${type}`] === "granted", message: "", cookies: {} };
  }
  const { json, cookies: resultCookies } = await callCfc<boolean>(
    "dashboardController",
    "dashboardAccessStatus",
    { type, campus: erauConfig.campus },
    cookies
  );
  return { data: json.data, message: json.message, cookies: resultCookies };
}

export async function dashboardAccess(
  type: "Fueler",
  accessCode: string,
  cookies: CookieMap
): Promise<ErauCallResult<boolean>> {
  if (erauConfig.useMockData) {
    return { data: accessCode.length > 0, message: "", cookies: { [`mock_access_${type}`]: "granted" } };
  }
  const { json, cookies: resultCookies } = await callCfc<boolean>(
    "dashboardController",
    "dashboardAccess",
    { type, accessCode, campus: erauConfig.campus },
    cookies
  );
  return { data: json.data, message: json.message, cookies: resultCookies };
}

export async function fuelerDashboardData(cookies: CookieMap): Promise<ErauCallResult<FuelerDashboardData>> {
  if (erauConfig.useMockData) return { data: mockFuelerDashboardData, message: "", cookies: {} };
  const { json, cookies: resultCookies } = await callCfc<FuelerDashboardData>(
    "dashboardController",
    "fuelerDashboardData",
    {},
    cookies
  );
  return { data: json.data, message: json.message, cookies: resultCookies };
}

export async function getRequestsForFueler(
  campus: string,
  cookies: CookieMap
): Promise<ErauCallResult<FuelRequest[]>> {
  if (erauConfig.useMockData) return { data: mockFuelRequests, message: "", cookies: {} };
  const { json, cookies: resultCookies } = await callCfc<FuelRequest[]>(
    "requestController",
    "getRequestsForFueler",
    { campus },
    cookies
  );
  return { data: json.data, message: json.message, cookies: resultCookies };
}
