/**
 * Response validation and normalization placeholders.
 * Phase 4.2 will harden validation against live Gemini JSON.
 */

import type { AISuggestionSchema } from "@/lib/ai/schema";
import type { AIResponse } from "@/lib/ai/types";

/**
 * Validate a raw model payload against the expected schema.
 * Placeholder: accepts any object-like value and returns it typed.
 */
export function validateSuggestionPayload(
  raw: unknown
): AISuggestionSchema {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid AI payload: expected an object.");
  }
  return raw as AISuggestionSchema;
}

/**
 * Normalize a validated schema object into the public AIResponse contract.
 * Placeholder: pass-through mapping with safe defaults.
 */
export function normalizeSuggestionResponse(
  payload: AISuggestionSchema
): AIResponse {
  return {
    summary: payload.summary ?? "",
    improvedReasoning: payload.improvedReasoning ?? "",
    supportingEvidence: payload.supportingEvidence ?? "",
    citation: payload.citation ?? "",
    confidence:
      typeof payload.confidence === "number" ? payload.confidence : 0,
    proposedUpdates: payload.proposedUpdates,
    rationale: payload.rationale ?? "",
    evidenceCitations: payload.evidenceCitations ?? [],
    primarySource: payload.primarySource,
    noEvidenceFound: payload.noEvidenceFound ?? false,
  };
}

/**
 * Parse a raw provider response (object or JSON string) into AIResponse.
 * Placeholder: returns the supplied mock/object after light normalization.
 */
export function parseSuggestionResponse(raw: unknown): AIResponse {
  const parsed =
    typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
  const validated = validateSuggestionPayload(parsed);
  return normalizeSuggestionResponse(validated);
}
