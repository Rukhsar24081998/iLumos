import { EVIDENCE_ITEMS, MATTER } from "@/data/mockWorkspace";
import type {
  ChatMessage,
  ClaimElement,
  SuggestionPayload,
} from "@/types/workspace";

import type {
  ClaimChartExportSnapshot,
  ExportAcceptedRefinement,
  ExportClaimElement,
  ExportEvidenceItem,
  ExportReviewStatus,
  ExportSummary,
} from "@/lib/export/types";

function suggestionsForClaim(
  messagesByClaim: Record<string, ChatMessage[]>,
  claimElementId: string
): SuggestionPayload[] {
  const collected: SuggestionPayload[] = [];
  for (const messages of Object.values(messagesByClaim)) {
    for (const message of messages) {
      const suggestion = message.suggestion;
      if (!suggestion) continue;
      if (suggestion.claimElementId === claimElementId) {
        collected.push(suggestion);
      }
    }
  }
  return collected;
}

function latestByStatus(
  suggestions: SuggestionPayload[],
  status: SuggestionPayload["status"]
): SuggestionPayload | null {
  for (let index = suggestions.length - 1; index >= 0; index -= 1) {
    const suggestion = suggestions[index];
    if (suggestion?.status === status) return suggestion;
  }
  return null;
}

/**
 * Map workspace claim + suggestion state to export review labels.
 * Pending suggestions take priority; accepted chart rows → Accepted;
 * rejected without a later accept → Rejected; otherwise Needs Review.
 */
function deriveReviewStatus(
  element: ClaimElement,
  suggestions: SuggestionPayload[]
): ExportReviewStatus {
  if (suggestions.some((suggestion) => suggestion.status === "pending")) {
    return "Pending";
  }

  if (element.status === "accepted" || element.status === "improved") {
    return "Accepted";
  }

  const latestAccepted = latestByStatus(suggestions, "accepted");
  const latestRejected = latestByStatus(suggestions, "rejected");

  if (latestRejected) {
    const rejectedIndex = suggestions.lastIndexOf(latestRejected);
    const acceptedIndex = latestAccepted
      ? suggestions.lastIndexOf(latestAccepted)
      : -1;
    if (rejectedIndex > acceptedIndex) {
      return "Rejected";
    }
  }

  return "Needs Review";
}

function buildAcceptedRefinement(
  suggestions: SuggestionPayload[]
): ExportAcceptedRefinement | null {
  const accepted = latestByStatus(suggestions, "accepted");
  if (!accepted) return null;

  return {
    version: accepted.version ?? 1,
    title: accepted.title,
    reasoning: accepted.suggestedReasoning,
    confidence:
      typeof accepted.confidence === "number" ? accepted.confidence : null,
    primarySource: accepted.primarySource,
    citation: accepted.citation,
  };
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function buildExportElement(
  element: ClaimElement,
  messagesByClaim: Record<string, ChatMessage[]>
): ExportClaimElement {
  const suggestions = suggestionsForClaim(messagesByClaim, element.id);
  const reviewStatus = deriveReviewStatus(element, suggestions);
  const acceptedRefinement = buildAcceptedRefinement(suggestions);
  const latestAccepted = latestByStatus(suggestions, "accepted");

  const baseEvidence = EVIDENCE_ITEMS.filter(
    (item) => item.claimElementId === element.id
  );

  const evidenceItems: ExportEvidenceItem[] = baseEvidence.map((item) => ({
    documentName: item.documentName,
    snippet: item.snippet,
    citation: item.citation,
    confidence: item.confidence,
  }));

  if (latestAccepted) {
    const sources = latestAccepted.evidenceSources ?? [];
    for (const source of sources) {
      if (evidenceItems.some((item) => item.documentName === source)) continue;
      evidenceItems.push({
        documentName: source,
        snippet: latestAccepted.evidence || "",
        citation: latestAccepted.citation || source,
        confidence:
          typeof latestAccepted.confidence === "number"
            ? latestAccepted.confidence
            : null,
      });
    }
  }

  const supportingDocuments = uniqueNonEmpty([
    ...evidenceItems.map((item) => item.documentName),
    ...(latestAccepted?.evidenceSources ?? []),
    element.evidenceSource,
  ]);

  const evidenceSnippets = uniqueNonEmpty([
    ...evidenceItems.map((item) => item.snippet),
    ...(latestAccepted?.evidence ? [latestAccepted.evidence] : []),
  ]);

  const evidenceCitations = uniqueNonEmpty([
    ...evidenceItems.map((item) => item.citation),
    ...(latestAccepted?.citation ? [latestAccepted.citation] : []),
    element.evidenceSource,
  ]);

  const confidenceValues = [
    ...evidenceItems
      .map((item) => item.confidence)
      .filter((value): value is number => typeof value === "number"),
    ...(typeof latestAccepted?.confidence === "number"
      ? [latestAccepted.confidence]
      : []),
  ];

  const overallConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, value) => sum + value, 0) /
        confidenceValues.length
      : null;

  // Chart row already holds accepted or original reasoning after Accept/Reject.
  const reasoning = element.reasoning;

  return {
    id: element.id,
    originalClaimText: element.patentClaimElement,
    reviewStatus,
    reasoning,
    overallConfidence,
    supportingDocuments,
    evidenceSnippets,
    evidenceCitations,
    supportingDocumentCount: supportingDocuments.length,
    evidenceItems,
    acceptedRefinement,
  };
}

function buildSummary(elements: ExportClaimElement[]): ExportSummary {
  const counts = {
    accepted: 0,
    rejected: 0,
    pending: 0,
    needsReview: 0,
  };

  for (const element of elements) {
    switch (element.reviewStatus) {
      case "Accepted":
        counts.accepted += 1;
        break;
      case "Rejected":
        counts.rejected += 1;
        break;
      case "Pending":
        counts.pending += 1;
        break;
      default:
        counts.needsReview += 1;
        break;
    }
  }

  const confidences = elements
    .map((element) => element.overallConfidence)
    .filter((value): value is number => typeof value === "number");

  const averageConfidence =
    confidences.length > 0
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : null;

  return {
    totalClaimElements: elements.length,
    accepted: counts.accepted,
    rejected: counts.rejected,
    pending: counts.pending,
    needsReview: counts.needsReview,
    averageConfidence,
  };
}

/**
 * Build an export snapshot from the live workspace chart + chat state.
 */
export function buildExportSnapshot(
  elements: ClaimElement[],
  messagesByClaim: Record<string, ChatMessage[]>,
  generatedAt: Date = new Date()
): ClaimChartExportSnapshot {
  const exportElements = elements.map((element) =>
    buildExportElement(element, messagesByClaim)
  );

  return {
    patentTitle: MATTER.title,
    patentId: MATTER.patentId,
    generatedAt,
    elements: exportElements,
    summary: buildSummary(exportElements),
  };
}

export function exportFilename(patentId: string): string {
  const safe = patentId.replace(/[^\w.-]+/g, "_") || "ClaimChart";
  return `ClaimChart_${safe}.docx`;
}
