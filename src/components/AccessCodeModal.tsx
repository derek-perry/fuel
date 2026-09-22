"use client";

import { useState, type FormEvent } from "react";
import ThemeToggle from "@/components/ThemeToggle";

interface AccessCodeModalProps {
  onGranted: () => void;
}

export default function AccessCodeModal({ onGranted }: AccessCodeModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/erau/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { granted: boolean; message?: string };

      if (json.granted) {
        onGranted();
      } else {
        setError(json.message ?? "Access was not granted.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 justify-center items-center p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-zinc-900 shadow-md p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Fueler Dashboard</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400 text-sm">Enter the access code to continue.</p>
          </div>
          <ThemeToggle />
        </div>

        <input
          type="password"
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Access code"
          className="bg-transparent px-3 py-2 border border-zinc-300 focus:border-zinc-500 dark:border-zinc-700 rounded-md outline-none w-full text-zinc-900 dark:text-zinc-100 text-sm"
        />

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || code.length === 0}
          className="bg-zinc-900 dark:bg-zinc-100 disabled:opacity-50 px-3 py-2 rounded-md w-full font-medium text-white dark:text-zinc-900 text-sm cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
