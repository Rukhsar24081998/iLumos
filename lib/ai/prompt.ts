/**
 * Prompt construction only — no provider calls.
 */

import type { PromptContext } from "@/lib/ai/types";

function formatStatus(status: string | undefined): string {
  if (!status) return "Not provided";
  return status.replace(/_/g, " ");
}

/**
 * Build a single refinement prompt from claim context, documents,
 * conversation history, and the analyst instruction.
 */
export function buildRefinementPrompt(context: PromptContext): string {
  const documents =
    context.supportingDocuments.length === 0
      ? "None provided."
      : context.supportingDocuments
          .map((doc, index) => {
            const parts = [
              `${index + 1}. ${doc.documentName}`,
              doc.sourceType ? `Type: ${doc.sourceType}` : null,
              doc.source ? `Context: ${doc.source}` : null,
              doc.citation ? `Citation metadata: ${doc.citation}` : null,
              typeof doc.confidence === "number"
                ? `Evidence confidence: ${doc.confidence.toFixed(2)}`
                : null,
              doc.excerpt?.trim() ? `Excerpt: ${doc.excerpt.trim()}` : null,
            ].filter(Boolean);
            return parts.join("\n   ");
          })
          .join("\n");

  const uploadedNames =
    context.uploadedDocumentNames.length === 0
      ? "None provided."
      : context.uploadedDocumentNames.map((name) => `- ${name}`).join("\n");

  const history =
    context.conversationHistory.length === 0
      ? "No prior turns."
      : context.conversationHistory
          .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
          .join("\n");

  return [
    "You are an AI assistant helping a patent analyst refine a claim chart for litigation readiness.",
    "",
    "## Output rules",
    "- Return ONLY a single JSON object matching the required suggestion schema. No markdown fences.",
    "- Ground every statement and citation ONLY in the supporting documents and excerpts below.",
    "- Never invent documents, page numbers, excerpts, or citations.",
    "- Cite only document names from the uploaded document list.",
    "- Prefer technical / engineering documentation over marketing materials when the analyst asks for stronger technical support, or when both exist.",
    "- Write concise, litigation-ready reasoning (plain meaning, evidence-backed mapping).",
    "- If evidence is insufficient: set noEvidenceFound to true, explain what is missing in summary/supportingEvidence/rationale, and recommend what evidence is required. Do not fabricate a citation.",
    "- confidence must be a realistic number from 0 to 1 (never default to 0). Score using evidence quality, quantity, relevance, and reasoning certainty.",
    "- Confidence guidance: strong multi-source technical support ≈ 0.85–0.95; single solid technical source ≈ 0.7–0.85; marketing-only or weak support ≈ 0.45–0.65; insufficient evidence ≈ 0.2–0.4.",
    "- proposedUpdates must always include claimElementId and meaningful reasoning / evidenceSource fields that reflect your suggested claim-chart edit.",
    "- When proposing a new chart row, set proposedUpdates.isNewRowProposal to true and include patentClaimElement and accusedProductFeature.",
    "",
    "## Selected Claim Element",
    `ID: ${context.claimElementId}`,
    `Status: ${formatStatus(context.claimStatus)}`,
    `Patent claim element: ${context.patentClaimElement}`,
    `Accused product feature: ${context.accusedProductFeature}`,
    `Current reasoning: ${context.currentReasoning}`,
    `Current evidence source: ${context.currentEvidenceSource}`,
    "",
    "## Uploaded Document Names (valid citation sources)",
    uploadedNames,
    "",
    "## Supporting Document Snippets & Metadata",
    documents,
    "",
    "## Conversation History",
    history,
    "",
    "## Analyst Instruction",
    context.analystInstruction.trim(),
    "",
    "## Required JSON Fields",
    "summary, improvedReasoning, supportingEvidence, citation, confidence,",
    "proposedUpdates (with claimElementId + reasoning), rationale.",
    "Optional: evidenceCitations[], primarySource, noEvidenceFound.",
  ].join("\n");
}
