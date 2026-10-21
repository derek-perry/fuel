"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import FuelRequestItem from "@/components/FuelRequestItem";
import SortToggle, { sortByCreatedAt, type SortOrder } from "@/components/SortToggle";
import { parseErauDate } from "@/lib/formatTime";
import { dayKeyFromDate, useFuelRequestHistoryDay, useFuelRequestHistoryDays } from "@/lib/history";
import type { RequestPatch } from "@/lib/requestActions";
import type { FuelRequestRecord } from "@/types/fuelRequest";

interface HistoryModalProps {
  myTruck: string | null;
  myFueler: string | null;
  onUpdate: (requestId: number, patch: RequestPatch) => Promise<void>;
  onClose: () => void;
}

const dayNavButtonClass =
  "flex justify-center items-center hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 border border-zinc-300 dark:border-zinc-700 rounded-md w-8 h-7 text-zinc-600 dark:text-zinc-300 disabled:cursor-not-allowed cursor-pointer";

function dayKey(value: string): string {
  const date = parseErauDate(value);
  return date ? dayKeyFromDate(date) : value;
}

function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return key;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (key === dayKeyFromDate(today)) return "Today";
  if (key === dayKeyFromDate(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() && { year: "numeric" }),
  });
}

// Dividers follow the list's sort key (createdAt) so each hour's requests stay contiguous.
function hourKey(value: string): string {
  return `${dayKey(value)}T${hourLabel(value)}`;
}

function hourLabel(value: string): string {
  const date = parseErauDate(value);
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}00`;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function DayStats({ requests }: { requests: FuelRequestRecord[] }) {
  const stats = useMemo(() => {
    const count = (predicate: (request: FuelRequestRecord) => boolean) => requests.filter(predicate).length;

    // Completion is detected by the request disappearing upstream, so this is an approximate
    // "time open" rather than an exact service time.
    const durations = requests
      .map((request) => {
        const created = parseErauDate(request.createdAt);
        const completed = request.completedAt ? new Date(request.completedAt) : null;
        return created && completed ? completed.getTime() - created.getTime() : null;
      })
      .filter((ms): ms is number => ms !== null && ms >= 0);
    const averageOpen = durations.length
      ? formatDuration(durations.reduce((sum, ms) => sum + ms, 0) / durations.length)
      : "—";

    return [
      { label: "Total", value: String(requests.length) },
      { label: "Auto", value: String(count((r) => r.requestType === "auto")) },
      { label: "Pilot", value: String(count((r) => r.requestType === "pilot")) },
      { label: "Conversion", value: String(count((r) => r.requestType === "conversion")) },
      { label: "Fuel", value: String(count((r) => r.fuelRequested)) },
      { label: "Oil", value: String(count((r) => r.oilRequested)) },
      { label: "Marked fueled", value: String(count((r) => r.fueledAt !== null)) },
      { label: "Avg time open", value: averageOpen },
    ];
  }, [requests]);

  return (
    <dl className="gap-2 grid grid-cols-2 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md"
        >
          <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function HistoryModal({ myTruck, myFueler, onUpdate, onClose }: HistoryModalProps) {
  const today = dayKeyFromDate(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const { days: serverDays } = useFuelRequestHistoryDays();
  // Today is always selectable, even before anything has completed today.
  const days = useMemo(() => {
    const keys = new Set([today, ...(serverDays ?? []).map((entry) => entry.day)]);
    return [...keys].sort((a, b) => (a < b ? 1 : -1));
  }, [serverDays, today]);

  const { history, isLoading, mutate: mutateDay } = useFuelRequestHistoryDay(selectedDay);

  // `days` is sorted newest-first; the picker may land on a day with no history, so neighbours are
  // found by comparison rather than by index.
  const oldestDay = days[days.length - 1];
  const olderDay = days.find((key) => key < selectedDay);
  const newerDay = days.findLast((key) => key > selectedDay);
  const visibleHistory = useMemo(() => sortByCreatedAt(history ?? [], sortOrder), [history, sortOrder]);

  const handleUpdate = useCallback(
    async (requestId: number, patch: RequestPatch) => {
      await onUpdate(requestId, patch);
      await mutateDay();
    },
    [onUpdate, mutateDay]
  );

  const hourCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of visibleHistory) {
      const key = hourKey(entry.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [visibleHistory]);

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="flex flex-col gap-4 bg-white dark:bg-zinc-900 shadow-md p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">History</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            title="Close history"
            className="flex justify-center items-center hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-full w-8 h-8 text-zinc-500 dark:text-zinc-400 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {days.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => olderDay && setSelectedDay(olderDay)}
              disabled={!olderDay}
              aria-label="Previous day with history"
              title="Previous day with history"
              className={dayNavButtonClass}
            >
              ‹
            </button>
            <input
              type="date"
              value={selectedDay}
              min={oldestDay}
              max={today}
              onChange={(event) => event.target.value && setSelectedDay(event.target.value)}
              aria-label="Day"
              className="bg-white dark:bg-zinc-800 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer"
            />
            <button
              type="button"
              onClick={() => newerDay && setSelectedDay(newerDay)}
              disabled={!newerDay}
              aria-label="Next day with history"
              title="Next day with history"
              className={dayNavButtonClass}
            >
              ›
            </button>
            <span className="font-medium text-zinc-500 dark:text-zinc-400 text-xs">{dayLabel(selectedDay)}</span>
            {selectedDay !== today && (
              <button
                type="button"
                onClick={() => setSelectedDay(today)}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md font-medium text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer"
              >
                Today
              </button>
            )}
          </div>
        )}

        {visibleHistory.length > 1 && (
          <SortToggle order={sortOrder} onChange={setSortOrder} className="self-start text-xs" />
        )}

        {isLoading ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading…</p>
        ) : visibleHistory.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No completed requests {selectedDay === today ? "yet today" : "this day"}.</p>
        ) : (
          <>
            <DayStats requests={visibleHistory} />
            <ul className="space-y-3">
              {visibleHistory.map((entry, index) => {
                const key = hourKey(entry.createdAt);
                const showDivider = index === 0 || key !== hourKey(visibleHistory[index - 1].createdAt);
                return (
                  <Fragment key={entry.requestId}>
                    {showDivider && (
                      <li
                        aria-hidden="true"
                        className="pt-1 font-medium text-[11px] text-zinc-400 dark:text-zinc-500 tracking-wider"
                      >
                        {hourLabel(entry.createdAt)}
                        {` · ${hourCounts.get(key)} ${hourCounts.get(key) === 1 ? "request" : "requests"}`}
                      </li>
                    )}
                    <FuelRequestItem
                      request={entry}
                      myTruck={myTruck}
                      myFueler={myFueler}
                      onUpdate={handleUpdate}
                    />
                  </Fragment>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
