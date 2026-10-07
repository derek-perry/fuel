"use client";

import { useMemo, useState } from "react";
import type { Truck, Fueler } from "@/types/reference";

interface IdentityPickerProps {
  trucks: Truck[];
  fuelers: Fueler[];
  myTruck: string | null;
  myFueler: string | null;
  onChangeTruck: (truck: string | null) => void;
  onChangeFueler: (fueler: string | null) => void;
}

// Shared "who am I" content — a fueler-name combobox + a tappable truck grid. Both optional.
// Rendered inside IdentityModal (dashboard header) and inline in AccessCodeModal (login).
export default function IdentityPicker({
  trucks,
  fuelers,
  myTruck,
  myFueler,
  onChangeTruck,
  onChangeFueler,
}: IdentityPickerProps) {
  const [fuelerQuery, setFuelerQuery] = useState(myFueler ?? "");
  const [showFuelerOptions, setShowFuelerOptions] = useState(false);

  const filteredFuelers = useMemo(() => {
    const query = fuelerQuery.trim().toLowerCase();
    if (!query) return fuelers;
    return fuelers.filter((fueler) => fueler.name.toLowerCase().includes(query));
  }, [fuelers, fuelerQuery]);

  function selectFueler(name: string | null) {
    onChangeFueler(name);
    setFuelerQuery(name ?? "");
    setShowFuelerOptions(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="block mb-1.5 font-medium text-zinc-600 dark:text-zinc-300 text-xs">
          Name <span className="font-normal text-zinc-400 dark:text-zinc-500">(optional)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={fuelerQuery}
            onChange={(event) => {
              setFuelerQuery(event.target.value);
              setShowFuelerOptions(true);
              if (event.target.value === "") onChangeFueler(null);
            }}
            onFocus={() => setShowFuelerOptions(true)}
            onBlur={() => {
              // Delay so a click on an option registers before the list unmounts.
              setTimeout(() => setShowFuelerOptions(false), 150);
            }}
            placeholder="Type or select your name…"
            className="bg-white dark:bg-zinc-800 px-3 py-2 border border-zinc-300 focus:border-zinc-500 dark:border-zinc-700 rounded-md outline-none w-full text-zinc-900 dark:text-zinc-100 text-sm"
          />
          {showFuelerOptions && filteredFuelers.length > 0 && (
            <ul className="z-10 absolute bg-white dark:bg-zinc-800 shadow-md mt-1 border border-zinc-300 dark:border-zinc-700 rounded-md w-full max-h-48 overflow-y-auto">
              {filteredFuelers.map((fueler) => (
                <li key={fueler.name}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectFueler(fueler.name)}
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 w-full text-zinc-900 dark:text-zinc-100 text-sm text-left cursor-pointer"
                  >
                    {fueler.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <label className="block mb-1.5 font-medium text-zinc-600 dark:text-zinc-300 text-xs">
          Truck <span className="font-normal text-zinc-400 dark:text-zinc-500">(optional)</span>
        </label>
        <div className="gap-2 grid grid-cols-3">
          {trucks.map((truck) => {
            const selected = myTruck === truck.number;
            return (
              <button
                key={truck.number}
                type="button"
                onClick={() => onChangeTruck(selected ? null : truck.number)}
                className="flex justify-center items-center px-2 py-4 border-2 rounded-lg min-h-16 font-semibold text-zinc-700 dark:text-zinc-200 text-sm text-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: selected ? truck.color : "transparent",
                  borderColor: truck.color,
                  color: selected ? "#fff" : undefined,
                }}
              >
                {truck.identifier}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
