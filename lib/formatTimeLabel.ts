/**
 * Fixed-locale time label for message factories / event handlers.
 * Do not call from React render (SSR) — pass the resulting string as `timeLabel`.
 */
export function formatTimeLabel(date: Date = new Date()): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Stable label for SSR/mock seed messages (server === client). */
export const MOCK_TIME_LABEL = "18:21";
