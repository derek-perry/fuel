"use client";

import { useCallback, useState } from "react";
import type { Truck } from "@/types/reference";

const MY_TRUCK_KEY = "fuel:myTruck";
const MY_FUELER_KEY = "fuel:myFueler";

export function findTruck(trucks: Truck[], number: string | null | undefined): Truck | undefined {
  return number ? trucks.find((t) => t.number === number) : undefined;
}

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeStored(key: string, value: string | null): void {
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
}

// Client-only "who am I" preference — NOT an auth identity, just a convenience default so
// claim/fuel actions are one click. Truck is the operative identity used for ownership checks
// elsewhere (see ClaimConfirmModal); fueler name is recorded alongside but never compared.
export function useIdentity() {
  const [myTruck, setMyTruckState] = useState<string | null>(() => readStored(MY_TRUCK_KEY));
  const [myFueler, setMyFuelerState] = useState<string | null>(() => readStored(MY_FUELER_KEY));

  const setMyTruck = useCallback((value: string | null) => {
    writeStored(MY_TRUCK_KEY, value);
    setMyTruckState(value);
  }, []);

  const setMyFueler = useCallback((value: string | null) => {
    writeStored(MY_FUELER_KEY, value);
    setMyFuelerState(value);
  }, []);

  return { myTruck, myFueler, setMyTruck, setMyFueler };
}

export type Identity = ReturnType<typeof useIdentity>;

