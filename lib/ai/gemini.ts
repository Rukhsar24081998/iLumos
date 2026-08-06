/**
 * Gemini provider client — Phase 4.2 / 4.3.
 * Server/script use only. Do not import from Client Components.
 */

import {
  GoogleGenerativeAI,
  GoogleGenerativeAIAbortError,
  GoogleGenerativeAIFetchError,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";

import { AIClientError, AIParseError } from "@/lib/ai/errors";
import { aiDebug, aiWarn } from "@/lib/ai/logger";
import { parseSuggestionResponse } from "@/lib/ai/parser";
import { buildRefinementPrompt } from "@/lib/ai/prompt";
import { AI_SUGGESTION_SCHEMA } from "@/lib/ai/schema";
import type { AIRequest, AIResponse } from "@/lib/ai/types";

/**
 * SDK responseSchema for generateContent (OpenAPI subset).
 * Constrains the model to emit valid JSON matching our suggestion shape.
 */
const GEMINI_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: [
    "summary",
    "improvedReasoning",
    "supportingEvidence",
    "citation",
    "confidence",
    "proposedUpdates",
    "rationale",
  ],
  properties: {
    summary: { type: SchemaType.STRING },
    improvedReasoning: { type: SchemaType.STRING },
    supportingEvidence: { type: SchemaType.STRING },
    citation: { type: SchemaType.STRING },
    confidence: { type: SchemaType.NUMBER },
    proposedUpdates: {
      type: SchemaType.OBJECT,
      required: ["claimElementId"],
      properties: {
        claimElementId: { type: SchemaType.STRING },
        reasoning: { type: SchemaType.STRING },
        accusedProductFeature: { type: SchemaType.STRING },
        evidenceSource: { type: SchemaType.STRING },
        patentClaimElement: { type: SchemaType.STRING },
        isNewRowProposal: { type: SchemaType.BOOLEAN },
      },
    },
    rationale: { type: SchemaType.STRING },
    evidenceCitations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["documentName", "excerpt"],
        properties: {
          documentName: { type: SchemaType.STRING },
          excerpt: { type: SchemaType.STRING },
          location: { type: SchemaType.STRING },
        },
      },
    },
    primarySource: { type: SchemaType.STRING },
    noEvidenceFound: { type: SchemaType.BOOLEAN },
  },
};

/**
 * Default model for the installed @google/generative-ai SDK.
 * Older Flash IDs (2.0 / 2.5) are retired or closed to new users.
 * Prefer 3.6 Flash (GA) for availability vs 3.5 under load.
 */
const DEFAULT_MODEL = "gemini-3.6-flash";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;
/** Hard cap so generateContent never hangs forever (SDK RequestOptions.timeout). */
const REQUEST_TIMEOUT_MS = 30_000;

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

/** Models retired / closed to new users that still appear in older .env files. */
const RETIRED_MODELS: Record<string, string> = {
  "gemini-2.0-flash": DEFAULT_MODEL,
  "gemini-2.0-flash-001": DEFAULT_MODEL,
  "gemini-2.5-flash": DEFAULT_MODEL,
  "gemini-2.5-flash-lite": "gemini-3.5-flash-lite",
  "gemini-1.5-flash": DEFAULT_MODEL,
  "gemini-1.5-pro": DEFAULT_MODEL,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModelName(): string {
  const configured = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const replacement = RETIRED_MODELS[configured];
  if (replacement) {
    console.error(
      `[iLumos:ai] Model "${configured}" is retired; using "${replacement}" instead.`
    );
    return replacement;
  }
  return configured;
}

function schemaInstruction(): string {
  return [
    "Respond with a single JSON object only. No markdown fences.",
    "The JSON must match this schema:",
    JSON.stringify(AI_SUGGESTION_SCHEMA, null, 2),
  ].join("\n");
}

/** Extract safe diagnostic fields from the raw SDK error (never log secrets). */
function describeProviderError(error: unknown): Record<string, unknown> {
  if (error instanceof GoogleGenerativeAIFetchError) {
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      errorDetails: error.errorDetails,
      stack: error.stack,
    };
  }
  if (error instanceof GoogleGenerativeAIAbortError) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      aborted: true,
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { value: String(error) };
}

function isTimeoutOrAbortError(error: unknown): boolean {
  if (error instanceof GoogleGenerativeAIAbortError) return true;
  if (error instanceof AIClientError && error.code === "TIMEOUT") return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("aborted") ||
    message.includes("abort") ||
    message.includes("timeout") ||
    message.includes("timed out")
  );
}

function logOriginalProviderError(error: unknown, phase: string): void {
  aiWarn(`Original Gemini provider exception (${phase})`, {
    providerError: describeProviderError(error),
  });
  // Always print once in scripts/tests so NETWORK wrappers are diagnosable.
  console.error("[iLumos:ai] Original Gemini provider exception:", {
    phase,
    ...describeProviderError(error),
  });
}

