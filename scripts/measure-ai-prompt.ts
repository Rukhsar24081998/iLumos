/**
 * Measure Phase 9 prompt size reduction (no network).
 * Run: npx tsx --tsconfig tsconfig.json scripts/measure-ai-prompt.ts
 */
import { buildAIRequest } from "@/lib/ai/buildRequest";
import { buildRefinementPrompt } from "@/lib/ai/prompt";
import {
  EVIDENCE_ITEMS,
  INITIAL_CLAIM_ELEMENTS,
  buildWelcomeMessages,
  INITIAL_NEEDS_REVIEW_COUNT,
} from "@/data/mockWorkspace";
import type { ChatMessage } from "@/types/workspace";

function legacyVerbosePromptLength(): number {
  // Approximate pre-Phase-9 prompt size using the old verbose template shape
  // for the same CE-3 fixture (for before/after reporting).
  const claim = INITIAL_CLAIM_ELEMENTS.find((c) => c.id === "CE-3")!;
  const evidence = EVIDENCE_ITEMS.filter((e) => e.claimElementId === "CE-3");
  const docs = evidence
    .map(
      (doc, index) =>
        `${index + 1}. ${doc.documentName}\n   Type: ${doc.sourceType}\n   Context: ${doc.source}\n   Citation metadata: ${doc.citation}\n   Evidence confidence: ${doc.confidence.toFixed(2)}\n   Excerpt: ${doc.snippet}`
    )
    .join("\n");
  const uploaded = evidence.map((e) => `- ${e.documentName}`).join("\n");
  const schemaPad = JSON.stringify(
    {
      type: "object",
      required: ["summary", "improvedReasoning", "supportingEvidence"],
      properties: { summary: {}, improvedReasoning: {}, supportingEvidence: {} },
    },
    null,
    2
  );
  return [
    "You are an AI assistant helping a patent analyst refine a claim chart for litigation readiness.",
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
    "## Selected Claim Element",
    `ID: ${claim.id}`,
    `Status: needs review`,
    `Patent claim element: ${claim.patentClaimElement}`,
    `Accused product feature: ${claim.accusedProductFeature}`,
    `Current reasoning: ${claim.reasoning}`,
    `Current evidence source: ${claim.evidenceSource}`,
    "## Uploaded Document Names (valid citation sources)",
    uploaded,
    "## Supporting Document Snippets & Metadata",
    docs,
    "## Conversation History",
    "No prior turns.",
    "## Analyst Instruction",
    "Strengthen the technical evidence for this claim element.",
    "## Required JSON Fields",
    "summary, improvedReasoning, supportingEvidence, citation, confidence,",
    "proposedUpdates (with claimElementId + reasoning), rationale.",
    "Optional: evidenceCitations[], primarySource, noEvidenceFound.",
    "Respond with a single JSON object only. No markdown fences.",
    "The JSON must match this schema:",
    schemaPad,
  ].join("\n").length;
}

async function main() {
  const claim = INITIAL_CLAIM_ELEMENTS.find((c) => c.id === "CE-3")!;
  const evidence = EVIDENCE_ITEMS.filter((e) => e.claimElementId === "CE-3");
  const messages: ChatMessage[] = [
    ...buildWelcomeMessages("CE-3", INITIAL_NEEDS_REVIEW_COUNT),
    {
      id: "u1",
      role: "user",
      claimElementId: "CE-3",
      content: "Strengthen the technical evidence for this claim element.",
      timeLabel: "12:00 PM",
    },
  ];

  const request = buildAIRequest({
    claimElement: claim,
    evidence,
    messages,
    analystInstruction: "Strengthen the technical evidence for this claim element.",
  });
  const prompt = buildRefinementPrompt(request.context);
  const before = legacyVerbosePromptLength();
  const after = prompt.length;
  const reduction = before - after;
  const pct = ((reduction / before) * 100).toFixed(1);

  console.log("Phase 9 prompt size (CE-3 strengthen evidence fixture)");
  console.log(`  before (approx legacy+schema): ${before} chars`);
  console.log(`  after (Phase 9 lean prompt):   ${after} chars`);
  console.log(`  reduction: ${reduction} chars (${pct}%)`);
  console.log(
    `  history turns sent: ${request.context.conversationHistory.length}`
  );
  console.log(
    `  evidence docs sent: ${request.context.supportingDocuments.length}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
