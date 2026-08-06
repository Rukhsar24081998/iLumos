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
export { generateSuggestion } from "@/lib/ai/gemini";
export {
  previewRefinementPrompt,
  requestRefinementSuggestion,
} from "@/lib/ai/service";
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
export { EXAMPLE_AI_RESPONSE } from "@/lib/ai/exampleResponse";
