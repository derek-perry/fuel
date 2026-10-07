import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { FuelRequestRecord } from "@/types/fuelRequest";
import type { RequestInsertInput } from "./erau/summary";

const dbPath = process.env.SQLITE_DB_PATH ?? "./data/fuel.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    request_id INTEGER PRIMARY KEY,
    tail_number TEXT NOT NULL,
    plane_type TEXT NOT NULL,
    parking_spot TEXT NOT NULL,
    request_type TEXT NOT NULL,
    fuel_requested INTEGER NOT NULL DEFAULT 0,
    fuel_amount_type TEXT,
    fuel_amount TEXT,
    oil_requested INTEGER NOT NULL DEFAULT 0,
    raw_data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    claimed_at TEXT,
    claimed_truck TEXT,
    claimed_fueler TEXT,
    fueled_at TEXT,
    fueled_truck TEXT,
    fueled_fueler TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_requests_completed_at ON requests (completed_at);

  CREATE TABLE IF NOT EXISTS collector_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    has_access INTEGER NOT NULL DEFAULT 0,
    last_poll_at TEXT,
    last_error TEXT
  );

  INSERT OR IGNORE INTO collector_state (id, has_access) VALUES (1, 0);
`);

interface RequestRow {
  request_id: number;
  tail_number: string;
  plane_type: string;
  parking_spot: string;
  request_type: string;
  fuel_requested: number;
  fuel_amount_type: string | null;
  fuel_amount: string | null;
  oil_requested: number;
  created_at: string;
  completed_at: string | null;
  claimed_at: string | null;
  claimed_truck: string | null;
  claimed_fueler: string | null;
  fueled_at: string | null;
  fueled_truck: string | null;
  fueled_fueler: string | null;
}

function rowToRecord(row: RequestRow): FuelRequestRecord {
  return {
    requestId: row.request_id,
    tailNumber: row.tail_number,
    planeType: row.plane_type,
    parkingSpot: row.parking_spot,
    requestType: row.request_type as FuelRequestRecord["requestType"],
    fuelRequested: Boolean(row.fuel_requested),
    fuelAmountType: row.fuel_amount_type,
    fuelAmount: row.fuel_amount,
    oilRequested: Boolean(row.oil_requested),
    createdAt: row.created_at,
    completedAt: row.completed_at,
    claimedAt: row.claimed_at,
    claimedTruck: row.claimed_truck,
    claimedFueler: row.claimed_fueler,
    fueledAt: row.fueled_at,
    fueledTruck: row.fueled_truck,
    fueledFueler: row.fueled_fueler,
  };
}

const RECORD_COLUMNS = `
  request_id, tail_number, plane_type, parking_spot, request_type, fuel_requested,
  fuel_amount_type, fuel_amount, oil_requested, created_at, completed_at,
  claimed_at, claimed_truck, claimed_fueler, fueled_at, fueled_truck, fueled_fueler
`;

const upsertRequestStmt = db.prepare(`
  INSERT INTO requests (
    request_id, tail_number, plane_type, parking_spot, request_type, fuel_requested,
    fuel_amount_type, fuel_amount, oil_requested, raw_data, created_at, completed_at, updated_at
  ) VALUES (
    @requestId, @tailNumber, @planeType, @parkingSpot, @requestType, @fuelRequested,
    @fuelAmountType, @fuelAmount, @oilRequested, @rawData, @createdAt, NULL, @updatedAt
  )
  ON CONFLICT (request_id) DO UPDATE SET
    tail_number = excluded.tail_number,
    plane_type = excluded.plane_type,
    parking_spot = excluded.parking_spot,
    request_type = excluded.request_type,
    fuel_requested = excluded.fuel_requested,
    fuel_amount_type = excluded.fuel_amount_type,
    fuel_amount = excluded.fuel_amount,
    oil_requested = excluded.oil_requested,
    raw_data = excluded.raw_data,
    created_at = excluded.created_at,
    completed_at = NULL,
    updated_at = excluded.updated_at
