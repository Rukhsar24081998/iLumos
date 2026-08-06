/**
 * Expected structured AI response shape.
 * Parsing / validation lives in parser.ts — this module is schema only.
 */

import type { ClaimUpdate, EvidenceCitation } from "@/lib/ai/types";

/**
 * Canonical fields the model should return as structured JSON.
 * Keep this aligned with AIResponse in types.ts.
 */
export const AI_SUGGESTION_SCHEMA = {
  type: "object",
  required: [
    "summary",
    "improvedReasoning",
    "supportingEvidence",
    "citation",
    "confidence",
    "proposedUpdates",
    "rationale",
  ],
  properties: {
    summary: {
      type: "string",
      description: "Short conversational summary of the suggestion (2–3 sentences).",
    },
    improvedReasoning: {
      type: "string",
      description: "Improved legal/technical reasoning for the claim element.",
    },
    supportingEvidence: {
      type: "string",
      description: "Evidence narrative supporting the proposed update.",
    },
    citation: {
      type: "string",
      description: "Primary citation string (document + location).",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Model confidence between 0 and 1.",
    },
    proposedUpdates: {
      type: "object",
      description: "Field-level claim chart updates to apply on Accept.",
      required: ["claimElementId"],
      properties: {
        claimElementId: { type: "string" },
        reasoning: { type: "string" },
        accusedProductFeature: { type: "string" },
        evidenceSource: { type: "string" },
        patentClaimElement: { type: "string" },
        isNewRowProposal: { type: "boolean" },
      },
    },
    rationale: {
      type: "string",
      description: "Brief explanation of why this change is recommended.",
    },
    evidenceCitations: {
      type: "array",
      description: "Optional list of grounded evidence citations.",
      items: {
        type: "object",
        required: ["documentName", "excerpt"],
        properties: {
          documentName: { type: "string" },
          excerpt: { type: "string" },
          location: { type: "string" },
        },
      },
    },
    primarySource: {
      type: "string",
      description: "Primary supporting document name.",
    },
    noEvidenceFound: {
      type: "boolean",
      description: "True when no suitable evidence was found in provided documents.",
    },
  },
} as const;

/** Runtime shape expected from the model before normalization. */
export interface AISuggestionSchema {
  summary: string;
  improvedReasoning: string;
  supportingEvidence: string;
  citation: string;
  confidence: number;
  proposedUpdates: ClaimUpdate;
  rationale: string;
  evidenceCitations?: EvidenceCitation[];
  primarySource?: string;
  noEvidenceFound?: boolean;
}
