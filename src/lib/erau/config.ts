const DEFAULT_BASE_URL = "https://webapps.erau.edu/flight-clipboard";

const baseUrl = process.env.ERAU_BASE_URL ?? DEFAULT_BASE_URL;
const useMockData = process.env.USE_MOCK_DATA === "true";

export const erauConfig = {
  baseUrl,
  // The upstream WebGate appears to require a Referer + a cookie established by first loading
  // this page, same as a real browser visiting the dashboard would.
  pageUrl: `${baseUrl}/public/fueler-dashboard`,
  campus: process.env.FUELER_CAMPUS ?? "DB",
  useMockData,
  // Server-only — the real ERAU "Fueler" access code the collector auto-submits. Never sent to
  // the browser; dashboard users authenticate against DASHBOARD_ACCESS_CODE instead (see
  // src/lib/session.ts), which is unrelated to this and never forwarded upstream. Falls back to
  // a placeholder in mock mode so `npm run collector:dev` works without extra setup.
  fuelerAccessCode: process.env.ERAU_FUELER_ACCESS_CODE ?? (useMockData ? "mock-code" : undefined),
};
