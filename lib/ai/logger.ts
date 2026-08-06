/**
 * Debug logging for the AI layer.
 * Never surface internal details to the UI — logs stay server/dev only.
 */

const PREFIX = "[iLumos:ai]";

function isDebugEnabled(): boolean {
  return (
    process.env.AI_DEBUG === "1" ||
    process.env.AI_DEBUG === "true" ||
    process.env.NODE_ENV === "development"
  );
}

export function aiDebug(message: string, meta?: Record<string, unknown>): void {
  if (!isDebugEnabled()) return;
  if (meta) {
    console.debug(PREFIX, message, meta);
    return;
  }
  console.debug(PREFIX, message);
}

export function aiWarn(message: string, meta?: Record<string, unknown>): void {
  if (meta) {
    console.warn(PREFIX, message, meta);
    return;
  }
  console.warn(PREFIX, message);
}
