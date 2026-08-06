/**
 * Validate and normalize Gemini JSON into AIResponse.
 */

import { AIParseError } from "@/lib/ai/errors";
import { aiDebug } from "@/lib/ai/logger";
import type { AISuggestionSchema } from "@/lib/ai/schema";
import type {
  AIResponse,
  ClaimUpdate,
  EvidenceCitation,
} from "@/lib/ai/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  path: string
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AIParseError(`Invalid AI payload: "${path}" must be a non-empty string.`, {
      key,
      value,
    });
  }
  return value;
}

function optionalString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new AIParseError(`Invalid AI payload: "${key}" must be a string when provided.`, {
      key,
      value,
    });
  }
  return value;
}

function requireNumber(
  record: Record<string, unknown>,
  key: string
): number {
  const value = record[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new AIParseError(`Invalid AI payload: "${key}" must be a number.`, {
      key,
      value,
    });
  }
  return value;
}

function parseProposedUpdates(
  value: unknown,
  fallbackClaimElementId?: string
): ClaimUpdate {
  if (!isRecord(value)) {
    throw new AIParseError(
      'Invalid AI payload: "proposedUpdates" must be an object.',
      { value }
    );
  }

  const claimElementId =
    typeof value.claimElementId === "string" && value.claimElementId.trim()
      ? value.claimElementId
      : fallbackClaimElementId;

  if (!claimElementId) {
    throw new AIParseError(
      'Invalid AI payload: "proposedUpdates.claimElementId" is required.',
      { value }
    );
  }

  const update: ClaimUpdate = { claimElementId };

  if (value.reasoning !== undefined) {
    if (typeof value.reasoning !== "string") {
      throw new AIParseError(
        'Invalid AI payload: "proposedUpdates.reasoning" must be a string.'
      );
    }
    update.reasoning = value.reasoning;
  }
  if (value.accusedProductFeature !== undefined) {
    if (typeof value.accusedProductFeature !== "string") {
      throw new AIParseError(
        'Invalid AI payload: "proposedUpdates.accusedProductFeature" must be a string.'
      );
    }
    update.accusedProductFeature = value.accusedProductFeature;
  }
  if (value.evidenceSource !== undefined) {
    if (typeof value.evidenceSource !== "string") {
      throw new AIParseError(
        'Invalid AI payload: "proposedUpdates.evidenceSource" must be a string.'
      );
    }
    update.evidenceSource = value.evidenceSource;
  }
  if (value.patentClaimElement !== undefined) {
    if (typeof value.patentClaimElement !== "string") {
      throw new AIParseError(
        'Invalid AI payload: "proposedUpdates.patentClaimElement" must be a string.'
      );
    }
    update.patentClaimElement = value.patentClaimElement;
  }
  if (value.isNewRowProposal !== undefined) {
    if (typeof value.isNewRowProposal !== "boolean") {
      throw new AIParseError(
        'Invalid AI payload: "proposedUpdates.isNewRowProposal" must be a boolean.'
      );
    }
    update.isNewRowProposal = value.isNewRowProposal;
  }

  return update;
}

function parseEvidenceCitations(value: unknown): EvidenceCitation[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new AIParseError(
      'Invalid AI payload: "evidenceCitations" must be an array when provided.',
      { value }
    );
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new AIParseError(
        `Invalid AI payload: evidenceCitations[${index}] must be an object.`
      );
    }
    const documentName = requireString(
      item,
      "documentName",
      `evidenceCitations[${index}].documentName`
    );
    const excerpt = requireString(
      item,
      "excerpt",
      `evidenceCitations[${index}].excerpt`
    );
    const location = optionalString(item, "location");
    return location ? { documentName, excerpt, location } : { documentName, excerpt };
  });
}

/**
 * Validate a raw model payload against the expected schema.
 */
export function validateSuggestionPayload(
  raw: unknown,
  options?: { fallbackClaimElementId?: string }
): AISuggestionSchema {
  if (!isRecord(raw)) {
    throw new AIParseError("Invalid AI payload: expected a JSON object.", {
      raw,
    });
  }

  const summary = requireString(raw, "summary", "summary");
  const improvedReasoning = requireString(
    raw,
    "improvedReasoning",
    "improvedReasoning"
  );
  const supportingEvidence = requireString(
    raw,
    "supportingEvidence",
    "supportingEvidence"
  );
  const citation = requireString(raw, "citation", "citation");
  const rationale = requireString(raw, "rationale", "rationale");
  const confidence = requireNumber(raw, "confidence");

  if (confidence < 0 || confidence > 1) {
    throw new AIParseError(
      'Invalid AI payload: "confidence" must be between 0 and 1.',
      { confidence }
    );
  }

  const proposedUpdates = parseProposedUpdates(
    raw.proposedUpdates,
    options?.fallbackClaimElementId
  );
  const evidenceCitations = parseEvidenceCitations(raw.evidenceCitations);
  const primarySource = optionalString(raw, "primarySource");

  let noEvidenceFound: boolean | undefined;
  if (raw.noEvidenceFound !== undefined) {
    if (typeof raw.noEvidenceFound !== "boolean") {
      throw new AIParseError(
        'Invalid AI payload: "noEvidenceFound" must be a boolean when provided.'
      );
    }
    noEvidenceFound = raw.noEvidenceFound;
  }

  return {
    summary,
    improvedReasoning,
    supportingEvidence,
    citation,
    confidence,
    proposedUpdates,
    rationale,
    evidenceCitations,
    primarySource,
    noEvidenceFound,
  };
}

/**
 * Normalize a validated schema object into the public AIResponse contract.
 */
export function normalizeSuggestionResponse(
  payload: AISuggestionSchema
): AIResponse {
  return {
    summary: payload.summary,
    improvedReasoning: payload.improvedReasoning,
    supportingEvidence: payload.supportingEvidence,
    citation: payload.citation,
    confidence: payload.confidence,
    proposedUpdates: {
      ...payload.proposedUpdates,
      reasoning: payload.proposedUpdates.reasoning ?? payload.improvedReasoning,
      evidenceSource:
        payload.proposedUpdates.evidenceSource ?? payload.citation,
    },
    rationale: payload.rationale,
    evidenceCitations: payload.evidenceCitations ?? [],
    primarySource: payload.primarySource,
    noEvidenceFound: payload.noEvidenceFound ?? false,
  };
}

/**
 * Parse a raw provider response (object or JSON string) into AIResponse.
 */
export function parseSuggestionResponse(
  raw: unknown,
  options?: { fallbackClaimElementId?: string }
): AIResponse {
  let parsed: unknown = raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new AIParseError("Invalid AI payload: empty JSON string.");
    }
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch (cause) {
      throw new AIParseError("Invalid AI payload: response is not valid JSON.", {
        cause,
        preview: trimmed.slice(0, 200),
      });
    }
  }

  const validated = validateSuggestionPayload(parsed, options);
  const normalized = normalizeSuggestionResponse(validated);
  aiDebug("Parsed AI suggestion response", {
    claimElementId: normalized.proposedUpdates.claimElementId,
    confidence: normalized.confidence,
    noEvidenceFound: normalized.noEvidenceFound,
  });
  return normalized;
}
