// Upstream timestamps look like "2026-09-20 01:29:30.835000 -04:00"; normalize to ISO-8601 so `Date` parses reliably.
function parseErauDate(value: string): Date | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .replace(" ", "T")
    .replace(/\.(\d{3})\d*/, ".$1")
    .replace(/ ([+-]\d{2}:\d{2})$/, "$1");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatElapsedTime(value: string): string {
  const date = parseErauDate(value);
  if (!date) return value;

  const elapsedSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const hours = Math.floor(elapsedSec / 3600);
  const minutes = Math.floor((elapsedSec % 3600) / 60);
  const seconds = elapsedSec % 60;
  const parts = [];

  // Only pad a unit to 2 digits when a higher, non-zero unit is also shown.
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${hours > 0 ? String(minutes).padStart(2, "0") : minutes}m`);
  parts.push(`${minutes > 0 || hours > 0 ? String(seconds).padStart(2, "0") : seconds}s`);

  return parts.join(" ");
}

export function isElapsedTimeOverFiveMinutes(value: string): boolean {
  const date = parseErauDate(value);
  return date != null && Date.now() - date.getTime() > 5 * 60 * 1000;
}

export function formatClockTimeFromDate(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatClockTime(value: string): string {
  const date = parseErauDate(value);
  if (!date) return value;

  return formatClockTimeFromDate(date);
}
