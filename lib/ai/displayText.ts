/**
 * Display / text sanitization for AI → UI mapping.
 * Keeps internal parser flags and raw JSON out of user-visible strings.
 */

const BLOCKED_LITERALS = new Set([
  "undefined",
  "null",
  "true",
  "false",
  "nan",
  "noevidencefound",
  "no_evidence_found",
  "[object object]",
]);

const INTERNAL_KEY_PATTERN =
  /\b(noEvidenceFound|evidenceCitations|proposedUpdates|primarySource|improvedReasoning|supportingEvidence)\b/i;

/**
 * Return user-safe display text, or fallback when the value is empty / internal.
 */
export function sanitizeDisplayText(
  value: unknown,
  fallback = ""
): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();
  if (BLOCKED_LITERALS.has(lower)) return fallback;

  // Reject accidental dumps of schema keys / raw JSON blobs into UI fields.
  if (INTERNAL_KEY_PATTERN.test(trimmed) && /[{}=:]/.test(trimmed)) {
    return fallback;
  }
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return fallback;
  }

  return trimmed;
}

/** Clamp confidence into [0, 1]. */
export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

/**
 * Realistic confidence for UI: never force 0% when evidence exists.
 */
export function normalizeConfidenceForDisplay(
  confidence: number,
  options?: { hasEvidence?: boolean; noEvidenceFound?: boolean }
): number {
  const clamped = clampConfidence(confidence);
  if (options?.noEvidenceFound) {
    return clamped > 0 ? clamped : 0.3;
  }
  if (options?.hasEvidence && clamped < 0.2) {
    return 0.55;
  }
  if (!options?.hasEvidence && clamped === 0) {
    return 0.35;
  }
  return clamped;
}
