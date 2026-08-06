/**
 * Map AI service responses onto existing workspace SuggestionPayload / ChatMessage.
 * Does not change UI models — only adapts AIResponse into current shapes.
 */

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
    response.proposedUpdates.claimElementId || options.claimElementId;

  const evidenceSources =
    response.evidenceCitations.length > 0
      ? Array.from(
          new Set(response.evidenceCitations.map((item) => item.documentName))
        )
      : response.primarySource
        ? [response.primarySource]
        : [];

  const isNewRow =
    options.isNewRowProposal ??
    response.proposedUpdates.isNewRowProposal ??
    false;

  const titleBase = isNewRow
    ? "Add Missing Feature"
    : "AI Refinement Suggestion";

  return {
    id: `ai-${claimElementId}-${stamp.getTime()}`,
    claimElementId,
    title:
      version > 1
        ? `${titleBase} — Version ${version}`
        : `${titleBase} — ${claimElementId}`,
    summary: response.summary,
    primarySource:
      response.primarySource ??
      evidenceSources[0] ??
      "Supporting documents",
    citation: response.citation,
    confidence: response.confidence,
    originalReasoning: options.originalReasoning,
    suggestedReasoning:
      response.proposedUpdates.reasoning ?? response.improvedReasoning,
    evidence: response.supportingEvidence,
    evidenceSources,
    status: "pending",
    createdAt: stamp.toISOString(),
    timeLabel: formatTimeLabel(stamp),
    version,
    isNewRowProposal: isNewRow,
    proposedPatentClaimElement:
      options.proposedPatentClaimElement ??
      response.proposedUpdates.patentClaimElement,
    proposedAccusedProductFeature:
      options.proposedAccusedProductFeature ??
      response.proposedUpdates.accusedProductFeature,
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

  return {
    id: `msg-a-${stamp.getTime()}`,
    role: "assistant",
    claimElementId: suggestion.claimElementId,
    content:
      options.intro ??
      (options.version && options.version > 1
        ? "Here's a more technically grounded version based on your refinement request."
        : suggestion.summary),
    suggestion,
    createdAt: suggestion.createdAt,
    timeLabel: suggestion.timeLabel,
  };
}
