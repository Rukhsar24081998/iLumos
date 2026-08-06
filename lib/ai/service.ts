/**
 * AI orchestration layer.
 *
 * Flow: Prompt Builder → Gemini Client → Parser → AI Response
 * (Gemini client owns prompt build + parse in Phase 4.2.)
 */

import { generateSuggestion } from "@/lib/ai/gemini";
import { buildRefinementPrompt } from "@/lib/ai/prompt";
import type { AIRequest, AIResponse } from "@/lib/ai/types";

/**
 * Request a claim-chart refinement suggestion via the Gemini client.
 * Workspace UI remains on mock data until Phase 4.3.
 */
export async function requestRefinementSuggestion(
  request: AIRequest
): Promise<AIResponse> {
  return generateSuggestion(request);
}

/**
 * Build a refinement prompt without invoking the provider.
 */
export function previewRefinementPrompt(request: AIRequest): string {
  return buildRefinementPrompt(request.context);
}
