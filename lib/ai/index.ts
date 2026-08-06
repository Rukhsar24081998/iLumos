/**
 * Public AI module exports — Phase 4.1 foundation.
 */

export { buildRefinementPrompt } from "@/lib/ai/prompt";
export { AI_SUGGESTION_SCHEMA } from "@/lib/ai/schema";
export type { AISuggestionSchema } from "@/lib/ai/schema";
export {
  normalizeSuggestionResponse,
  parseSuggestionResponse,
  validateSuggestionPayload,
} from "@/lib/ai/parser";
export { generateSuggestion } from "@/lib/ai/gemini";
export type { GeminiGenerateParams } from "@/lib/ai/gemini";
export {
  previewRefinementPrompt,
  requestRefinementSuggestion,
} from "@/lib/ai/service";
export type {
  AIRequest,
  AIResponse,
  ClaimUpdate,
  ConversationTurn,
  EvidenceCitation,
  PromptContext,
  SupportingDocumentContext,
} from "@/lib/ai/types";
