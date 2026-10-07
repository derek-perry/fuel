"use client";

import { useEffect, useRef } from "react";
import type { FuelRequestRecord } from "@/types/fuelRequest";

// Replace this file in /public/sounds to change the notification sound.
const SOUND_SRC = "/sounds/new-request.wav";

// Plays a sound when a request id appears that wasn't in a previous snapshot.
// The first snapshot only seeds the known ids so existing requests stay silent.
export function useNewRequestSound(requests: FuelRequestRecord[] | undefined) {
  const knownIds = useRef<Set<number> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!requests) return;

    const ids = new Set(requests.map((r) => r.requestId));
    const previous = knownIds.current;
    knownIds.current = ids;
    if (!previous) return;

    for (const id of ids) {
      if (!previous.has(id)) {
        audio.current ??= new Audio(SOUND_SRC);
        audio.current.currentTime = 0;
        // Browsers block playback until the user has interacted with the page.
        audio.current.play().catch(() => {});
        break;
      }
    }
  }, [requests]);
}
