/**
 * AI domain types for Phase 4 foundation.
 * No business logic — request/response contracts only.
 */

/** Supporting document excerpt available for grounding. */
export interface SupportingDocumentContext {
  documentName: string;
  excerpt?: string;
  sourceType?: string;
  /** Full citation label from the evidence panel, when available. */
  citation?: string;
  /** Human-readable source / context line. */
  source?: string;
  /** Evidence-item confidence (0–1), when available. */
  confidence?: number;
}

/** Citation returned by the AI for a suggestion. */
export interface EvidenceCitation {
  documentName: string;
  excerpt: string;
  location?: string;
}

/** Proposed field-level updates to a claim element. */
export interface ClaimUpdate {
  claimElementId: string;
  reasoning?: string;
  accusedProductFeature?: string;
  evidenceSource?: string;
  patentClaimElement?: string;
  /** When true, Accept should add a new claim chart row. */
  isNewRowProposal?: boolean;
}

/** Conversation turn included in prompt context. */
export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Inputs used to build a refinement prompt. */
export interface PromptContext {
  claimElementId: string;
  patentClaimElement: string;
  accusedProductFeature: string;
  currentReasoning: string;
  currentEvidenceSource: string;
  /** Claim chart status (needs_review | improved | accepted). */
  claimStatus?: string;
  supportingDocuments: SupportingDocumentContext[];
  /** Distinct uploaded document names available for citation. */
  uploadedDocumentNames: string[];
  conversationHistory: ConversationTurn[];
  analystInstruction: string;
}

/** Orchestrated request into the AI service layer. */
export interface AIRequest {
  context: PromptContext;
  /** Optional caller-supplied correlation id for logging. */
  requestId?: string;
}

/** Normalized structured response from the AI layer. */
export interface AIResponse {
  summary: string;
  improvedReasoning: string;
  supportingEvidence: string;
  citation: string;
  confidence: number;
  proposedUpdates: ClaimUpdate;
  rationale: string;
  evidenceCitations: EvidenceCitation[];
  primarySource?: string;
  /** True when the model could not find supporting evidence. */
  noEvidenceFound?: boolean;
}