`);

const getLiveIdsStmt = db.prepare(`SELECT request_id FROM requests WHERE completed_at IS NULL`);
const markCompletedStmt = db.prepare(`
  UPDATE requests SET completed_at = @completedAt, updated_at = @completedAt
  WHERE request_id = @requestId AND completed_at IS NULL
`);

// Collector-only: upserts every currently-live request, then marks any request that WAS live but
// is no longer present as completed (same disappearance-based detection the client used to do,
// now server-side). Never touches claimed_*/fueled_* columns — those are app-owned.
export function replaceLiveSnapshot(requests: RequestInsertInput[]): void {
  const now = new Date().toISOString();
  const incomingIds = new Set(requests.map((r) => r.requestId));

  const txn = db.transaction(() => {
    for (const request of requests) {
      upsertRequestStmt.run({ ...request, fuelRequested: request.fuelRequested ? 1 : 0, oilRequested: request.oilRequested ? 1 : 0, updatedAt: now });
    }

    const liveIds = getLiveIdsStmt.all() as { request_id: number }[];
    for (const { request_id: requestId } of liveIds) {
      if (!incomingIds.has(requestId)) {
        markCompletedStmt.run({ requestId, completedAt: now });
      }
    }
  });

  txn();
}

export function getLiveRequests(): FuelRequestRecord[] {
  const rows = db
    .prepare(`SELECT ${RECORD_COLUMNS} FROM requests WHERE completed_at IS NULL ORDER BY created_at ASC`)
    .all() as RequestRow[];
  return rows.map(rowToRecord);
}

export function getHistory(limit = 200): FuelRequestRecord[] {
  const rows = db
    .prepare(`SELECT ${RECORD_COLUMNS} FROM requests WHERE completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT ?`)
    .all(limit) as RequestRow[];
  return rows.map(rowToRecord);
}

export function getRequestRecord(requestId: number): FuelRequestRecord | null {
  const row = db.prepare(`SELECT ${RECORD_COLUMNS} FROM requests WHERE request_id = ?`).get(requestId) as
    | RequestRow
    | undefined;
  return row ? rowToRecord(row) : null;
}

export function requestExists(requestId: number): boolean {
  return db.prepare(`SELECT 1 FROM requests WHERE request_id = ?`).get(requestId) !== undefined;
}

const setClaimStmt = db.prepare(`
  UPDATE requests SET claimed_truck = ?, claimed_fueler = ?, claimed_at = ? WHERE request_id = ?
`);

// App-only (never called by the collector): last-write-wins, `claim === null` unclaims.
export function setClaim(requestId: number, claim: { truck: string; fueler: string } | null): void {
  const now = new Date().toISOString();
  setClaimStmt.run(claim?.truck ?? null, claim?.fueler ?? null, claim ? now : null, requestId);
}

const setFueledStmt = db.prepare(`
  UPDATE requests SET fueled_truck = ?, fueled_fueler = ?, fueled_at = ? WHERE request_id = ?
`);

// App-only, independent of setClaim — a different truck can mark something fueled than the claimant.
export function setFueled(requestId: number, fueled: { truck: string; fueler: string } | null): void {
  const now = new Date().toISOString();
  setFueledStmt.run(fueled?.truck ?? null, fueled?.fueler ?? null, fueled ? now : null, requestId);
}

export interface CollectorState {
  hasAccess: boolean;
  lastPollAt: string | null;
  lastError: string | null;
}

export function getCollectorState(): CollectorState {
  const row = db
    .prepare(`SELECT has_access, last_poll_at, last_error FROM collector_state WHERE id = 1`)
    .get() as { has_access: number; last_poll_at: string | null; last_error: string | null };
  return { hasAccess: Boolean(row.has_access), lastPollAt: row.last_poll_at, lastError: row.last_error };
}

export function setCollectorState(state: CollectorState): void {
  db.prepare(
    `UPDATE collector_state SET has_access = ?, last_poll_at = ?, last_error = ? WHERE id = 1`
  ).run(state.hasAccess ? 1 : 0, state.lastPollAt, state.lastError);
}
