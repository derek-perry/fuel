import { erauConfig } from "./config";
import { type CookieMap, cookieMapToHeader, parseSetCookieHeaders } from "./cookieJar";

// Some upstream WAF/WebGate rules challenge requests with a missing or non-browser User-Agent.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_REDIRECTS = 8;

export interface CfcResponse<T> {
  message: string;
  data: T;
  version: string;
  error: boolean;
  type: string;
}

export interface CfcCallResult<T> {
  json: CfcResponse<T>;
  cookies: CookieMap;
}

/**
 * GETs a URL, following redirects manually and carrying cookies between hops ourselves.
 * Plain `fetch` has no cookie jar, so a Set-Cookie issued on an intermediate SSO redirect hop
 * would otherwise be dropped instead of sent on the next hop, causing an infinite redirect loop.
 */
async function fetchFollowingRedirects(
  startUrl: string | URL,
  headers: Record<string, string>,
  initialCookies: CookieMap
): Promise<{ res: Response; cookies: CookieMap }> {
  let currentUrl = startUrl.toString();
  let cookieMap = { ...initialCookies };

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const cookieHeader = cookieMapToHeader(cookieMap);
    const res = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        ...headers,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    cookieMap = { ...cookieMap, ...parseSetCookieHeaders(res.headers.getSetCookie?.() ?? []) };

    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) {
      return { res, cookies: cookieMap };
    }
    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error(`ERAU request exceeded ${MAX_REDIRECTS} redirects (possible SSO login loop) at ${currentUrl}`);
}

/**
 * Calls a Flight Clipboard ColdFusion controller.
 *
 * Confirmed against a real browser request: it's a plain GET with `method` (and any other
 * params) in the query string — not a POST with a JSON body.
 */
export async function callCfc<T>(
  controller: string,
  method: string,
  params: Record<string, unknown> = {},
  cookies: CookieMap = {}
): Promise<CfcCallResult<T>> {
  const url = new URL(`${erauConfig.baseUrl}/controllers/${controller}.cfc`);
  url.searchParams.set("method", method);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const { res, cookies: resultCookies } = await fetchFollowingRedirects(
    url,
    {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      Referer: erauConfig.pageUrl,
      "User-Agent": BROWSER_USER_AGENT,
    },
    cookies
  );

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    const bodySnippet = (await res.text()).slice(0, 300);
    throw new Error(
      `ERAU request returned non-JSON response: ${controller}.${method} -> ${res.status} ${contentType || "(no content-type)"}: ${bodySnippet}`
    );
  }

  if (!res.ok) {
    throw new Error(`ERAU request failed: ${controller}.${method} -> ${res.status}`);
  }

  const json = (await res.json()) as CfcResponse<T>;

  return { json, cookies: resultCookies };
}

/**
 * Loads the public dashboard page, same as a browser would before making any AJAX calls.
 * The upstream WebGate appears to require the Referer/Origin + a cookie from this page load
 * before it will let `.cfc` calls through (otherwise it returns an SSO login page).
 */
export async function warmUpSession(cookies: CookieMap = {}): Promise<{ cookies: CookieMap }> {
  const { res, cookies: resultCookies } = await fetchFollowingRedirects(
    erauConfig.pageUrl,
    { "User-Agent": BROWSER_USER_AGENT },
    cookies
  );

  // Diagnostic: confirms whether the page load itself is being gated too (check dev server logs).
  console.log(
    `[erau] warmUpSession -> ${res.status} ${res.headers.get("content-type")} cookies=${Object.keys(resultCookies).length}`
  );

  return { cookies: resultCookies };
}
