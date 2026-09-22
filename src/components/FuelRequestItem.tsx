import { formatClockTime, formatElapsedTime, isElapsedTimeOverFiveMinutes } from "@/lib/formatTime";
import type { FuelRequest } from "@/types/fuelRequest";

interface FuelRequestItemProps {
  request: FuelRequest;
}

function FuelIcon({ service }: { service: string }) {
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
      {isTopOff || isFillToTabs ? (
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
          <path d="m7.5 11.5 6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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

export default function FuelRequestItem({ request }: FuelRequestItemProps) {
  const isAutoRequest = request.INITIATOR.USER_ID === 2;
  const isConversion = isAutoRequest && request.ACTIVITY != null;
  const resourceModel = request.RESOURCE.MODEL;
  const resourceModelCleaned = resourceModel === "DA42 NG" ? "Diamond" : resourceModel === "172S NAV III" ? "Cessna" : resourceModel;

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
        <span className="flex flex-row max-[349px]:flex-col items-center gap-2 text-zinc-900 dark:text-zinc-100">
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
          <span className="flex flex-col items-start gap-x-1 gap-y-1">
            {request.DETAILS.THIRD_PARTY_DATA.REQUESTED_SERVICE ? <span className="flex flex-row items-center gap-1"><FuelIcon service={request.DETAILS.THIRD_PARTY_DATA.REQUESTED_SERVICE} />
            {request.DETAILS.THIRD_PARTY_DATA.REQUESTED_SERVICE}
              {request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT
                ? ` (${request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT})`
                : ""}</span> : null}
            {request.DETAILS.OIL ? <span className="flex flex-row items-center gap-1"><OilIcon /><span>Oil</span></span> : null}
          </span>
        </div>
      </div>
      <div className="flex flex-col justify-start items-end self-stretch gap-4">
        <span
          className={`bg-zinc-200/70 dark:bg-zinc-800/60 shadow-sm px-2 py-0.5 rounded-md font-mono font-medium text-sm text-right leading-relaxed whitespace-nowrap ${
            isElapsedTimeOverFiveMinutes(request.DATE_CREATED)
              ? "animate-pulse text-red-600 dark:text-red-400"
              : "text-zinc-600 dark:text-zinc-200"
          }`}
        >
          {formatElapsedTime(request.DATE_CREATED)}
          <br />
          {formatClockTime(request.DATE_CREATED)}
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
    </li>
  );
}