function isRetryableProviderError(error: unknown): boolean {
  if (isTimeoutOrAbortError(error)) return true;

  if (error instanceof GoogleGenerativeAIFetchError) {
    const status = error.status;
    if (status === 429 || status === 500 || status === 502 || status === 503) {
      return true;
    }
    // 4xx (except 429) are not transient.
    if (typeof status === "number" && status >= 400 && status < 500) {
      return false;
    }
  }

  if (!(error instanceof Error)) return true;
  const message = error.message.toLowerCase();
  if (message.includes("429") || message.includes("rate")) return true;
  if (message.includes("500") || message.includes("502") || message.includes("503")) {
    return true;
  }
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
  const status =
    error instanceof GoogleGenerativeAIFetchError ? error.status : undefined;

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
    status === 401 ||
    status === 403 ||
    lower.includes("api key") ||
    lower.includes("api_key") ||
    lower.includes("permission denied")
  ) {
    return new AIClientError(
      "MISSING_API_KEY",
      "Gemini rejected the API key or permissions. Check GEMINI_API_KEY.",
      { cause: error }
    );
  }

  if (
    status === 404 ||
    lower.includes("not found") ||
    lower.includes("is not found") ||
    lower.includes("not supported")
  ) {
    return new AIClientError(
      "PROVIDER",
      `Gemini model is unavailable or unsupported (${getModelName()}). Update GEMINI_MODEL.`,
      { cause: error }
    );
  }

  if (isTimeoutOrAbortError(error)) {
    return new AIClientError(
      "TIMEOUT",
      `Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms.`,
      { retryable: true, cause: error }
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

/**
 * Race the SDK promise against an application-level deadline.
 * Complements RequestOptions.timeout (AbortController) so hung fetches always settle.
 */
async function withRequestTimeout<T>(
  label: string,
  work: Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const startedAt = Date.now();
  let workSettled = false;
  const tracked = work.finally(() => {
    workSettled = true;
  });

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new AIClientError(
            "TIMEOUT",
            `Gemini ${label} exceeded ${timeoutMs}ms without completing.`,
            { retryable: true }
          )
        );
      }, timeoutMs);
    });
    return await Promise.race([tracked, timeoutPromise]);
  } catch (error) {
    // If the app-level deadline won, still absorb a late SDK rejection.
    if (!workSettled) {
      void work.catch(() => undefined);
    }
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    console.error(
      `[iLumos:ai] ${label} settled in ${Date.now() - startedAt}ms`
    );
  }
}

async function callGeminiOnce(prompt: string): Promise<string> {
  const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  aiDebug("GEMINI_API_KEY loaded", { present: hasKey });
  console.error("[iLumos:ai] GEMINI_API_KEY loaded:", hasKey);

  const apiKey = getApiKey();
  const modelName = getModelName();
  console.error("[iLumos:ai] Creating GenerativeModel", {
    model: modelName,
    timeoutMs: REQUEST_TIMEOUT_MS,
    responseMimeType: "application/json",
    hasResponseSchema: true,
  });

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel(
    {
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: GEMINI_RESPONSE_SCHEMA,
      },
    },
    { timeout: REQUEST_TIMEOUT_MS }
  );

  const requestBody = `${schemaInstruction()}\n\n${prompt}`;
  aiDebug("Calling Gemini", {
    model: modelName,
    promptChars: requestBody.length,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  console.error("[iLumos:ai] Calling Gemini with model:", modelName);
  console.error(
    "[iLumos:ai] await generateContent() starting (non-stream, timeoutMs=%s)",
    REQUEST_TIMEOUT_MS
  );

  let result;
  try {
    // @google/generative-ai 0.24.x: string | GenerateContentRequest.
    // Second arg is SingleRequestOptions — timeout aborts the underlying fetch.
    result = await withRequestTimeout(
      "generateContent",
      model.generateContent(requestBody, { timeout: REQUEST_TIMEOUT_MS })
    );
    console.error("[iLumos:ai] await generateContent() resolved");
  } catch (error) {
    console.error("[iLumos:ai] await generateContent() rejected");
    logOriginalProviderError(error, "generateContent");
    throw mapProviderError(error);
  }

  console.error("[iLumos:ai] Reading GenerateContentResult.response");
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

  console.error("[iLumos:ai] Calling response.text()");
  const text = response.text()?.trim();
  console.error("[iLumos:ai] response.text() done", {
    chars: text?.length ?? 0,
    finishReason: finishReason ?? null,
  });
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
        if (!(error instanceof AIClientError)) {
          logOriginalProviderError(error, "retry-exhausted");
        }
        throw error instanceof AIClientError ? error : mapProviderError(error);
      }

      aiWarn("Transient Gemini failure; retrying once", {
        attempt,
        code: error instanceof AIClientError ? error.code : "UNKNOWN",
        providerError: describeProviderError(
          error instanceof AIClientError ? error.cause : error
        ),
      });
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof AIClientError
    ? lastError
    : mapProviderError(lastError);
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
    let rawText = await callGeminiWithRetry(prompt);
    try {
      return parseSuggestionResponse(rawText, {
        fallbackClaimElementId: request.context.claimElementId,
      });
    } catch (parseError) {
      if (!(parseError instanceof AIParseError)) throw parseError;
      // One re-call when structured JSON still fails validation.
      aiWarn("Gemini JSON failed parse; regenerating once", {
        requestId: request.requestId,
        message: parseError.message,
      });
      rawText = await callGeminiWithRetry(prompt);
      return parseSuggestionResponse(rawText, {
        fallbackClaimElementId: request.context.claimElementId,
      });
    }
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
        providerError: describeProviderError(error.cause),
      });
      throw error;
    }
    logOriginalProviderError(error, "generateSuggestion");
    throw mapProviderError(error);
  }
}
