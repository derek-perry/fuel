"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { formatClockTime, formatElapsedTime, isElapsedTimeOverFiveMinutes, formatClockDate } from "@/lib/formatTime";
import { findTruck } from "@/lib/identity";
import ClaimConfirmModal from "@/components/ClaimConfirmModal";
import trucks from "@/data/trucks.json";
import fuelers from "@/data/fuelers.json";
import type { ClaimInfo, FuelRequestRecord } from "@/types/fuelRequest";
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

// Light truck colors (yellow, pink, white) need dark text to stay readable.
function solidColorStyle(color: string | undefined) {
  const backgroundColor = color ?? "#71717a";
  return { backgroundColor, color: readableTextColor(backgroundColor) };
}

function readableTextColor(hex: string): string {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return "#ffffff";
  const [r, g, b] = match.slice(1).map((c) => parseInt(c, 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#18181b" : "#ffffff";
}

type PendingAction = "claim" | "fueled" | null;

export default function FuelRequestItem({ request, myTruck, myFueler, onUpdate }: FuelRequestItemProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const isAutoRequest = request.requestType === "auto";
  const isConversion = request.requestType === "conversion";
  const completedAt = request.completedAt ?? undefined;
  const resourceModelCleaned =
    request.planeType === "DA42 NG" ? "Diamond" : request.planeType === "172S NAV III" ? "Cessna" : request.planeType;

  // Acting with a full identity on an unheld mark is one click; anything else needs the modal.
  function handleClaimClick() {
    if (!request.claimedTruck && myTruck && myFueler) {
      onUpdate(request.requestId, { claim: { truck: myTruck, fueler: myFueler } });
      return;
    }
    setPendingAction("claim");
  }

  function handleFueledClick() {
    if (!request.fueledTruck && myTruck && myFueler) {
      onUpdate(request.requestId, { fueled: { truck: myTruck, fueler: myFueler } });
      return;
    }
    setPendingAction("fueled");
  }

  function handleModalResolve(value: ClaimInfo | null) {
    if (!pendingAction) return;
    onUpdate(request.requestId, pendingAction === "claim" ? { claim: value } : { fueled: value });
    setPendingAction(null);
  }

  const pendingCurrent =
    pendingAction === "claim" && request.claimedTruck
      ? { truck: request.claimedTruck, fueler: request.claimedFueler }
      : pendingAction === "fueled" && request.fueledTruck
      ? { truck: request.fueledTruck, fueler: request.fueledFueler }
      : null;
  const typeClasses = isConversion
    ? "bg-red-100/40 dark:bg-red-900/30 border-red-100 dark:border-red-900/40"
    : isAutoRequest
    ? "bg-green-100/40 dark:bg-green-900/30 border-green-100 dark:border-green-900/40"
    : "bg-amber-100/60 dark:bg-amber-900/30 border-amber-100 dark:border-amber-900/40";

  const claimTruck = request.claimedTruck ? findTruck(trucks, request.claimedTruck) : null;
  const fueledTruck = request.fueledTruck ? findTruck(trucks, request.fueledTruck) : null;

  const sideButtonClasses =
    "flex flex-col justify-center items-center gap-0.5 px-0.5 w-14 @2xl:w-16 shrink-0 font-semibold text-[11px] @2xl:text-xs text-center leading-tight transition-colors cursor-pointer";
  const idleSideButtonClasses =
    "bg-white/70 hover:bg-white dark:bg-zinc-800/70 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300";

  const timeClasses = `flex flex-col items-baseline @2xl:items-end gap-x-1.5 justify-self-end bg-zinc-200/70 dark:bg-zinc-800/60 shadow-sm px-1.5 py-0.5 rounded-md font-mono font-medium text-xs leading-tight whitespace-nowrap ${
    completedAt
      ? "col-span-2 row-start-3 @2xl:col-span-1 @2xl:row-start-1 @2xl:col-start-3"
      : "col-start-2 row-start-1 @2xl:col-start-3"
  } ${
    !completedAt && isElapsedTimeOverFiveMinutes(request.createdAt)
      ? "animate-pulse text-red-700 dark:text-red-400 border border-red-700 dark:border-red-400"
      : "text-zinc-600 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-800/60"
  }`;

  return (
    <li className={`@container flex flex-row items-stretch shadow-md border rounded-md overflow-hidden ${typeClasses}`}>
      <button
        type="button"
        onClick={handleClaimClick}
        aria-label={request.claimedTruck ? `Claimed by ${claimTruck?.identifier ?? request.claimedTruck}` : "Claim"}
        className={`${sideButtonClasses} ${request.claimedTruck ? "" : idleSideButtonClasses}`}
        style={request.claimedTruck ? solidColorStyle(claimTruck?.color) : undefined}
      >
        <span>{request.claimedTruck ? "Claimed" : "Claim"}</span>
        {request.claimedTruck && (
          <span className="font-mono font-bold text-sm @2xl:text-base">{claimTruck?.identifier ?? request.claimedTruck}</span>
        )}
      </button>

      <div className="@max-[22rem]:flex @max-[22rem]:flex-col flex-1 items-center @max-[22rem]:items-center gap-x-3 gap-y-1 grid grid-cols-[minmax(0,1fr)_auto] @2xl:grid-cols-[auto_minmax(0,1fr)_auto_auto] px-2.5 @2xl:px-3 py-1.5 min-w-0">
        <span className="flex flex-row items-center gap-2 col-start-1 row-start-1 text-zinc-900 dark:text-zinc-100">
          <span className="font-mono font-medium text-lg @2xl:text-xl">{request.tailNumber}</span>
          {/* <span className={
            request.planeType === "DA42 NG" ?
            "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md border border-blue-500/30 text-zinc-600 dark:text-zinc-400 text-xs shadow-sm min-w-16.75 text-center"
            : request.planeType === "172S NAV III" ?
            "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400 border border-red-500/30 text-xs shadow-sm min-w-16.75 text-center"
            : "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400 text-xs shadow-sm min-w-16.75 text-center"
          }>{resourceModelCleaned}</span> */}
        </span>

        <div className="flex @2xl:flex-row flex-col items-start @2xl:items-center @max-[22rem]:items-center gap-x-3 gap-y-0.5 col-start-1 @2xl:col-start-2 row-start-2 @2xl:row-start-1 font-medium text-zinc-600 dark:text-zinc-200 text-base">
          <span className="bg-white dark:bg-zinc-800 shadow-sm px-2 py-0.5 border border-zinc-300 dark:border-zinc-600 rounded-md min-w-16.5 font-mono font-bold text-center">{request.parkingSpot ? (request.parkingSpot == "Visitor Spot" ? "Visit" : request.parkingSpot) : ""}</span>
          <div className="flex @2xl:flex-row flex-col items-start @2xl:items-center gap-x-3 gap-y-0.5">
            {request.fuelAmountType ? (
              <span className="flex flex-row items-center gap-1">
                <FuelIcon service={request.fuelAmountType} customAmount={request.fuelAmount ?? undefined} />
                {request.fuelAmountType}
                {request.fuelAmount ? ` (${request.fuelAmount})` : ""}
              </span>
            ) : null}
            {request.oilRequested ? (
              <span className="flex flex-row items-center gap-1">
                <OilIcon />
                <span>Oil</span>
              </span>
            ) : null}
          </div>
        </div>

        <span className={timeClasses}>
          {completedAt ? (
            <div className="flex flex-col justify-end items-end @max-[22rem]:items-start gap-1 @max-[22rem]:text-left text-right">
              <span>Completed {formatClockTime(completedAt)}</span>
              <span>Created {formatClockTime(request.createdAt)}<br />{formatClockDate(request.createdAt)}</span>
            </div>
          ) : (
            <>
              <span>{formatElapsedTime(request.createdAt)}</span>
              <span>{formatClockTime(request.createdAt)}</span>
            </>
          )}
        </span>

        <span
          className={`col-start-2 row-start-2 @2xl:row-start-1 @2xl:col-start-4 justify-self-end whitespace-nowrap min-w-17.5 text-center rounded-full px-2 py-0.5 text-sm font-semibold shadow-sm ${
            isConversion
              ? "bg-red-200 text-red-700 dark:bg-red-900/80 dark:text-red-300"
              : isAutoRequest
              ? "bg-green-200 text-green-700 dark:bg-green-900/80 dark:text-green-300"
              : "bg-amber-200 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300"
          }`}
        >
          {isConversion ? "Convert" : isAutoRequest ? "Auto" : "Pilot"}
        </span>
      </div>

      <button
        type="button"
        onClick={handleFueledClick}
        aria-label={request.fueledTruck ? `Fueled by ${fueledTruck?.identifier ?? request.fueledTruck}` : "Mark fueled"}
        className={`${sideButtonClasses} ${request.fueledTruck ? "" : idleSideButtonClasses}`}
        style={request.fueledTruck ? solidColorStyle(fueledTruck?.color) : undefined}
      >
        <span>{request.fueledTruck ? "Fueled" : "Mark fueled"}</span>
        {request.fueledTruck && (
          <span className="font-mono font-bold text-sm @2xl:text-base">{fueledTruck?.identifier ?? request.fueledTruck}</span>
        )}
      </button>

      {pendingAction &&
        createPortal(
          <ClaimConfirmModal
            actionLabel={pendingAction === "claim" ? "claimed" : "fueled"}
            current={pendingCurrent}
            myTruck={myTruck}
            myFueler={myFueler}
            trucks={trucks}
            fuelers={fuelers}
            onResolve={handleModalResolve}
            onCancel={() => setPendingAction(null)}
          />,
          document.body,
        )}    </li>
  );
}
