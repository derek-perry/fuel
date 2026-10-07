"use client";

import { useState } from "react";
import { formatClockTime, formatElapsedTime, isElapsedTimeOverFiveMinutes, formatClockDate } from "@/lib/formatTime";
import { findTruck } from "@/lib/identity";
import ClaimConfirmModal from "@/components/ClaimConfirmModal";
import trucks from "@/data/trucks.json";
import type { FuelRequestRecord } from "@/types/fuelRequest";
import type { RequestPatch } from "@/lib/requestActions";

interface FuelRequestItemProps {
  request: FuelRequestRecord;
  myTruck: string | null;
  myFueler: string | null;
  onUpdate: (requestId: number, patch: RequestPatch) => void;
}

function FuelIcon({ service, customAmount }: { service: string; customAmount?: string }) {
  const normalizedService = service.toLowerCase();
  const isTopOff = normalizedService.includes("top off");
  const isFillToTabs = normalizedService.includes("fill to tabs");

  return (
    <svg
      aria-hidden="true"
      className="size-5 text-zinc-600 dark:text-zinc-400 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21H5V4.5Z" stroke="currentColor" strokeWidth="1.8" />
      {((isTopOff || isFillToTabs) && !customAmount) ? (
        <rect
          fill="currentColor"
          height={isTopOff ? 14 : 6}
          rx="0.5"
          width="6"
          x="7"
          y={isTopOff ? 5.5 : 13}
        />
      ) : (
        <>
          <path d="m13.5 11.5-6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      )}
    </svg>
  );
}

function OilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 text-zinc-600 dark:text-zinc-400 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2.5S5.5 10.1 5.5 14.2a6.5 6.5 0 0 0 13 0C18.5 10.1 12 2.5 12 2.5Zm0 15.8a3.9 3.9 0 0 1-3.9-3.9c0-1.5 1.9-4.4 3.9-7.1 2 2.7 3.9 5.6 3.9 7.1a3.9 3.9 0 0 1-3.9 3.9Z" />
    </svg>
  );
}

// Small badge showing which truck holds a claim/fueled mark, colored per src/data/trucks.json.
function HolderBadge({ label, truckNumber }: { label: string; truckNumber: string }) {
  const truck = findTruck(trucks, truckNumber);
  return (
    <span
      className="shadow-sm px-2 py-0.5 rounded-md font-medium text-white text-xs"
      style={{ backgroundColor: truck?.color ?? "#71717a" }}
    >
      {label}: {truck?.identifier ?? truckNumber}
    </span>
  );
}

type PendingAction = { kind: "claim" | "fueled"; currentTruck: string } | null;

