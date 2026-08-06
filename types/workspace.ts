/** Workspace domain types for Phase 3 (UI + mock interactions). */

export type ClaimStatus = "needs_review" | "improved" | "accepted";

export interface ClaimElement {
  id: string;
  patentClaimElement: string;
  accusedProductFeature: string;
  reasoning: string;
  evidenceSource: string;
  status: ClaimStatus;
  keywords: string[];
}

export interface EvidenceItem {
  id: string;
  claimElementId: string;
  documentName: string;
  snippet: string;
  source: string;
  sourceType: string;
  citation: string;
  confidence: number;
}

export interface SuggestionPayload {
  id: string;
  claimElementId: string;
  title: string;
  /** Short conversational summary shown by default (2–3 sentences). */
  summary: string;
  primarySource: string;
  citation: string;
  confidence: number;
  originalReasoning: string;
  suggestedReasoning: string;
  evidence: string;
  evidenceSources: string[];
  status: "pending" | "accepted" | "rejected";
  createdAt?: string;
  /** Preformatted display time — never locale-format during render. */
  timeLabel?: string;
  /** Refinement version within the conversation (1, 2, 3…). */
  version?: number;
  /** When true, Accept adds a new claim chart row (Scenario 3). */
  isNewRowProposal?: boolean;
  proposedPatentClaimElement?: string;
  proposedAccusedProductFeature?: string;
}

export type ChatRole = "user" | "assistant" | "system" | "welcome";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  claimElementId: string;
  suggestion?: SuggestionPayload;
  createdAt?: string;
  /** Preformatted display time — never locale-format during render. */
  timeLabel?: string;
  /**
   * Frozen at welcome creation so the intro count does not mutate
   * when claim statuses change later in the session.
   */
  introNeedsReviewCount?: number;
}

export interface PromptChip {
  id: string;
  label: string;
  prompt: string;
  scenarioKey: ScenarioKey;
}

export type ScenarioKey =
  | "strengthen_evidence"
  | "fix_weak_reasoning"
  | "add_missing_feature"
  | "clarify_legal"
  | "refine_further";
