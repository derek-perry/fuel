import "dotenv/config";
import { ensureUpstreamCookies, persistUpstreamCookies } from "@/lib/erau/cookies";
import { checkDashboardAccess } from "@/lib/erau/access";
import { getRequestsForFueler } from "@/lib/erau/api";
import { erauConfig } from "@/lib/erau/config";
import { toRequestInsertInput } from "@/lib/erau/summary";
import { replaceLiveSnapshot, setCollectorState } from "@/lib/db";

// The only process that talks to ERAU — polls on an interval and writes into SQLite; the
// Next.js dashboard only ever reads from there. See /memories/repo or AGENTS.md context for why.
const POLL_INTERVAL_MS = Number(process.env.COLLECTOR_POLL_INTERVAL_MS ?? 3000);

let stopped = false;

async function pollOnce(): Promise<void> {
  const now = new Date().toISOString();
  try {
    const cookies = await ensureUpstreamCookies();
    const access = await checkDashboardAccess(cookies);
    await persistUpstreamCookies(access.cookies);

    if (!access.hasAccess) {
      setCollectorState({
        hasAccess: false,
        lastPollAt: now,
        lastError: "ERAU access not granted — check ERAU_FUELER_ACCESS_CODE",
      });
      console.log(`[collector] access not granted at ${new Date().toISOString()}`);
      return;
    }

    const result = await getRequestsForFueler(erauConfig.campus, access.cookies);
    await persistUpstreamCookies(result.cookies);

    replaceLiveSnapshot(result.data.map(toRequestInsertInput));
    setCollectorState({ hasAccess: true, lastPollAt: now, lastError: null });
    console.log(`[collector] successfully updated live snapshot at ${new Date().toISOString()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown collector error";
    console.error("[collector] poll failed:", error);
    setCollectorState({ hasAccess: false, lastPollAt: now, lastError: message });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log(
    `[collector] starting — poll interval ${POLL_INTERVAL_MS}ms, mock=${erauConfig.useMockData}, campus=${erauConfig.campus}`
  );

  while (!stopped) {
    await pollOnce();
    console.log(`[collector] completed poll cycle at ${new Date().toISOString()}`);
    if (!stopped) await sleep(POLL_INTERVAL_MS);
  }

  console.log("[collector] stopped");
}

function shutdown(signal: string): void {
  console.log(`[collector] received ${signal}, stopping after current cycle...`);
  stopped = true;
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main();
