// Shapes mirror sample payloads captured from the live dashboard; upstream is undocumented so
// some nested fields are left loose (`Record<string, unknown>`) until confirmed by more samples.

export interface ParkingSpot {
  PARKING_SPOT_ID: number;
  ETA_PARK_SPOT_ID: number;
  NAME: string;
  CAMPUS: string;
  ENABLED: number;
  OBSOLETE: number;
  PREVENT_AF_REQ: number;
  DATE_CREATED: string;
  DATE_MODIFIED: string;
  [key: string]: unknown;
}

export interface ThirdPartyData {
  REQUESTED_SERVICE: string;
  REQUESTED_AMOUNT: string;
  [key: string]: unknown;
}

export interface RequestDetails {
  PARKING_SPOT_ID: number;
  OIL: number;
  FUEL: number;
  PARKING_SPOT: ParkingSpot;
  THIRD_PARTY_DATA: ThirdPartyData;
  REQUEST_FUEL_OIL_ID: number;
  DENY_REASON_ID: string | number;
  DENY_REASON_DETAILS: string;
  [key: string]: unknown;
}

export interface Initiator {
  USER_ID: number;
  NAME: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  EMAIL: string;
  USERNAME: string;
  [key: string]: unknown;
}

export interface Resource {
  RESOURCE_ID: number;
  NAME: string;
  MODEL: string;
  MAKE: string;
  RESOURCE_TYPE_NAME: string;
  CAMPUS: string;
  PARKING_SPOT_LAST_KNOWN_NAME: string;
  HOBBS_TIME: string;
  TACH_TIME: string;
  [key: string]: unknown;
}

// Present only once an instructor/student have started an activity for the resource; absent
// (whole ACTIVITY key missing) on freshly created system-initiated requests.
export interface Activity {
  ACTIVITY_ID: number;
  ACTIVITY_TYPE: string;
  ACTIVITY_TYPE_ID: number;
  RESOURCE_ID: number;
  PARKING_SPOT_ID: number;
  PARKING_SPOT: ParkingSpot;
  RESOURCE_CAMPUS: string;
  STATUS: string;
  STATUS_CODE: number;
  START_DATETIME: string;
  END_DATETIME: string | number;
  START_HOBBS: number;
  END_HOBBS: string | number;
  START_TACH: number;
  END_TACH: string | number;
  CANCEL_REASON: string;
  ACT_COMMENT: string;
  COMPLETION_REQUESTED: string | number;
  FUEL_LEVEL: string | number;
  OFFSITE_RETURN: string | number;
  OBSERVERS: number;
  ETA_AUTH: string;
  ETA_ACT_ID: number;
  DESTINATION_ID: number;
  DATE_MODIFIED: string;
  USER_ROLE: string;
  INSTRUCTOR_USER_ID: number;
  INSTRUCTOR_DISP_NAME: string;
  INSTRUCTOR_NO_ACCOUNT: number;
  INSTRUCTOR_USER: Initiator;
  STUDENT1_USER_ID: number;
  STUDENT1_DISP_NAME: string;
  STUDENT1_NO_ACCOUNT: number;
  STUDENT1_USER: Initiator;
  STUDENT2_USER_ID: number | string;
  STUDENT2_DISP_NAME: string;
  STUDENT2_NO_ACCOUNT: number;
  STUDENT2_USER: Initiator | Record<string, never>;
  [key: string]: unknown;
}

export interface FuelRequest {
  REQUEST_ID: number;
  RESOURCE_ID: number;
  STATUS_ID: number;
  TYPE_ID: number;
  REQUEST_TYPE: string;
  MODE: string;
  NOTES: string;
  DATE_CREATED: string;
  DATE_MODIFIED: string;
  DATE_COMPLETED: string;
  DETAILS: RequestDetails;
  INITIATOR: Initiator;
  RESOURCE: Resource;
  // Only set once a pilot/instructor has responded; absent on requests still awaiting response.
  ACTIVITY_ID?: string | number;
  ACTIVITY?: Activity;
  RESPONDING_USER_ID: string | number;
  INITIATING_USER_ID: number;
  PARENT_ID: number;
  PARENTED: number;
  [key: string]: unknown;
}

// "auto" = ERAU's own automated system (INITIATOR.USER_ID === 2) created the request; "conversion"
// = an auto request that a pilot has since added activity on top of; "pilot" = pilot-initiated.
// Computed once by the collector (see `src/lib/erau/summary.ts`) and stored, not re-derived.
export type RequestType = "auto" | "conversion" | "pilot";

// Who/when a request was claimed or marked fueled by a dashboard user — local-only, unrelated to
// ERAU's own completion flow. Independent of each other: a different truck can mark something
// fueled than whichever truck claimed it.
export interface ClaimInfo {
  truck: string;
  fueler: string;
}

// The normalized, flat shape the dashboard actually renders — backed 1:1 by the `requests` SQLite
// table (see `src/lib/db.ts`). Used for BOTH the live list and history: `completedAt === null`
// means still live. Claim/fuel state is live-joined from the same row, so it stays editable even
// after a request completes (not frozen into a separate immutable history blob).
export interface FuelRequestRecord {
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
  completedAt: string | null;
  claimedAt: string | null;
  claimedTruck: string | null;
  claimedFueler: string | null;
  fueledAt: string | null;
  fueledTruck: string | null;
  fueledFueler: string | null;
}
