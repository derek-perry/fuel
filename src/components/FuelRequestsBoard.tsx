"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { formatRelativeTime } from "@/lib/formatTime";
import type { FuelRequest } from "@/types/fuelRequest";

interface RequestsResponse {
  hasAccess: boolean;
  requests: FuelRequest[];
}

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 10000);

interface FuelRequestsBoardProps {
  onAccessLost: () => void;
}

export default function FuelRequestsBoard({ onAccessLost }: FuelRequestsBoardProps) {
  const { data, error, isLoading } = useSWR<RequestsResponse>("/api/erau/requests", fetcher, {
    refreshInterval: POLL_INTERVAL_MS,
    onSuccess: (payload) => {
      if (!payload.hasAccess) onAccessLost();
    },
  });

  return (
    <div className="flex-1 mx-auto p-6 w-full max-w-3xl">
      <header className="flex justify-between items-center mb-4">
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50 text-lg">Fueler Dashboard</h1>
        {error && <span className="text-red-600 dark:text-red-400 text-sm">Reconnecting…</span>}
      </header>

      {isLoading && <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading…</p>}

      {data && data.requests.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No pending fuel requests.</p>
      )}

      <ul className="space-y-3">
        {data?.requests.map((request) => (
          <li
            key={request.REQUEST_ID}
            className="bg-white dark:bg-zinc-900 shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg"
          >
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                {request.RESOURCE.NAME} ({request.RESOURCE.MODEL})
                <span
                  className={
                    request.INITIATOR.USER_ID === 2
                      ? "rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }
                >
                  {request.INITIATOR.USER_ID === 2 ? "Automated" : "Pilot"}
                </span>
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                {formatRelativeTime(request.DATE_CREATED)}
              </span>
            </div>
            <div className="mt-1 text-zinc-600 dark:text-zinc-200 text-lg">
              {request.DETAILS.PARKING_SPOT.NAME}<br />{request.DETAILS.THIRD_PARTY_DATA.REQUESTED_SERVICE}
              {request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT
                ? ` (${request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT})`
                : ""}
              {request.DETAILS.OIL ? " · Oil requested" : ""}
            </div>
            {/* <div className="mt-1 text-zinc-400 text-xs">Status {request.STATUS_ID}</div> */}
          </li>
        ))}
      </ul>
    </div>
  );
}
