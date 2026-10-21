"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { FuelRequestRecord } from "@/types/fuelRequest";

export interface HistoryDay {
  day: string;
  count: number;
}

interface HistoryDaysResponse {
  days: HistoryDay[];
}

interface HistoryResponse {
  history: FuelRequestRecord[];
}

// History is collected server-side by the always-on collector (see src/collector/run.ts) and
// stored in SQLite. To keep network traffic down, the client first loads only the list of days
// that have completions, then fetches the requests for a single selected day on demand.

// Today's list changes as requests complete, so keep it fresh while the modal is open.
const TODAY_REFRESH_MS = 10000;

export function dayKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDayRange(day: string): { from: string; to: string } {
  const [year, month, date] = day.split("-").map(Number);
  return {
    from: new Date(year, month - 1, date).toISOString(),
    to: new Date(year, month - 1, date + 1).toISOString(),
  };
}

export function useFuelRequestHistoryDays() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, mutate } = useSWR<HistoryDaysResponse>(
    `/api/erau/history?tz=${encodeURIComponent(timeZone)}`,
    fetcher
  );
  return { days: data?.days, mutate };
}

export function useFuelRequestHistoryDay(day: string) {
  const { from, to } = localDayRange(day);
  const { data, isLoading, mutate } = useSWR<HistoryResponse>(
    `/api/erau/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    fetcher,
    { refreshInterval: day === dayKeyFromDate(new Date()) ? TODAY_REFRESH_MS : 0 }
  );
  return { history: data?.history, isLoading, mutate };
}

