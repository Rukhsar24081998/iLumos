/**
 * Gemini provider client — latency-optimized (stream + lean config).
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

const DEFAULT_MODEL = "gemini-3.6-flash";
/** Initial attempt + one retry on transient failures. */
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 800;
/** Fail fast — 20s hard cap (Phase 9). */
const REQUEST_TIMEOUT_MS = 20_000;
/**
 * Enough for SuggestionPayload JSON (summary, reasoning, evidence, citations).
 * Avoids long narrative completions.
 */
const MAX_OUTPUT_TOKENS = 1024;

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
    aiWarn(`Model "${configured}" is retired; using "${replacement}" instead.`);
    return replacement;
  }
  return configured;
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
    };
  }
  if (error instanceof GoogleGenerativeAIAbortError) {
    return { name: error.name, message: error.message, aborted: true };
  }
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
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
}

function isRetryableProviderError(error: unknown): boolean {
  if (isTimeoutOrAbortError(error)) return true;

  if (error instanceof GoogleGenerativeAIFetchError) {
    const status = error.status;
    if (status === 429 || status === 500 || status === 502 || status === 503) {
      return true;
    }
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
    if (!workSettled) {
      void work.catch(() => undefined);
    }
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    aiDebug(`${label} settled`, { ms: Date.now() - startedAt });
  }
}

export type StreamProgressHandler = (info: {
  chars: number;
  delta: string;
}) => void;

/**
 * Stream Gemini JSON tokens; accumulate full text for parsing.
 * First tokens arrive ASAP for perceived latency (UI keeps typing indicator).
 */
async function callGeminiStreamOnce(
  prompt: string,
  onProgress?: StreamProgressHandler
): Promise<string> {
  const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  aiDebug("GEMINI_API_KEY loaded", { present: hasKey });

  const apiKey = getApiKey();
  const modelName = getModelName();
  aiDebug("Creating GenerativeModel (stream)", {
    model: modelName,
    timeoutMs: REQUEST_TIMEOUT_MS,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    responseMimeType: "application/json",
    hasResponseSchema: true,
  });

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel(
    {
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
        responseSchema: GEMINI_RESPONSE_SCHEMA,
      },
    },
    { timeout: REQUEST_TIMEOUT_MS }
  );

  // Schema is enforced by responseSchema — do not re-send the full schema JSON.
  const requestBody = prompt;
  aiDebug("Calling Gemini stream", {
    model: modelName,
    promptChars: requestBody.length,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  const streamStarted = Date.now();
  let result;
  try {
    result = await withRequestTimeout(
      "generateContentStream",
      model.generateContentStream(requestBody, { timeout: REQUEST_TIMEOUT_MS })
    );
  } catch (error) {
    logOriginalProviderError(error, "generateContentStream");
    throw mapProviderError(error);
  }

  let text = "";
  let firstTokenMs: number | null = null;
  try {
    for await (const chunk of result.stream) {
      const delta = chunk.text();
      if (!delta) continue;
      if (firstTokenMs === null) {
        firstTokenMs = Date.now() - streamStarted;
        aiDebug("stream first token", { ms: firstTokenMs });
      }
      text += delta;
      onProgress?.({ chars: text.length, delta });
    }
  } catch (error) {
    logOriginalProviderError(error, "stream-read");
    throw mapProviderError(error);
  }

  const response = await result.response;
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

  const finalText = text.trim() || response.text()?.trim() || "";
  aiDebug("stream complete", {
    chars: finalText.length,
    streamMs: Date.now() - streamStarted,
    firstTokenMs,
    finishReason: finishReason ?? null,
  });

  if (!finalText) {
    throw new AIClientError(
      "EMPTY_RESPONSE",
      "Gemini returned an empty response."
    );
  }

  return finalText;
}

async function callGeminiWithRetry(
  prompt: string,
  onProgress?: StreamProgressHandler
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callGeminiStreamOnce(prompt, onProgress);
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

export interface GenerateSuggestionTimings {
  promptBuildMs: number;
  geminiMs: number;
  parseMs: number;
  totalMs: number;
  promptChars: number;
  firstTokenMs?: number | null;
}

export interface GenerateSuggestionResult {
  response: AIResponse;
  timings: GenerateSuggestionTimings;
  rawChars: number;
}

/**
 * Generate a structured claim-chart refinement suggestion via Gemini (streamed).
 */
export async function generateSuggestion(
  request: AIRequest,
  options?: { onProgress?: StreamProgressHandler }
): Promise<AIResponse> {
  const { response } = await generateSuggestionWithTimings(request, options);
  return response;
}

/** Same as generateSuggestion, plus development timing metrics. */
export async function generateSuggestionWithTimings(
  request: AIRequest,
  options?: { onProgress?: StreamProgressHandler }
): Promise<GenerateSuggestionResult> {
  const totalStarted = Date.now();

  const promptStarted = Date.now();
  const prompt = buildRefinementPrompt(request.context);
  const promptBuildMs = Date.now() - promptStarted;

  aiDebug("Built refinement prompt", {
    requestId: request.requestId,
    claimElementId: request.context.claimElementId,
    promptChars: prompt.length,
    promptBuildMs,
    historyTurns: request.context.conversationHistory.length,
    evidenceDocs: request.context.supportingDocuments.length,
  });

  try {
    const geminiStarted = Date.now();
    let firstTokenMs: number | null = null;
    let rawText = await callGeminiWithRetry(prompt, (info) => {
      if (firstTokenMs === null && info.chars > 0) {
        firstTokenMs = Date.now() - geminiStarted;
      }
      options?.onProgress?.(info);
    });
    const geminiMs = Date.now() - geminiStarted;

    const parseStarted = Date.now();
    let response: AIResponse;
    try {
      response = parseSuggestionResponse(rawText, {
        fallbackClaimElementId: request.context.claimElementId,
      });
    } catch (parseError) {
      if (!(parseError instanceof AIParseError)) throw parseError;
      aiWarn("Gemini JSON failed parse; regenerating once", {
        requestId: request.requestId,
        message: parseError.message,
      });
      rawText = await callGeminiWithRetry(prompt, options?.onProgress);
      response = parseSuggestionResponse(rawText, {
        fallbackClaimElementId: request.context.claimElementId,
      });
    }
    const parseMs = Date.now() - parseStarted;
    const totalMs = Date.now() - totalStarted;

    const timings: GenerateSuggestionTimings = {
      promptBuildMs,
      geminiMs,
      parseMs,
      totalMs,
      promptChars: prompt.length,
      firstTokenMs,
    };

    aiDebug("AI timing summary", {
      requestId: request.requestId,
      claimElementId: request.context.claimElementId,
      ...timings,
      rawChars: rawText.length,
    });

    return { response, timings, rawChars: rawText.length };
  } catch (error) {
    if (error instanceof AIParseError) {
      aiWarn("Gemini response failed validation", {
        requestId: request.requestId,
        message: error.message,
        totalMs: Date.now() - totalStarted,
      });
      throw error;
    }
    if (error instanceof AIClientError) {
      aiWarn("Gemini client error", {
        requestId: request.requestId,
        code: error.code,
        message: error.message,
        totalMs: Date.now() - totalStarted,
        providerError: describeProviderError(error.cause),
      });
      throw error;
    }
    logOriginalProviderError(error, "generateSuggestion");
    throw mapProviderError(error);
  }
}
