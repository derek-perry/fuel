const DEFAULT_BASE_URL = "https://webapps.erau.edu/flight-clipboard";

const baseUrl = process.env.ERAU_BASE_URL ?? DEFAULT_BASE_URL;

export const erauConfig = {
  baseUrl,
  // The upstream WebGate appears to require a Referer + a cookie established by first loading
  // this page, same as a real browser visiting the dashboard would.
  pageUrl: `${baseUrl}/public/fueler-dashboard`,
  campus: process.env.FUELER_CAMPUS ?? "DB",
  useMockData: process.env.USE_MOCK_DATA === "true",
};
