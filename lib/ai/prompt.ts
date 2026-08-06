/**
 * Prompt construction only — no provider calls.
 */

import type { PromptContext } from "@/lib/ai/types";

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
            const excerpt = doc.excerpt?.trim()
              ? `\nExcerpt: ${doc.excerpt.trim()}`
              : "";
            const sourceType = doc.sourceType
              ? ` (${doc.sourceType})`
              : "";
            return `${index + 1}. ${doc.documentName}${sourceType}${excerpt}`;
          })
          .join("\n");

  const history =
    context.conversationHistory.length === 0
      ? "No prior turns."
      : context.conversationHistory
          .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
          .join("\n");

  return [
    "You are an AI assistant helping a patent analyst refine a claim chart.",
    "Return only structured JSON matching the required suggestion schema.",
    "Ground every citation in the supporting documents provided below.",
    "Do not fabricate evidence. If evidence is insufficient, set noEvidenceFound to true.",
    "",
    "## Selected Claim Element",
    `ID: ${context.claimElementId}`,
    `Patent claim element: ${context.patentClaimElement}`,
    `Accused product feature: ${context.accusedProductFeature}`,
    `Current reasoning: ${context.currentReasoning}`,
    `Current evidence source: ${context.currentEvidenceSource}`,
    "",
    "## Supporting Documents",
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
    "proposedUpdates, rationale (optional: evidenceCitations, primarySource, noEvidenceFound).",
  ].join("\n");
}
