/**
 * Public AI module exports — Phase 4.2 Gemini client.
 */

export { buildRefinementPrompt } from "@/lib/ai/prompt";
export { AI_SUGGESTION_SCHEMA } from "@/lib/ai/schema";
export type { AISuggestionSchema } from "@/lib/ai/schema";
export {
  normalizeSuggestionResponse,
  parseSuggestionResponse,
  validateSuggestionPayload,
} from "@/lib/ai/parser";
export { generateSuggestion, generateSuggestionWithTimings } from "@/lib/ai/gemini";
export type {
  GenerateSuggestionResult,
  GenerateSuggestionTimings,
  StreamProgressHandler,
} from "@/lib/ai/gemini";
export {
  previewRefinementPrompt,
  requestRefinementSuggestion,
  requestRefinementSuggestionWithTimings,
} from "@/lib/ai/service";
export {
  clearEvidenceContextCache,
  getCachedEvidenceContext,
} from "@/lib/ai/evidenceContextCache";
export {
  AIClientError,
  AIParseError,
  isAIClientError,
  isAIParseError,
} from "@/lib/ai/errors";
export type { AIErrorCode } from "@/lib/ai/errors";
export type {
  AIRequest,
  AIResponse,
  ClaimUpdate,
  ConversationTurn,
  EvidenceCitation,
  PromptContext,
  SupportingDocumentContext,
} from "@/lib/ai/types";
export {
  clampConfidence,
  normalizeConfidenceForDisplay,
  sanitizeDisplayText,
} from "@/lib/ai/displayText";
export { EXAMPLE_AI_RESPONSE } from "@/lib/ai/exampleResponse";
export {
  mapAIResponseToAssistantMessage,
  mapAIResponseToSuggestion,
} from "@/lib/ai/mapper";
export type { MapSuggestionOptions } from "@/lib/ai/mapper";
export { buildAIRequest, buildPromptContext } from "@/lib/ai/buildRequest";
export { resolveAssistantMessage } from "@/lib/ai/workspaceBridge";
export type {
  ResolveAssistantParams,
  ResolveAssistantResult,
  WorkspaceAIMode,
} from "@/lib/ai/workspaceBridge";
export {
  classifyWorkspaceError,
  isRetryableWorkspaceError,
  userFacingMessage,
} from "@/lib/ai/userFacingErrors";
export type { WorkspaceFailureKind } from "@/lib/ai/userFacingErrors";
