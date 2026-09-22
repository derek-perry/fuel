import { formatClockTime, formatElapsedTime } from "@/lib/formatTime";
import type { FuelRequest } from "@/types/fuelRequest";

interface FuelRequestItemProps {
  request: FuelRequest;
}

export default function FuelRequestItem({ request }: FuelRequestItemProps) {
  const isAutoRequest = request.INITIATOR.USER_ID === 2;
  const resourceModel = request.RESOURCE.MODEL;
  const resourceModelCleaned =
    resourceModel === "DA42 NG" ? "Diamond" : resourceModel === "172S NAV III" ? "Cessna" : resourceModel;

  return (
    <li
      className={
        isAutoRequest
          ? "flex flex-row justify-between items-center bg-green-100/40 dark:bg-green-900/20 shadow-md p-4 border border-green-100 dark:border-green-900/40 rounded-md"
          : "flex flex-row justify-between items-center bg-amber-100/40 dark:bg-amber-900/20 shadow-md p-4 border border-amber-100 dark:border-amber-900/40 rounded-md"
      }
    >
      <div className="flex flex-col justify-center items-start gap-2">
        <span className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <span className="font-mono font-medium text-xl">{request.RESOURCE.NAME}</span>
          <span className={
            resourceModel === "DA42 NG" ?
            "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md border border-blue-500/30 text-zinc-600 dark:text-zinc-400 text-xs shadow-sm"
            : resourceModel === "172S NAV III" ?
            "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400 border border-red-500/30 text-xs shadow-sm"
            : "bg-zinc-100/50 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400 text-xs shadow-sm"
          }>{resourceModelCleaned}</span>
        </span>
        <div className="flex flex-col justify-start items-start gap-2 font-medium text-zinc-600 dark:text-zinc-200 text-xl">
          <span className="bg-white dark:bg-zinc-800 shadow-sm px-3.5 py-1 border border-zinc-300 dark:border-zinc-600 rounded-md font-mono font-bold">{request.DETAILS.PARKING_SPOT.NAME}</span>
          <span>{request.DETAILS.THIRD_PARTY_DATA.REQUESTED_SERVICE}
          {request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT
            ? ` (${request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT})`
            : ""}
          {request.DETAILS.OIL ? " · Oil requested" : ""}</span>
        </div>
      </div>
      <div className="flex flex-col justify-start items-end self-stretch gap-4">
        <span className="bg-zinc-200/70 dark:bg-zinc-800/60 shadow-sm px-2 py-0.5 rounded-md font-mono font-medium text-zinc-600 dark:text-zinc-200 text-sm text-right leading-relaxed whitespace-nowrap">
          {formatElapsedTime(request.DATE_CREATED)}
          <br />
          {formatClockTime(request.DATE_CREATED)}
        </span>
        <span
          className={
            isAutoRequest
              ? "rounded-full bg-green-200 px-2 py-0.5 text-md font-semibold text-green-700 dark:bg-green-900/80 dark:text-green-300 shadow-sm"
              : "rounded-full bg-amber-200 px-2 py-0.5 text-md font-semibold text-amber-700 dark:bg-amber-900/80 dark:text-amber-300 shadow-sm"
          }
        >
          {isAutoRequest ? "Auto" : "Pilot"}
        </span>
      </div>
    </li>
  );
}