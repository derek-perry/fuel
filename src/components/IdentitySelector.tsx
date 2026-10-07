"use client";

import type { Truck, Fueler } from "@/types/reference";

interface IdentitySelectorProps {
  trucks: Truck[];
  fuelers: Fueler[];
  myTruck: string | null;
  myFueler: string | null;
  onChangeTruck: (truck: string | null) => void;
  onChangeFueler: (fueler: string | null) => void;
}

export default function IdentitySelector({
  trucks,
  fuelers,
  myTruck,
  myFueler,
  onChangeTruck,
  onChangeFueler,
}: IdentitySelectorProps) {
  return (
    <div className="flex flex-row items-center gap-1.5">
      <select
        value={myTruck ?? ""}
        onChange={(event) => onChangeTruck(event.target.value || null)}
        title="My truck"
        className="bg-white dark:bg-zinc-800 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer"
      >
        <option value="">My truck…</option>
        {trucks.map((truck) => (
          <option key={truck.number} value={truck.number}>
            {truck.identifier}
          </option>
        ))}
      </select>
      <select
        value={myFueler ?? ""}
        onChange={(event) => onChangeFueler(event.target.value || null)}
        title="My name"
        className="bg-white dark:bg-zinc-800 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer"
      >
        <option value="">My name…</option>
        {fuelers.map((fueler) => (
          <option key={fueler.name} value={fueler.name}>
            {fueler.name}
          </option>
        ))}
      </select>
    </div>
  );
}
