"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import FuelRequestItem from "@/components/FuelRequestItem";
import HistoryModal from "@/components/HistoryModal";
import RefreshControl from "@/components/RefreshControl";
import ThemeToggle from "@/components/ThemeToggle";
import IdentitySelector from "@/components/IdentitySelector";
import { fetcher } from "@/lib/fetcher";
import { useFuelRequestHistory } from "@/lib/history";
import { useIdentity } from "@/lib/identity";
import { patchRequest, type RequestPatch } from "@/lib/requestActions";
import trucks from "@/data/trucks.json";
import fuelers from "@/data/fuelers.json";
import type { FuelRequestRecord } from "@/types/fuelRequest";

interface RequestsResponse {
  hasAccess: boolean;
  requests: FuelRequestRecord[];
}

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 3000);

interface FuelRequestsBoardProps {
  onAccessLost: () => void;
}

export default function FuelRequestsBoard({ onAccessLost }: FuelRequestsBoardProps) {
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { myTruck, myFueler, setMyTruck, setMyFueler } = useIdentity();
  const { data, error, isLoading, isValidating, mutate } = useSWR<RequestsResponse>("/api/erau/requests", fetcher, {
    onSuccess: (payload) => {
      setLastFetchedAt(new Date());
      if (!payload.hasAccess) onAccessLost();
    },
    onError: () => {
      setLastFetchedAt(new Date());
    },
  });

  // Schedule the next poll ourselves so a manual refresh resets the interval instead of
  // racing against SWR's own refreshInterval timer, which manual mutate() calls don't reset.
  useEffect(() => {
    if (lastFetchedAt === null) return;
    const timer = setTimeout(() => mutate(), POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [lastFetchedAt, mutate]);

  const requests = data?.requests.toSorted((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const { history, mutate: mutateHistory } = useFuelRequestHistory();

  const handleUpdate = useCallback(
    async (requestId: number, patch: RequestPatch) => {
      await patchRequest(requestId, patch);
      mutate();
      mutateHistory();
    },
    [mutate, mutateHistory]
  );

  return (
    <main className="flex flex-col flex-1 gap-4 mx-auto p-6 w-full max-w-3xl">
      <header className="flex flex-row justify-between max-[370px]:justify-center items-center gap-4">
        <h1 className="max-[370px]:hidden font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Fueler Dashboard{requests?.length ? ` (${requests.length})` : ""}</h1>

        <div className="flex flex-row items-center gap-6">
          <IdentitySelector
            trucks={trucks}
            fuelers={fuelers}
            myTruck={myTruck}
            myFueler={myFueler}
            onChangeTruck={setMyTruck}
            onChangeFueler={setMyFueler}
          />

          <RefreshControl
            error={!!error}
            isLoading={isLoading || isValidating}
            lastFetchedAt={lastFetchedAt}
            pollIntervalMs={POLL_INTERVAL_MS}
            onRefresh={() => mutate()}
          />

          <ThemeToggle />
        </div>
      </header>

      {data && data.requests.length === 0 ? (
        <div className="flex flex-col justify-center items-center gap-2 space-y-4 bg-white dark:bg-zinc-900 shadow-md p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full">
          <p className="text-zinc-500 dark:text-zinc-400 text-xl">No pending fuel requests.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests?.map((request) => (
            <FuelRequestItem
              key={request.requestId}
              request={request}
              myTruck={myTruck}
              myFueler={myFueler}
              onUpdate={handleUpdate}
            />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setShowHistory(true)}
        className="self-end bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 shadow-md px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-full text-zinc-600 dark:text-zinc-300 text-sm cursor-pointer"
      >
        History{history.length > 0 ? ` (${history.length})` : ""}
      </button>

      {showHistory && (
        <HistoryModal
          history={history}
          myTruck={myTruck}
          myFueler={myFueler}
          onUpdate={handleUpdate}
          onClose={() => setShowHistory(false)}
        />
      )}
    </main>
  );
}
