"use client";

import type { FuelRequestRecord } from "@/types/fuelRequest";

export type SortOrder = "oldest" | "newest";

export function sortByCreatedAt(requests: FuelRequestRecord[], order: SortOrder): FuelRequestRecord[] {
  const direction = order === "oldest" ? 1 : -1;
  return requests.toSorted(
    (a, b) => direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  );
}

interface SortToggleProps {
  order: SortOrder;
  onChange: (order: SortOrder) => void;
  className?: string;
}

export default function SortToggle({ order, onChange, className = "" }: SortToggleProps) {
  const next = order === "oldest" ? "newest" : "oldest";
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title={`Sorted ${order} first. Click to show ${next} first.`}
      className={`flex justify-center items-center gap-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-2 py-1.5 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-600 dark:text-zinc-300 cursor-pointer ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={order === "oldest" ? "M12 5v14m0 0-5-5m5 5 5-5" : "M12 19V5m0 0-5 5m5-5 5 5"}
        />
      </svg>
      {order === "oldest" ? "Oldest first" : "Newest first"}
    </button>
  );
}
