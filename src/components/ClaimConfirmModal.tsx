"use client";

import { useState } from "react";
import type { Truck } from "@/types/reference";
import { findTruck } from "@/lib/identity";

interface ClaimConfirmModalProps {
  // "claimed" or "fueled" — used in the confirmation copy.
  actionLabel: string;
  currentTruck: string;
  myTruck: string;
  trucks: Truck[];
  onResolve: (newTruck: string | null) => void;
  onCancel: () => void;
}

export default function ClaimConfirmModal({
  actionLabel,
  currentTruck,
  myTruck,
  trucks,
  onResolve,
  onCancel,
}: ClaimConfirmModalProps) {
  const isMine = currentTruck === myTruck;
  const otherTrucks = trucks.filter((t) => t.number !== currentTruck);
  const [reassignTo, setReassignTo] = useState(otherTrucks[0]?.number ?? "");

  const currentLabel = findTruck(trucks, currentTruck)?.identifier ?? currentTruck;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-6" onClick={onCancel}>
      <div
        className="space-y-4 bg-white dark:bg-zinc-900 shadow-md p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-sm"
        onClick={(event) => event.stopPropagation()}
      >
        {isMine ? (
          <>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm">
              Already {actionLabel} by your truck ({currentLabel}). Unclaim, or reassign to another truck?
            </p>
            <button
              type="button"
              onClick={() => onResolve(null)}
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md w-full font-medium text-white text-sm cursor-pointer"
            >
              Unclaim
            </button>
            {otherTrucks.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={reassignTo}
                  onChange={(event) => setReassignTo(event.target.value)}
                  className="flex-1 bg-transparent px-2 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 text-sm"
                >
                  {otherTrucks.map((t) => (
                    <option key={t.number} value={t.number}>
                      {t.identifier}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onResolve(reassignTo)}
                  disabled={!reassignTo}
                  className="bg-zinc-900 dark:bg-zinc-100 disabled:opacity-50 px-3 py-2 rounded-md font-medium text-white dark:text-zinc-900 text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  Reassign
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm">
              Already {actionLabel} by {currentLabel}. Steal it for your truck ({myTruck})?
            </p>
            <button
              type="button"
              onClick={() => onResolve(myTruck)}
              className="bg-zinc-900 dark:bg-zinc-100 px-3 py-2 rounded-md w-full font-medium text-white dark:text-zinc-900 text-sm cursor-pointer"
            >
              Steal
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md w-full text-zinc-600 dark:text-zinc-300 text-sm cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
