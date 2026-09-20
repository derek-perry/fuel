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
  [key: string]: unknown;
}
