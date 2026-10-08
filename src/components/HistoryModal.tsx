"use client";

import { Fragment, useMemo, useState } from "react";
import FuelRequestItem from "@/components/FuelRequestItem";
import SortToggle, { sortByCreatedAt, type SortOrder } from "@/components/SortToggle";
import type { FuelRequestRecord } from "@/types/fuelRequest";
import type { RequestPatch } from "@/lib/requestActions";

interface HistoryModalProps {
  history: FuelRequestRecord[];
  myTruck: string | null;
  myFueler: string | null;
  onUpdate: (requestId: number, patch: RequestPatch) => void;
  onClose: () => void;
}

// Beyond this many distinct days, a button row would wrap excessively — switch to a dropdown.
const MAX_DAY_BUTTONS = 6;

// Local (not UTC) day key so entries group by the day the user actually sees them completed on.
function dayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date.toISOString()) === dayKey(today.toISOString())) return "Today";
  if (dayKey(date.toISOString()) === dayKey(yesterday.toISOString())) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Dividers follow the list's sort key (createdAt) so each hour's requests stay contiguous.
function hourKey(value: string): string {
  return `${dayKey(value)}T${hourLabel(value)}`;
}

function hourLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}00`;
}

export default function HistoryModal({ history, myTruck, myFueler, onUpdate, onClose }: HistoryModalProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const days = useMemo(() => {
    const keys = new Set(history.map((entry) => dayKey(entry.completedAt ?? entry.createdAt)));
    return [...keys].sort((a, b) => (a < b ? 1 : -1));
  }, [history]);

  const visibleHistory = useMemo(() => {
    const filtered = selectedDay
      ? history.filter((entry) => dayKey(entry.completedAt ?? entry.createdAt) === selectedDay)
      : history;
    return sortByCreatedAt(filtered, sortOrder);
  }, [history, selectedDay, sortOrder]);

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
          days.length > MAX_DAY_BUTTONS ? (
            <select
              value={selectedDay ?? "all"}
              onChange={(event) => setSelectedDay(event.target.value === "all" ? null : event.target.value)}
              className="bg-white dark:bg-zinc-800 px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md w-fit font-medium text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer"
            >
              <option value="all">All days</option>
              {days.map((key) => (
                <option key={key} value={key}>
                  {dayLabel(key)}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer ${
                  selectedDay === null
                    ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900"
                    : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                All
              </button>
              {days.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer ${
                    selectedDay === key
                      ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900"
                      : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {dayLabel(key)}
                </button>
              ))}
            </div>
          )
        )}

        {visibleHistory.length > 1 && (
          <SortToggle order={sortOrder} onChange={setSortOrder} className="self-start text-xs" />
        )}

        {visibleHistory.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No completed requests yet.</p>
        ) : (
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
                      {selectedDay ? "" : `${dayLabel(dayKey(entry.createdAt))} · `}
                      {hourLabel(entry.createdAt)}
                      {` · ${hourCounts.get(key)} ${hourCounts.get(key) === 1 ? "request" : "requests"}`}
                    </li>
                  )}
                  <FuelRequestItem
                    request={entry}
                    myTruck={myTruck}
                    myFueler={myFueler}
                    onUpdate={onUpdate}
                  />
                </Fragment>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
