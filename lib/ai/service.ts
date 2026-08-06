/**
 * AI orchestration layer.
 *
 * Flow: Prompt Builder → Gemini Client (stream) → Parser → AI Response
 */

import {
  generateSuggestion,
  generateSuggestionWithTimings,
  type GenerateSuggestionResult,
  type StreamProgressHandler,
} from "@/lib/ai/gemini";
import { buildRefinementPrompt } from "@/lib/ai/prompt";
import type { AIRequest, AIResponse } from "@/lib/ai/types";

/**
 * Request a claim-chart refinement suggestion via the Gemini client.
 */
export async function requestRefinementSuggestion(
  request: AIRequest,
  options?: { onProgress?: StreamProgressHandler }
): Promise<AIResponse> {
  return generateSuggestion(request, options);
}

/** Same as requestRefinementSuggestion with timing metrics (dev logs). */
export async function requestRefinementSuggestionWithTimings(
  request: AIRequest,
  options?: { onProgress?: StreamProgressHandler }
): Promise<GenerateSuggestionResult> {
  return generateSuggestionWithTimings(request, options);
}

/**
 * Build a refinement prompt without invoking the provider.
 */
export function previewRefinementPrompt(request: AIRequest): string {
  return buildRefinementPrompt(request.context);
}
