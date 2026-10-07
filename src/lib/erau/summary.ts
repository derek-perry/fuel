import type { FuelRequest } from "@/types/fuelRequest";
import type { RequestType } from "@/types/fuelRequest";

// Fields the collector writes to the `requests` table for a live upstream request. Does NOT
// include claimed_*/fueled_* columns — those are exclusively owned/written by the dashboard app.
export interface RequestInsertInput {
  requestId: number;
  tailNumber: string;
  planeType: string;
  parkingSpot: string;
  requestType: RequestType;
  fuelRequested: boolean;
  fuelAmountType: string | null;
  fuelAmount: string | null;
  oilRequested: boolean;
  createdAt: string;
  rawData: string;
}

// Ported from FuelRequestItem.tsx's isAutoRequest/isConversion — the collector computes this
// once at write time so the dashboard doesn't need the full upstream shape to label a request.
export function toRequestInsertInput(request: FuelRequest): RequestInsertInput {
  const isAutoRequest = request.INITIATOR.USER_ID === 2;
  const isConversion = isAutoRequest && request.ACTIVITY != null;
  const requestType: RequestType = isConversion ? "conversion" : isAutoRequest ? "auto" : "pilot";

  return {
    requestId: request.REQUEST_ID,
    tailNumber: request.RESOURCE.NAME,
    planeType: request.RESOURCE.MODEL,
    parkingSpot: request.DETAILS.PARKING_SPOT.NAME,
    requestType,
    fuelRequested: Boolean(request.DETAILS.FUEL),
    fuelAmountType: request.DETAILS.THIRD_PARTY_DATA.REQUESTED_SERVICE || null,
    fuelAmount: request.DETAILS.THIRD_PARTY_DATA.REQUESTED_AMOUNT || null,
    oilRequested: Boolean(request.DETAILS.OIL),
    createdAt: request.DATE_CREATED,
    rawData: JSON.stringify(request),
  };
}
