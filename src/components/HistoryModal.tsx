"use client";

import FuelRequestItem from "@/components/FuelRequestItem";
import type { FuelRequestHistoryEntry } from "@/types/fuelRequest";

interface HistoryModalProps {
  history: FuelRequestHistoryEntry[];
  onClose: () => void;
}

export default function HistoryModal({ history, onClose }: HistoryModalProps) {
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

        {history.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No completed requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((entry) => (
              <FuelRequestItem key={entry.REQUEST_ID} request={entry} completedAt={entry.COMPLETED_AT} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
