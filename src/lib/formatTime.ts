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

export function formatRelativeTime(value: string): string {
  const date = parseErauDate(value);
  if (!date) return value;

  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.round(diffHour / 24);
  return `${diffDay}d ago`;
}
