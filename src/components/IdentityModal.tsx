"use client";

import IdentityPicker from "@/components/IdentityPicker";
import type { Truck, Fueler } from "@/types/reference";

interface IdentityModalProps {
  trucks: Truck[];
  fuelers: Fueler[];
  myTruck: string | null;
  myFueler: string | null;
  onChangeTruck: (truck: string | null) => void;
  onChangeFueler: (fueler: string | null) => void;
  onClose: () => void;
}

export default function IdentityModal({
  trucks,
  fuelers,
  myTruck,
  myFueler,
  onChangeTruck,
  onChangeFueler,
  onClose,
}: IdentityModalProps) {
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="space-y-8 bg-white dark:bg-zinc-900 shadow-md p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Who are you?</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="flex justify-center items-center hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-full w-8 h-8 text-zinc-500 dark:text-zinc-400 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <IdentityPicker
          trucks={trucks}
          fuelers={fuelers}
          myTruck={myTruck}
          myFueler={myFueler}
          onChangeTruck={onChangeTruck}
          onChangeFueler={onChangeFueler}
        />

        <button
          type="button"
          onClick={onClose}
          className="bg-zinc-900 dark:bg-zinc-100 px-3 py-2 rounded-md w-full font-medium text-white dark:text-zinc-900 text-sm cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
