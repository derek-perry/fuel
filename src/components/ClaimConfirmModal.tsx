"use client";

import { useState } from "react";
import IdentityPicker from "@/components/IdentityPicker";
import { findTruck } from "@/lib/identity";
import type { ClaimInfo } from "@/types/fuelRequest";
import type { Fueler, Truck } from "@/types/reference";

interface ClaimConfirmModalProps {
  // "claimed" or "fueled" — used in the copy.
  actionLabel: "claimed" | "fueled";
  current: { truck: string; fueler: string | null } | null;
  myTruck: string | null;
  myFueler: string | null;
  trucks: Truck[];
  fuelers: Fueler[];
  // `null` clears the claim/fueled mark.
  onResolve: (value: ClaimInfo | null) => void;
  onCancel: () => void;
}

export default function ClaimConfirmModal({
  actionLabel,
  current,
  myTruck,
  myFueler,
  trucks,
  fuelers,
  onResolve,
  onCancel,
}: ClaimConfirmModalProps) {
  const hasIdentity = Boolean(myTruck && myFueler);
  const isMine = Boolean(current && myTruck && current.truck === myTruck);
  const verb = actionLabel === "claimed" ? "claim" : "fueled mark";

  const [showPicker, setShowPicker] = useState(!hasIdentity);
  const [pickedTruck, setPickedTruck] = useState<string | null>(myTruck);
  const [pickedFueler, setPickedFueler] = useState<string | null>(myFueler);

  const currentTruck = current ? findTruck(trucks, current.truck) : undefined;
  const currentLabel = current ? [currentTruck?.identifier ?? current.truck, current.fueler].filter(Boolean).join(" · ") : null;
  const myLabel = [findTruck(trucks, myTruck)?.identifier ?? myTruck, myFueler].filter(Boolean).join(" · ");

  const secondaryButton =
    "bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md w-full text-zinc-600 dark:text-zinc-300 text-sm cursor-pointer";
  const primaryButton =
    "bg-zinc-900 dark:bg-zinc-100 disabled:opacity-50 px-3 py-2 rounded-md w-full font-medium text-white dark:text-zinc-900 text-sm cursor-pointer disabled:cursor-not-allowed";

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-6" onClick={onCancel}>
      <div
        className="space-y-4 bg-white dark:bg-zinc-900 shadow-md p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-sm max-h-full overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-zinc-700 dark:text-zinc-300 text-sm">
          {current ? (
            <>
              Already {actionLabel} by{" "}
              <span className="font-semibold" style={{ borderBottom: `3px solid ${currentTruck?.color ?? "#71717a"}` }}>
                {currentLabel}
              </span>
              {isMine ? " (you)." : "."}
            </>
          ) : (
            <>Not {actionLabel} yet. Pick who is {actionLabel === "claimed" ? "claiming" : "fueling"} it.</>
          )}
        </p>

        {current && !isMine && hasIdentity && myTruck && myFueler && (
          <button type="button" onClick={() => onResolve({ truck: myTruck, fueler: myFueler })} className={primaryButton}>
            Steal for me ({myLabel})
          </button>
        )}

        {current && (
          <button
            type="button"
            onClick={() => onResolve(null)}
            className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md w-full font-medium text-white text-sm cursor-pointer"
          >
            Remove {verb}
          </button>
        )}

        {showPicker ? (
          <div className="space-y-4 pt-2">
            <IdentityPicker
              required
              trucks={trucks}
              fuelers={fuelers}
              myTruck={pickedTruck}
              myFueler={pickedFueler}
              onChangeTruck={setPickedTruck}
              onChangeFueler={setPickedFueler}
            />
            <button
              type="button"
              disabled={!pickedTruck || !pickedFueler}
              onClick={() => pickedTruck && pickedFueler && onResolve({ truck: pickedTruck, fueler: pickedFueler })}
              className={primaryButton}
            >
              {current ? "Change" : actionLabel === "claimed" ? "Claim" : "Mark fueled"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowPicker(true)} className={secondaryButton}>
            {current ? `Change ${actionLabel === "claimed" ? "claimer" : "fueler"}…` : "Choose truck and name…"}
          </button>
        )}

        <button type="button" onClick={onCancel} className={secondaryButton}>
          Nevermind
        </button>
      </div>
    </div>
  );
}
