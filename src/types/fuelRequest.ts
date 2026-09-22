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

// Minimal subset of FuelRequest fields needed to render a request card. FuelRequest is
// structurally assignable to this, so FuelRequestItem/history code can accept either without
// storing (or requiring) the full upstream payload.
export interface FuelRequestSummary {
  REQUEST_ID: number;
  DATE_CREATED: string;
  INITIATOR: {
    USER_ID: number;
  };
  ACTIVITY?: unknown;
  RESOURCE: {
    NAME: string;
    MODEL: string;
  };
  DETAILS: {
    OIL: number;
    PARKING_SPOT: {
      NAME: string;
    };
    THIRD_PARTY_DATA: {
      REQUESTED_SERVICE: string;
      REQUESTED_AMOUNT: string;
    };
  };
}

// A request that disappeared from the live upstream feed (completed/cancelled/etc). Upstream
// has no history endpoint, so `COMPLETED_AT` is set locally to when we first noticed it missing,
// not an upstream timestamp.
export interface FuelRequestHistoryEntry extends FuelRequestSummary {
  COMPLETED_AT: string;
}
