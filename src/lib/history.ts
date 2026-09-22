"use client";

import { useEffect, useState } from "react";
import type { FuelRequestHistoryEntry, FuelRequestSummary } from "@/types/fuelRequest";

const HISTORY_STORAGE_KEY = "fuel:history";
const SNAPSHOT_STORAGE_KEY = "fuel:lastKnownRequests";
const MAX_HISTORY_ENTRIES = 200;

function toSummary(request: FuelRequestSummary): FuelRequestSummary {
  return {
    REQUEST_ID: request.REQUEST_ID,
    DATE_CREATED: request.DATE_CREATED,
    INITIATOR: { USER_ID: request.INITIATOR.USER_ID },
    ACTIVITY: request.ACTIVITY,
    RESOURCE: { NAME: request.RESOURCE.NAME, MODEL: request.RESOURCE.MODEL },
    DETAILS: {
      OIL: request.DETAILS.OIL,
      PARKING_SPOT: { NAME: request.DETAILS.PARKING_SPOT.NAME },
      THIRD_PARTY_DATA: {
        REQUESTED_SERVICE: request.DETAILS.THIRD_PARTY_DATA.REQUESTED_SERVICE,
        REQUESTED_AMOUNT: request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT,
      },
    },
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded, etc.) — history is best-effort.
  }
}

/**
 * Tracks requests that have disappeared from the live upstream feed (completed/cancelled/etc),
 * since upstream provides no history endpoint. Each time a new request list comes in, it's
 * diffed against the last known snapshot (persisted so a page refresh between polls doesn't
 * lose it) and any REQUEST_ID that's gone missing is moved into history exactly once.
 */
export function useFuelRequestHistory(requests: FuelRequestSummary[] | undefined) {
  const [history, setHistory] = useState<FuelRequestHistoryEntry[]>(() => readJson(HISTORY_STORAGE_KEY, []));

  useEffect(() => {
    if (!requests) return;

    const previousSnapshot = readJson<FuelRequestSummary[]>(SNAPSHOT_STORAGE_KEY, []);
    const currentIds = new Set(requests.map((request) => request.REQUEST_ID));
    const removed = previousSnapshot.filter((request) => !currentIds.has(request.REQUEST_ID));

    if (removed.length > 0) {
      setHistory((prev) => {
        const knownIds = new Set(prev.map((entry) => entry.REQUEST_ID));
        const newEntries = removed
          .filter((request) => !knownIds.has(request.REQUEST_ID))
          .map((request) => ({ ...toSummary(request), COMPLETED_AT: new Date().toISOString() }));

        if (newEntries.length === 0) return prev;

        const next = [...newEntries, ...prev].slice(0, MAX_HISTORY_ENTRIES);
        writeJson(HISTORY_STORAGE_KEY, next);
        return next;
      });
    }

    writeJson(SNAPSHOT_STORAGE_KEY, requests.map(toSummary));
  }, [requests]);

  return history;
}
