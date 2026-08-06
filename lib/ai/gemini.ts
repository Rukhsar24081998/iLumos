/**
 * Gemini provider client — placeholder only.
 * Phase 4.2 will add real API calls and API key usage.
 */

import type { AISuggestionSchema } from "@/lib/ai/schema";

export interface GeminiGenerateParams {
  prompt: string;
  requestId?: string;
}

/**
 * Generate a structured suggestion via Gemini.
 * Not implemented in Phase 4.1 — no network calls, no API keys.
 */
export async function generateSuggestion(
  _params: GeminiGenerateParams
): Promise<AISuggestionSchema> {
  void _params;
  throw new Error(
    "Gemini generateSuggestion is not implemented yet (Phase 4.1 foundation only)."
  );
}
