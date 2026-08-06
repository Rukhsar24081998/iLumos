/**
 * Map AI service responses onto existing workspace SuggestionPayload / ChatMessage.
 * Does not change UI models — only adapts AIResponse into current shapes.
 */

import {
  normalizeConfidenceForDisplay,
  sanitizeDisplayText,
} from "@/lib/ai/displayText";
import { formatTimeLabel } from "@/lib/formatTimeLabel";
import type { AIResponse } from "@/lib/ai/types";
import type { ChatMessage, SuggestionPayload } from "@/types/workspace";

export interface MapSuggestionOptions {
  /** Fallback claim element id if the model omits proposedUpdates.claimElementId. */
  claimElementId: string;
  originalReasoning: string;
  version?: number;
  /** Preserve new-row metadata when refining an existing proposal. */
  isNewRowProposal?: boolean;
  proposedPatentClaimElement?: string;
  proposedAccusedProductFeature?: string;
  intro?: string;
  /** Uploaded document names — citations outside this set are dropped. */
  knownDocumentNames?: string[];
}

function isKnownDocument(
  name: string,
  known: string[] | undefined
): boolean {
  if (!known?.length) return true;
  return known.some(
    (item) => item.localeCompare(name, undefined, { sensitivity: "accent" }) === 0
  );
}

function collectEvidenceSources(
  response: AIResponse,
  knownDocumentNames?: string[]
): string[] {
  const names: string[] = [];

  for (const citation of response.evidenceCitations) {
    const name = sanitizeDisplayText(citation.documentName);
    if (!name || !isKnownDocument(name, knownDocumentNames)) continue;
    if (!names.includes(name)) names.push(name);
  }

  const primary = sanitizeDisplayText(response.primarySource);
  if (
    primary &&
    isKnownDocument(primary, knownDocumentNames) &&
    !names.includes(primary)
  ) {
    names.push(primary);
  }

  // Fall back to citation string only when it looks like a bare document name.
  if (names.length === 0) {
    const citation = sanitizeDisplayText(response.citation);
    if (
      citation &&
      knownDocumentNames?.some((name) => citation.includes(name))
    ) {
      const match = knownDocumentNames.find((name) => citation.includes(name));
      if (match) names.push(match);
    }
  }

  return names;
}

function buildCitationText(
  response: AIResponse,
  evidenceSources: string[]
): string {
  const cleaned = sanitizeDisplayText(response.citation);
  if (cleaned) return cleaned;

  if (response.noEvidenceFound) {
    return "No supporting citation available in the uploaded documents.";
  }

  if (evidenceSources.length > 0) {
    return evidenceSources.join("; ");
  }

  return "Supporting documents";
}

/**
 * Convert a normalized AIResponse into the SuggestionPayload used by SuggestionCard.
 */
export function mapAIResponseToSuggestion(
  response: AIResponse,
  options: MapSuggestionOptions
): SuggestionPayload {
  const stamp = new Date();
  const version = options.version ?? 1;
  const claimElementId =
    sanitizeDisplayText(response.proposedUpdates.claimElementId) ||
    options.claimElementId;

  const evidenceSources = collectEvidenceSources(
    response,
    options.knownDocumentNames
  );

  const isNewRow =
    options.isNewRowProposal ??
    response.proposedUpdates.isNewRowProposal ??
    false;

  const titleBase = isNewRow
    ? "Add Missing Feature"
    : "AI Refinement Suggestion";

  const summary = sanitizeDisplayText(
    response.summary,
    "Suggestion ready for review."
  );
  const suggestedReasoning = sanitizeDisplayText(
    response.proposedUpdates.reasoning ?? response.improvedReasoning,
    summary
  );
  const evidence = sanitizeDisplayText(
    response.supportingEvidence,
    suggestedReasoning
  );
  const citation = buildCitationText(response, evidenceSources);
  const primarySource =
    sanitizeDisplayText(response.primarySource) ||
    evidenceSources[0] ||
    (response.noEvidenceFound ? "Uploaded documents" : "Supporting documents");

  const confidence = normalizeConfidenceForDisplay(response.confidence, {
    hasEvidence: evidenceSources.length > 0 && !response.noEvidenceFound,
    noEvidenceFound: Boolean(response.noEvidenceFound),
  });

  return {
    id: `ai-${claimElementId}-${stamp.getTime()}`,
    claimElementId,
    title:
      version > 1
        ? `${titleBase} — Version ${version}`
        : `${titleBase} — ${claimElementId}`,
    summary,
    primarySource,
    citation,
    confidence,
    originalReasoning: sanitizeDisplayText(
      options.originalReasoning,
      "Prior reasoning"
    ),
    suggestedReasoning,
    evidence,
    evidenceSources,
    status: "pending",
    createdAt: stamp.toISOString(),
    timeLabel: formatTimeLabel(stamp),
    version,
    isNewRowProposal: isNewRow,
    proposedPatentClaimElement: sanitizeDisplayText(
      options.proposedPatentClaimElement ??
        response.proposedUpdates.patentClaimElement
    ) || undefined,
    proposedAccusedProductFeature: sanitizeDisplayText(
      options.proposedAccusedProductFeature ??
        response.proposedUpdates.accusedProductFeature
    ) || undefined,
  };
}

/**
 * Wrap a mapped suggestion in an assistant ChatMessage for the existing chat UI.
 */
export function mapAIResponseToAssistantMessage(
  response: AIResponse,
  options: MapSuggestionOptions
): ChatMessage {
  const suggestion = mapAIResponseToSuggestion(response, options);
  const stamp = suggestion.createdAt
    ? new Date(suggestion.createdAt)
    : new Date();

  const intro = sanitizeDisplayText(options.intro);

  return {
    id: `msg-a-${stamp.getTime()}`,
    role: "assistant",
    claimElementId: suggestion.claimElementId,
    content:
      intro ||
      (options.version && options.version > 1
        ? "Here's a more technically grounded version based on your refinement request."
        : suggestion.summary),
    suggestion,
    createdAt: suggestion.createdAt,
    timeLabel: suggestion.timeLabel,
  };
}
