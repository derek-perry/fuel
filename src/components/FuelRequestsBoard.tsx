"use client";

import { useState } from "react";
import useSWR from "swr";
import FuelRequestItem from "@/components/FuelRequestItem";
import RefreshControl from "@/components/RefreshControl";
import ThemeToggle from "@/components/ThemeToggle";
import { fetcher } from "@/lib/fetcher";
import type { FuelRequest } from "@/types/fuelRequest";

interface RequestsResponse {
  hasAccess: boolean;
  requests: FuelRequest[];
}

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 3000);

interface FuelRequestsBoardProps {
  onAccessLost: () => void;
}

export default function FuelRequestsBoard({ onAccessLost }: FuelRequestsBoardProps) {
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const { data, error, isLoading, mutate } = useSWR<RequestsResponse>("/api/erau/requests", fetcher, {
    refreshInterval: POLL_INTERVAL_MS,
    onSuccess: (payload) => {
      setLastFetchedAt(new Date());
      if (!payload.hasAccess) onAccessLost();
    },
    onError: () => {
      setLastFetchedAt(new Date());
    },
  });

  const requests = data?.requests.toSorted((a, b) =>
    new Date(a.DATE_CREATED).getTime() - new Date(b.DATE_CREATED).getTime(),
  );

  return (
    <div className="flex flex-col flex-1 gap-4 mx-auto p-6 w-full max-w-3xl">
      <header className="flex flex-row justify-between max-[342px]:justify-center items-center gap-4">
        <h1 className="max-[342px]:hidden font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Fueler Dashboard</h1>

        <div className="flex flex-row items-center gap-6">
          <RefreshControl error={!!error} isLoading={isLoading} lastFetchedAt={lastFetchedAt} onRefresh={() => mutate()} />

          <ThemeToggle />
        </div>
      </header>

      {data && data.requests.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No pending fuel requests.</p>
      )}

      <ul className="space-y-3">
        {requests?.map((request) => <FuelRequestItem key={request.REQUEST_ID} request={request} />)}
      </ul>
    </div>
  );
}
