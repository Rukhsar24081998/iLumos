/**
 * Gemini provider client — Phase 4.2.
 * Server/script use only. Do not import from Client Components.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

import { AIClientError, AIParseError } from "@/lib/ai/errors";
import { aiDebug, aiWarn } from "@/lib/ai/logger";
import { parseSuggestionResponse } from "@/lib/ai/parser";
import { buildRefinementPrompt } from "@/lib/ai/prompt";
import { AI_SUGGESTION_SCHEMA } from "@/lib/ai/schema";
import type { AIRequest, AIResponse } from "@/lib/ai/types";

const DEFAULT_MODEL = "gemini-2.0-flash";
const MAX_ATTEMPTS = 2;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new AIClientError(
      "MISSING_API_KEY",
      "GEMINI_API_KEY is not set. Add it to .env.local for local AI calls."
    );
  }
  return key;
}

function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function schemaInstruction(): string {
  return [
    "Respond with a single JSON object only. No markdown fences.",
    "The JSON must match this schema:",
    JSON.stringify(AI_SUGGESTION_SCHEMA, null, 2),
  ].join("\n");
}

function isRetryableProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const message = error.message.toLowerCase();
  if (message.includes("429") || message.includes("rate")) return true;
  if (message.includes("500") || message.includes("503")) return true;
  if (message.includes("timeout") || message.includes("timed out")) return true;
  if (message.includes("fetch failed") || message.includes("network")) return true;
  if (message.includes("econnreset") || message.includes("enotfound")) return true;
  return false;
}

function mapProviderError(error: unknown): AIClientError {
  if (error instanceof AIClientError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : "Unknown Gemini provider error.";
  const lower = message.toLowerCase();

  if (
    lower.includes("safety") ||
    lower.includes("blocked") ||
    lower.includes("blockedprompt")
  ) {
    return new AIClientError(
      "SAFETY_BLOCKED",
      "Gemini blocked the response for safety reasons. Try rephrasing the request.",
      { cause: error }
    );
  }

  if (
    lower.includes("api key") ||
    lower.includes("api_key") ||
    lower.includes("permission denied") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return new AIClientError(
      "MISSING_API_KEY",
      "Gemini rejected the API key or permissions. Check GEMINI_API_KEY.",
      { cause: error }
    );
  }

  if (isRetryableProviderError(error)) {
    return new AIClientError(
      "NETWORK",
      "Gemini request failed due to a network or transient provider error.",
      { retryable: true, cause: error }
    );
  }

  return new AIClientError("PROVIDER", "Gemini request failed.", {
    cause: error,
  });
}

async function callGeminiOnce(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  const modelName = getModelName();
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  aiDebug("Calling Gemini", { model: modelName });

  let result;
  try {
    result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${schemaInstruction()}\n\n${prompt}` }],
        },
      ],
    });
  } catch (error) {
    throw mapProviderError(error);
  }

  const response = result.response;
  const promptBlock = response.promptFeedback?.blockReason;
  const finishReason = response.candidates?.[0]?.finishReason;
  const blocked =
    (promptBlock && String(promptBlock).toUpperCase().includes("SAFETY")) ||
    (finishReason && String(finishReason).toUpperCase().includes("SAFETY"));

  if (blocked) {
    throw new AIClientError(
      "SAFETY_BLOCKED",
      "Gemini blocked the response for safety reasons.",
      { cause: { promptBlock, finishReason } }
    );
  }

  const text = response.text()?.trim();
  if (!text) {
    throw new AIClientError(
      "EMPTY_RESPONSE",
      "Gemini returned an empty response."
    );
  }

  return text;
}

async function callGeminiWithRetry(prompt: string): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callGeminiOnce(prompt);
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof AIClientError
          ? error.retryable
          : isRetryableProviderError(error);

      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw mapProviderError(error);
      }

      aiWarn("Transient Gemini failure; retrying once", {
        attempt,
        code: error instanceof AIClientError ? error.code : "UNKNOWN",
      });
    }
  }

  throw mapProviderError(lastError);
}

/**
 * Generate a structured claim-chart refinement suggestion via Gemini.
 *
 * Input: AIRequest
 * Output: AIResponse matching AI_SUGGESTION_SCHEMA (validated)
 */
export async function generateSuggestion(
  request: AIRequest
): Promise<AIResponse> {
  const prompt = buildRefinementPrompt(request.context);
  aiDebug("Built refinement prompt", {
    requestId: request.requestId,
    claimElementId: request.context.claimElementId,
    promptChars: prompt.length,
  });

  try {
    const rawText = await callGeminiWithRetry(prompt);
    return parseSuggestionResponse(rawText, {
      fallbackClaimElementId: request.context.claimElementId,
    });
  } catch (error) {
    if (error instanceof AIParseError) {
      aiWarn("Gemini response failed validation", {
        requestId: request.requestId,
        message: error.message,
      });
      throw error;
    }
    if (error instanceof AIClientError) {
      aiWarn("Gemini client error", {
        requestId: request.requestId,
        code: error.code,
        message: error.message,
      });
      throw error;
    }
    aiWarn("Unexpected Gemini failure", {
      requestId: request.requestId,
    });
    throw mapProviderError(error);
  }
}
