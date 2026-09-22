"use client";

import { useState } from "react";
import { formatClockTimeFromDate } from "@/lib/formatTime";

const REFRESH_COOLDOWN_MS = 1000;

interface RefreshControlProps {
  error: boolean;
  isLoading: boolean;
  lastFetchedAt: Date | null;
  pollIntervalMs: number;
  onRefresh: () => void;
}

export default function RefreshControl({ error, isLoading, lastFetchedAt, pollIntervalMs, onRefresh }: RefreshControlProps) {
  const [disabled, setDisabled] = useState(false);

  function handleClick() {
    if (disabled) return;
    setDisabled(true);
    onRefresh();
    setTimeout(() => setDisabled(false), REFRESH_COOLDOWN_MS);
  }

  return (
    <div className="relative flex flex-row items-center gap-2 bg-white dark:bg-zinc-900 shadow-md pl-2 border border-zinc-200 dark:border-zinc-600 rounded-full overflow-hidden text-zinc-600 dark:text-zinc-300">
      {!error && !isLoading && (
        // key remounts the overlay so its fill animation restarts in lockstep with the poll interval
        <span
          key={lastFetchedAt?.getTime()}
          aria-hidden
          className="right-0 absolute inset-y-0 bg-zinc-100 dark:bg-zinc-800 animate-refresh-progress"
          style={{ animationDuration: `${pollIntervalMs}ms` }}
        />
      )}

      {error ? (
        <span className="z-10 text-red-600 dark:text-red-400 text-sm">Reconnecting…</span>
      ) : isLoading ? (
        <span className="z-10 px-1 text-zinc-500 dark:text-zinc-400 text-sm">Loading…</span>
      ) : (
        lastFetchedAt && (
          <span className="z-10 font-mono text-zinc-500 dark:text-zinc-400 text-sm">
            {formatClockTimeFromDate(lastFetchedAt)}
          </span>
        )
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title="Refresh requests"
        aria-label="Refresh requests"
        className="z-10 flex justify-center items-center bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 shadow-md border border-zinc-200 dark:border-zinc-600 rounded-full w-9 min-w-9 h-9 min-h-9 text-zinc-600 dark:text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>
  );
}
