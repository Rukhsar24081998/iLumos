/**
 * Validate and normalize Gemini JSON into AIResponse.
 */

import {
  clampConfidence,
  normalizeConfidenceForDisplay,
  sanitizeDisplayText,
} from "@/lib/ai/displayText";
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

/**
 * Prefer a non-empty string; fall back without treating absence as fatal.
 */
function softString(
  record: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = record[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function optionalString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseBooleanFlag(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return undefined;
}

/**
 * Parse confidence without defaulting missing/weak values to 0%.
 */
function parseConfidence(
  record: Record<string, unknown>,
  options: { hasEvidenceSignals: boolean; noEvidenceFound: boolean }
): number {
  const raw = record.confidence;
  let parsed: number | undefined;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    parsed = raw > 1 && raw <= 100 ? raw / 100 : raw;
  } else if (typeof raw === "string" && raw.trim()) {
    const cleaned = raw.trim().replace(/%/g, "");
    const asNumber = Number(cleaned);
    if (Number.isFinite(asNumber)) {
      parsed = asNumber > 1 && asNumber <= 100 ? asNumber / 100 : asNumber;
    }
  }

  if (parsed === undefined) {
    // Missing confidence — estimate from evidence signals, never 0.
    return options.noEvidenceFound
      ? 0.3
      : options.hasEvidenceSignals
        ? 0.7
        : 0.55;
  }

  return normalizeConfidenceForDisplay(clampConfidence(parsed), {
    hasEvidence: options.hasEvidenceSignals,
    noEvidenceFound: options.noEvidenceFound,
  });
}

function parseProposedUpdates(
  value: unknown,
  fallbackClaimElementId?: string,
  fallbacks?: {
    reasoning?: string;
    evidenceSource?: string;
  }
): ClaimUpdate {
  if (!isRecord(value)) {
    if (!fallbackClaimElementId) {
      throw new AIParseError(
        'Invalid AI payload: "proposedUpdates" must be an object.',
        { value }
      );
    }
    return {
      claimElementId: fallbackClaimElementId,
      reasoning: fallbacks?.reasoning,
      evidenceSource: fallbacks?.evidenceSource,
    };
  }

  const claimElementId =
    typeof value.claimElementId === "string" && value.claimElementId.trim()
      ? value.claimElementId.trim()
      : fallbackClaimElementId;

  if (!claimElementId) {
    throw new AIParseError(
      'Invalid AI payload: "proposedUpdates.claimElementId" is required.',
      { value }
    );
  }

  const update: ClaimUpdate = { claimElementId };

  const reasoning = optionalString(value, "reasoning") ?? fallbacks?.reasoning;
  if (reasoning) update.reasoning = reasoning;

  const accused = optionalString(value, "accusedProductFeature");
  if (accused) update.accusedProductFeature = accused;

  const evidenceSource =
    optionalString(value, "evidenceSource") ?? fallbacks?.evidenceSource;
  if (evidenceSource) update.evidenceSource = evidenceSource;

  const patentClaimElement = optionalString(value, "patentClaimElement");
  if (patentClaimElement) update.patentClaimElement = patentClaimElement;

  const isNew = parseBooleanFlag(value.isNewRowProposal);
  if (isNew !== undefined) update.isNewRowProposal = isNew;

  return update;
}

function parseEvidenceCitations(value: unknown): EvidenceCitation[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return [];

  const citations: EvidenceCitation[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const documentName = optionalString(item, "documentName");
    const excerpt = optionalString(item, "excerpt");
    if (!documentName || !excerpt) continue;
    const location = optionalString(item, "location");
    citations.push(
      location
        ? { documentName, excerpt, location }
        : { documentName, excerpt }
    );
  }

  return citations;
}

function hasEvidenceSignals(
  record: Record<string, unknown>,
  citations: EvidenceCitation[]
): boolean {
  if (citations.length > 0) return true;
  const citation = optionalString(record, "citation");
  const supporting = optionalString(record, "supportingEvidence");
  const primary = optionalString(record, "primarySource");
  if (primary) return true;
  if (citation && !/no (supporting )?citation|insufficient|not found/i.test(citation)) {
    return true;
  }
  if (
    supporting &&
    !/insufficient|no (suitable )?evidence|not (enough|found)/i.test(supporting)
  ) {
    return true;
  }
  return false;
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

  const noEvidenceFound = parseBooleanFlag(raw.noEvidenceFound) ?? false;
  const evidenceCitations = parseEvidenceCitations(raw.evidenceCitations);
  const evidenceSignals = hasEvidenceSignals(raw, evidenceCitations);

  const summary = softString(
    raw,
    "summary",
    noEvidenceFound
      ? "Insufficient evidence was found in the uploaded documents to fully support this refinement."
      : "Suggestion ready for review."
  );
  const improvedReasoning = softString(
    raw,
    "improvedReasoning",
    softString(raw, "summary", "Reasoning could not be improved with the available evidence.")
  );
  const supportingEvidence = softString(
    raw,
    "supportingEvidence",
    noEvidenceFound
      ? "No suitable supporting excerpt was available in the uploaded documents. Additional technical documentation is recommended."
      : improvedReasoning
  );
  const citation = softString(
    raw,
    "citation",
    noEvidenceFound
      ? "No supporting citation available in the uploaded documents."
      : evidenceCitations[0]
        ? `${evidenceCitations[0].documentName}`
        : softString(raw, "primarySource", "Supporting documents")
  );
  const rationale = softString(
    raw,
    "rationale",
    noEvidenceFound
      ? "Evidence in the current corpus is insufficient for a stronger claim mapping."
      : "Updated using the strongest available supporting documents."
  );

  // Required narrative fields still must be present after soft fill.
  if (!summary || !improvedReasoning || !supportingEvidence || !citation || !rationale) {
    throw new AIParseError(
      "Invalid AI payload: required narrative fields are missing.",
      { raw }
    );
  }

  const confidence = parseConfidence(raw, {
    hasEvidenceSignals: evidenceSignals && !noEvidenceFound,
    noEvidenceFound,
  });

  const proposedUpdates = parseProposedUpdates(
    raw.proposedUpdates,
    options?.fallbackClaimElementId,
    {
      reasoning: improvedReasoning,
      evidenceSource: citation,
    }
  );

  const primarySource = optionalString(raw, "primarySource");

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
  const noEvidenceFound = payload.noEvidenceFound ?? false;
  const evidenceCitations = payload.evidenceCitations ?? [];
  const hasEvidence = evidenceCitations.length > 0 || !noEvidenceFound;

  const confidence = normalizeConfidenceForDisplay(payload.confidence, {
    hasEvidence: hasEvidence && !noEvidenceFound,
    noEvidenceFound,
  });

  const citation =
    sanitizeDisplayText(payload.citation) ||
    (noEvidenceFound
      ? "No supporting citation available in the uploaded documents."
      : "Supporting documents");

  const primarySource = sanitizeDisplayText(payload.primarySource) || undefined;

  return {
    summary: sanitizeDisplayText(payload.summary, "Suggestion ready for review."),
    improvedReasoning: sanitizeDisplayText(
      payload.improvedReasoning,
      payload.summary
    ),
    supportingEvidence: sanitizeDisplayText(
      payload.supportingEvidence,
      payload.improvedReasoning
    ),
    citation,
    confidence,
    proposedUpdates: {
      claimElementId: payload.proposedUpdates.claimElementId,
      reasoning:
        sanitizeDisplayText(payload.proposedUpdates.reasoning) ||
        sanitizeDisplayText(payload.improvedReasoning),
      accusedProductFeature: sanitizeDisplayText(
        payload.proposedUpdates.accusedProductFeature
      ) || undefined,
      evidenceSource:
        sanitizeDisplayText(payload.proposedUpdates.evidenceSource) || citation,
      patentClaimElement: sanitizeDisplayText(
        payload.proposedUpdates.patentClaimElement
      ) || undefined,
      isNewRowProposal: payload.proposedUpdates.isNewRowProposal,
    },
    rationale: sanitizeDisplayText(
      payload.rationale,
      "Updated using the available supporting documents."
    ),
    evidenceCitations: evidenceCitations
      .map((item) => ({
        documentName: sanitizeDisplayText(item.documentName),
        excerpt: sanitizeDisplayText(item.excerpt),
        location: sanitizeDisplayText(item.location) || undefined,
      }))
      .filter((item) => item.documentName && item.excerpt),
    primarySource,
    noEvidenceFound,
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
