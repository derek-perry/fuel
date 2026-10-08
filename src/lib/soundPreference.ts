"use client";

import { useCallback, useSyncExternalStore } from "react";

const SOUND_ENABLED_KEY = "fuel:soundEnabled";

const listeners = new Set<() => void>();

// Sound is on unless the user explicitly muted it.
function getSnapshot(): boolean {
  return window.localStorage.getItem(SOUND_ENABLED_KEY) !== "false";
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SOUND_ENABLED_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSoundEnabled() {
  const soundEnabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSoundEnabled = useCallback((value: boolean) => {
    window.localStorage.setItem(SOUND_ENABLED_KEY, String(value));
    listeners.forEach((listener) => listener());
  }, []);

  return { soundEnabled, setSoundEnabled };
}
