"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { FuelRequestRecord } from "@/types/fuelRequest";

interface HistoryResponse {
  history: FuelRequestRecord[];
}

// History is now collected server-side by the always-on collector (see src/collector/run.ts) and
// stored in SQLite, so it's no longer lost just because no browser tab was open when a request
// completed. This hook is just a thin SWR read — `mutate` is returned so callers (claim/fuel
// actions) can trigger a refetch after a PATCH.
export function useFuelRequestHistory(limit?: number) {
  const { data, mutate } = useSWR<HistoryResponse>(
    `/api/erau/history${limit ? `?limit=${limit}` : ""}`,
    fetcher
  );

  return { history: data?.history ?? [], mutate };
}

