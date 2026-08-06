/**
 * AI orchestration layer.
 *
 * Future flow:
 *   Prompt Builder → Gemini Client → Parser → AI Response
 *
 * Phase 4.1 uses placeholders only — no live Gemini calls.
 */

import { generateSuggestion } from "@/lib/ai/gemini";
import { parseSuggestionResponse } from "@/lib/ai/parser";
import { buildRefinementPrompt } from "@/lib/ai/prompt";
import type { AIRequest, AIResponse } from "@/lib/ai/types";

/**
 * Request a claim-chart refinement suggestion.
 * Builds the prompt, calls the provider, and parses the result.
 */
export async function requestRefinementSuggestion(
  request: AIRequest
): Promise<AIResponse> {
  const prompt = buildRefinementPrompt(request.context);

  try {
    const raw = await generateSuggestion({
      prompt,
      requestId: request.requestId,
    });
    return parseSuggestionResponse(raw);
  } catch (error) {
    // Phase 4.1: provider is intentionally unimplemented.
    // Re-throw so callers can keep using mock UI until Phase 4.2.
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("AI service request failed.");
  }
}

/**
 * Build a refinement prompt without invoking the provider.
 * Useful for tests and Phase 4.2 integration wiring.
 */
export function previewRefinementPrompt(request: AIRequest): string {
  return buildRefinementPrompt(request.context);
}