export default function FuelRequestItem({ request, myTruck, myFueler, onUpdate }: FuelRequestItemProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const isAutoRequest = request.requestType === "auto";
  const isConversion = request.requestType === "conversion";
  const completedAt = request.completedAt ?? undefined;
  const resourceModelCleaned =
    request.planeType === "DA42 NG" ? "Diamond" : request.planeType === "172S NAV III" ? "Cessna" : request.planeType;

  const canAct = Boolean(myTruck && myFueler);

  function handleClaimClick() {
    if (!myTruck || !myFueler) return;
    if (!request.claimedTruck) {
      onUpdate(request.requestId, { claim: { truck: myTruck, fueler: myFueler } });
      return;
    }
    setPendingAction({ kind: "claim", currentTruck: request.claimedTruck });
  }

  function handleFueledClick() {
    if (!myTruck || !myFueler) return;
    if (!request.fueledTruck) {
      onUpdate(request.requestId, { fueled: { truck: myTruck, fueler: myFueler } });
      return;
    }
    setPendingAction({ kind: "fueled", currentTruck: request.fueledTruck });
  }

  function handleModalResolve(newTruck: string | null) {
    if (!pendingAction || !myFueler) return;
    const value = newTruck ? { truck: newTruck, fueler: myFueler } : null;
    onUpdate(request.requestId, pendingAction.kind === "claim" ? { claim: value } : { fueled: value });
    setPendingAction(null);
  }

  return (
    <li
      className={
        isConversion
          ? "flex flex-row justify-between items-center bg-red-100/40 dark:bg-red-900/30 shadow-md p-4 border border-red-100 dark:border-red-900/40 rounded-md"
          : isAutoRequest
          ? "flex flex-row justify-between items-center bg-green-100/40 dark:bg-green-900/30 shadow-md p-4 border border-green-100 dark:border-green-900/40 rounded-md"
          : "flex flex-row justify-between items-center bg-amber-100/60 dark:bg-amber-900/30 shadow-md p-4 border border-amber-100 dark:border-amber-900/40 rounded-md"
      }
    >
      <div className="flex flex-col justify-center items-start gap-2">
        <span className={
          completedAt ? "flex flex-row max-[480px]:flex-col items-center gap-2 text-zinc-900 dark:text-zinc-100" : "flex flex-row max-[349px]:flex-col items-center gap-2 text-zinc-900 dark:text-zinc-100"
        }>
          <span className="font-mono font-medium text-xl">{request.tailNumber}</span>
          <span className={
            request.planeType === "DA42 NG" ?
            "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md border border-blue-500/30 text-zinc-600 dark:text-zinc-400 text-xs shadow-sm"
            : request.planeType === "172S NAV III" ?
            "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400 border border-red-500/30 text-xs shadow-sm"
            : "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400 text-xs shadow-sm"
          }>{resourceModelCleaned}</span>
        </span>
        <div className="flex flex-col justify-start items-start gap-2 font-medium text-zinc-600 dark:text-zinc-200 text-xl">
          <span className="bg-white dark:bg-zinc-800 shadow-sm px-3.5 py-1 border border-zinc-300 dark:border-zinc-600 rounded-md font-mono font-bold">{request.parkingSpot}</span>
          <span className="flex flex-col items-start gap-x-1 gap-y-1">
            {request.fuelAmountType ? <span className="flex flex-row items-center gap-1"><FuelIcon service={request.fuelAmountType} customAmount={request.fuelAmount ?? undefined} />
            {request.fuelAmountType}
              {request.fuelAmount
                ? ` (${request.fuelAmount})`
                : ""}</span> : null}
            {request.oilRequested ? <span className="flex flex-row items-center gap-1"><OilIcon /><span>Oil</span></span> : null}
          </span>
          <div className="flex flex-row flex-wrap items-center gap-2 text-sm">
            {request.claimedTruck && <HolderBadge label="Claimed" truckNumber={request.claimedTruck} />}
            {request.fueledTruck && <HolderBadge label="Fueled" truckNumber={request.fueledTruck} />}
            <button
              type="button"
              onClick={handleClaimClick}
              disabled={!canAct}
              title={canAct ? undefined : "Select your truck and name first"}
              className="bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-40 px-2 py-0.5 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {request.claimedTruck ? "Claimed" : "Claim"}
            </button>
            <button
              type="button"
              onClick={handleFueledClick}
              disabled={!canAct}
              title={canAct ? undefined : "Select your truck and name first"}
              className="bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-40 px-2 py-0.5 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {request.fueledTruck ? "Fueled" : "Mark fueled"}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-start items-end self-stretch gap-4">
        <span
          className={`bg-zinc-200/70 dark:bg-zinc-800/60 shadow-sm px-2 py-0.5 rounded-md font-mono font-medium text-sm text-right leading-relaxed whitespace-nowrap ${
            !completedAt && isElapsedTimeOverFiveMinutes(request.createdAt)
              ? "animate-pulse text-red-700 dark:text-red-400 border border-red-700 dark:border-red-400"
              : "text-zinc-600 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-800/60"
          }`}
        >
          {completedAt ? (
            <>
              Completed {formatClockTime(completedAt)}
              <br />
              Created {formatClockTime(request.createdAt)}
              <br />
              {formatClockDate(request.createdAt)}
            </>
          ) : (
            <>
              {formatElapsedTime(request.createdAt)}
              <br />
              {formatClockTime(request.createdAt)}
            </>
          )}
        </span>
        <span
          className={
            isConversion
              ? "rounded-full bg-red-200 px-2 py-0.5 text-md font-semibold text-red-700 dark:bg-red-900/80 dark:text-red-300 shadow-sm"
              : isAutoRequest
              ? "rounded-full bg-green-200 px-2 py-0.5 text-md font-semibold text-green-700 dark:bg-green-900/80 dark:text-green-300 shadow-sm"
              : "rounded-full bg-amber-200 px-2 py-0.5 text-md font-semibold text-amber-700 dark:bg-amber-900/80 dark:text-amber-300 shadow-sm"
          }
        >
          {isConversion ? "Conversion" : isAutoRequest ? "Auto" : "Pilot"}
        </span>
      </div>

      {pendingAction && myTruck && (
        <ClaimConfirmModal
          actionLabel={pendingAction.kind === "claim" ? "claimed" : "fueled"}
          currentTruck={pendingAction.currentTruck}
          myTruck={myTruck}
          trucks={trucks}
          onResolve={handleModalResolve}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </li>
  );
}