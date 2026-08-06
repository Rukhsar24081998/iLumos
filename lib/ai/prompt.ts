/**
 * Compact prompt construction — latency-focused, same grounding rules.
 */

import type { PromptContext } from "@/lib/ai/types";

function formatStatus(status: string | undefined): string {
  if (!status) return "n/a";
  return status.replace(/_/g, " ");
}

/**
 * Build a lean refinement prompt: selected claim, its evidence only,
 * recent conversation, and the analyst instruction.
 */
export function buildRefinementPrompt(context: PromptContext): string {
  const documents =
    context.supportingDocuments.length === 0
      ? "(none)"
      : context.supportingDocuments
          .map((doc, index) => {
            const excerpt = doc.excerpt?.trim() || "";
            const cite = doc.citation?.trim() || doc.documentName;
            return `${index + 1}. ${doc.documentName}${doc.sourceType ? ` [${doc.sourceType}]` : ""}\n   cite: ${cite}\n   excerpt: ${excerpt}`;
          })
          .join("\n");

  const uploadedNames =
    context.uploadedDocumentNames.length === 0
      ? "(none)"
      : context.uploadedDocumentNames.join(", ");

  const history =
    context.conversationHistory.length === 0
      ? "(none)"
      : context.conversationHistory
          .map((turn) => `${turn.role}: ${turn.content}`)
          .join("\n");

  return [
    "Patent claim-chart assistant. Return ONE JSON object only (no markdown).",
    "Rules: ground only in docs/excerpts below; never invent citations/docs; prefer technical over marketing; if evidence is weak set noEvidenceFound=true and say what is missing; confidence 0–1 from evidence quality (never 0).",
    "Fields: summary (2 sentences), improvedReasoning, supportingEvidence, citation, confidence, proposedUpdates{claimElementId,reasoning,evidenceSource?,accusedProductFeature?,patentClaimElement?,isNewRowProposal?}, rationale, optional evidenceCitations[], primarySource, noEvidenceFound.",
    "",
    "CLAIM",
    `id=${context.claimElementId} status=${formatStatus(context.claimStatus)}`,
    `element: ${context.patentClaimElement}`,
    `accused: ${context.accusedProductFeature}`,
    `reasoning: ${context.currentReasoning}`,
    `evidenceSource: ${context.currentEvidenceSource}`,
    "",
    `VALID_DOCS: ${uploadedNames}`,
    "EVIDENCE",
    documents,
    "",
    "RECENT_TURNS",
    history,
    "",
    "INSTRUCTION",
    context.analystInstruction.trim(),
  ].join("\n");
}
