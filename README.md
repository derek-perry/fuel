# Fueler Dashboard (Next.js rewrite)

A Next.js rewrite of the ERAU Flight Clipboard "Fueler Dashboard" — shows live fuel/oil
requests for fuelers, gated behind a soft access code.

## How it works

The browser never talks to `webapps.erau.edu` directly. Everything goes through this app's
own Route Handlers under `src/app/api/erau/*`, which proxy the ColdFusion controllers
server-side. This avoids CORS (since this app is deployed on a different origin) and lets us
relay the upstream session cookie without exposing it to the browser.

```
Browser --> /api/erau/status    --> loginController.cfc (getUserStatus)
                                 --> dashboardController.cfc (dashboardAccessStatus)
Browser --> /api/erau/access    --> dashboardController.cfc (dashboardAccess)
                                 --> dashboardController.cfc (fuelerDashboardData)
Browser --> /api/erau/requests  --> dashboardController.cfc (dashboardAccessStatus)
                                 --> requestController.cfc (getRequestsForFueler)
```

The upstream `Set-Cookie` response headers are captured server-side, re-issued to the browser
as a single httpOnly `erau_cookies` cookie, and replayed as the `Cookie` header on subsequent
proxied calls (see `src/lib/erau/cookies.ts`).

**Important:** the access code entered in the modal IS forwarded to and validated by the
upstream `dashboardAccess` call (as an `accessCode` parameter) — this is real server-side
validation, not just client-side UX. We initially assumed otherwise from the network traffic
alone; a real request confirmed `dashboardAccess` requires `accessCode` and rejects requests
without it. This app no longer does its own code comparison — it always forwards whatever the
user typed and trusts the upstream's response.

## Environment variables

Copy `.env.example` to `.env` (or `.env.local`) and adjust as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `ERAU_BASE_URL` | Base URL of the upstream Flight Clipboard app (server-only). | `https://webapps.erau.edu/flight-clipboard` |
| `FUELER_CAMPUS` | Campus code passed to `getRequestsForFueler`. | `DB` |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | How often the client polls for new requests. | `10000` |
| `USE_MOCK_DATA` | When `true`, route handlers return canned sample data instead of calling upstream — useful without campus network/VPN access. | `false` |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `USE_MOCK_DATA=true`, enter any
non-empty access code to see sample fuel requests without hitting the real ERAU servers.

## Notes / open questions

- `.cfc` calls are plain `GET` requests with `method` (and any other params, e.g. `type`,
  `campus`) in the query string — confirmed against a real captured browser request. The
  upstream WebGate also appears to require a `Referer` header and a cookie established by
  first loading the dashboard page (see `warmUpSession` in `src/lib/erau/client.ts`).
- `STATUS_ID` values (e.g. `5`) are shown as-is; no status legend has been confirmed yet.

