/**
 * Client-safe workspace AI bridge.
 * Calls the streamed server refine API when live AI is enabled; otherwise /
 * on failure falls back to the existing mock assistant generator.
 */

import {
  createAssistantMessage,
  resolveScenarioFromPrompt,
} from "@/data/mockWorkspace";
import { buildAIRequest } from "@/lib/ai/buildRequest";
import { formatTimeLabel } from "@/lib/formatTimeLabel";
import { mapAIResponseToAssistantMessage } from "@/lib/ai/mapper";
import type { AIRequest, AIResponse } from "@/lib/ai/types";
import {
  classifyWorkspaceError,
  isRetryableWorkspaceError,
  userFacingMessage,
} from "@/lib/ai/userFacingErrors";
import type {
  ChatMessage,
  ClaimElement,
  EvidenceItem,
  SuggestionPayload,
} from "@/types/workspace";

export type WorkspaceAIMode = "auto" | "live" | "mock";

/** Client ceiling slightly above server 20s Gemini timeout. */
const CLIENT_FETCH_TIMEOUT_MS = 22_000;
/** Keep typing indicator visible briefly for live replies (perceived polish). */
const LIVE_MIN_DELAY_MS = 280;
/** Mock path keeps a slightly longer delay so demo pacing feels intentional. */
const MOCK_MIN_DELAY_MS = 900;

function getAIMode(): WorkspaceAIMode {
  const mode = process.env.NEXT_PUBLIC_AI_MODE?.trim().toLowerCase();
  if (mode === "live" || mode === "mock" || mode === "auto") return mode;
  return "auto";
}

function shouldAttemptLive(): boolean {
  const mode = getAIMode();
  return mode === "live" || mode === "auto";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function makeTextAssistantMessage(
  threadId: string,
  content: string
): ChatMessage {
  const stamp = new Date();
  return {
    id: `msg-a-info-${stamp.getTime()}`,
    role: "assistant",
    claimElementId: threadId,
    content,
    createdAt: stamp.toISOString(),
    timeLabel: formatTimeLabel(stamp),
  };
}

type StreamEvent =
  | { type: "status"; phase?: string }
  | { type: "chunk"; chars?: number }
  | {
      type: "done";
      suggestion: AIResponse;
      source?: string;
      timings?: Record<string, unknown>;
    }
  | {
      type: "error";
      error?: string;
      code?: string;
      useMock?: boolean;
      retryable?: boolean;
    };

async function fetchLiveSuggestion(request: AIRequest): Promise<AIResponse> {
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(),
    CLIENT_FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch("/api/ai/refine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-ndjson",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    // Non-stream error payloads (mock mode / missing key).
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("ndjson")) {
      const payload = (await response.json().catch(() => ({}))) as {
        suggestion?: AIResponse;
        error?: string;
        useMock?: boolean;
        code?: string;
      };

      if (!response.ok || payload.useMock || !payload.suggestion) {
        const message = payload.error || `AI request failed (${response.status})`;
        const error = new Error(message) as Error & {
          code?: string;
          retryable?: boolean;
        };
        if (payload.code) error.code = payload.code;
        if (
          response.status === 429 ||
          response.status === 502 ||
          response.status === 503 ||
          payload.code === "TIMEOUT" ||
          payload.code === "NETWORK"
        ) {
          error.retryable = true;
        }
        throw error;
      }
      return payload.suggestion;
    }

    if (!response.ok || !response.body) {
      throw Object.assign(new Error(`AI request failed (${response.status})`), {
        retryable: response.status >= 500,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let suggestion: AIResponse | null = null;

    const handleEvent = (event: StreamEvent) => {
      if (event.type === "done" && event.suggestion) {
        suggestion = event.suggestion;
        if (
          process.env.NODE_ENV === "development" &&
          event.timings &&
          typeof console !== "undefined"
        ) {
          console.debug("[iLumos:ai] stream timings", event.timings);
        }
        return;
      }
      if (event.type === "error") {
        const error = new Error(
          event.error || "AI request failed"
        ) as Error & { code?: string; retryable?: boolean };
        if (event.code) error.code = event.code;
        if (event.retryable || event.code === "TIMEOUT" || event.code === "NETWORK") {
          error.retryable = true;
        }
        throw error;
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        handleEvent(JSON.parse(trimmed) as StreamEvent);
      }
    }

    const rest = buffer.trim();
    if (rest) {
      handleEvent(JSON.parse(rest) as StreamEvent);
    }

    if (!suggestion) {
      throw Object.assign(new Error("AI stream ended without a suggestion"), {
        retryable: true,
        code: "EMPTY_RESPONSE",
      });
    }

    return suggestion;
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      const timeoutError = new Error(
        `Gemini request timed out after ${CLIENT_FETCH_TIMEOUT_MS}ms.`
      ) as Error & { code?: string; retryable?: boolean };
      timeoutError.code = "TIMEOUT";
      timeoutError.retryable = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function buildMockAssistant(params: {
  prompt: string;
  threadId: string;
  version?: number;
  intro?: string;
  baseSuggestion?: SuggestionPayload;
}): ChatMessage {
  const scenarioKey = resolveScenarioFromPrompt(params.prompt);
  const assistant = createAssistantMessage(scenarioKey, params.threadId, {
    version: params.version ?? 1,
    intro: params.intro,
  });

  if (assistant.suggestion && params.baseSuggestion) {
    assistant.suggestion = {
      ...assistant.suggestion,
      claimElementId: params.baseSuggestion.claimElementId,
      originalReasoning: params.baseSuggestion.suggestedReasoning,
      isNewRowProposal: params.baseSuggestion.isNewRowProposal,
      proposedPatentClaimElement:
        params.baseSuggestion.proposedPatentClaimElement,
      proposedAccusedProductFeature:
        params.baseSuggestion.proposedAccusedProductFeature,
      confidence: Math.min(
        0.98,
        (params.baseSuggestion.confidence ?? 0) + 0.02
      ),
    };
  }

  return assistant;
}

export interface ResolveAssistantParams {
  prompt: string;
  threadId: string;
  claimElement: ClaimElement | undefined;
  evidence: EvidenceItem[];
  messages: ChatMessage[];
  version?: number;
  intro?: string;
  /** Prior suggestion when refining further. */
  baseSuggestion?: SuggestionPayload;
  minDelayMs?: number;
}

export type ResolveAssistantResult = {
  message: ChatMessage;
  source: "live" | "mock" | "empty";
};

/**
 * Resolve an assistant chat message via Gemini (when available) or mock fallback.
 * Never throws — empty/error paths return a safe chat message.
 */
export async function resolveAssistantMessage(
  params: ResolveAssistantParams
): Promise<ResolveAssistantResult> {
  const started = Date.now();
  const threadId = params.threadId || "unknown";

  const finish = async (
    message: ChatMessage,
    source: ResolveAssistantResult["source"]
  ): Promise<ResolveAssistantResult> => {
    const targetDelay =
      source === "live"
        ? Math.min(params.minDelayMs ?? LIVE_MIN_DELAY_MS, LIVE_MIN_DELAY_MS)
        : Math.min(params.minDelayMs ?? MOCK_MIN_DELAY_MS, MOCK_MIN_DELAY_MS);
    const remaining = Math.max(0, targetDelay - (Date.now() - started));
    if (remaining > 0) await sleep(remaining);
    return { message, source };
  };

  const trimmedPrompt = params.prompt?.trim() ?? "";
  if (!trimmedPrompt) {
    return finish(
      makeTextAssistantMessage(threadId, userFacingMessage("empty_prompt")),
      "empty"
    );
  }

  if (!params.claimElement?.id) {
    return finish(
      makeTextAssistantMessage(threadId, userFacingMessage("missing_claim")),
      "empty"
    );
  }

  const claimElement = params.claimElement;
  const evidence = Array.isArray(params.evidence) ? params.evidence : [];
  const messages = Array.isArray(params.messages) ? params.messages : [];

  const mock = () =>
    buildMockAssistant({
      prompt: trimmedPrompt,
      threadId,
      version: params.version,
      intro: params.intro,
      baseSuggestion: params.baseSuggestion,
    });

  if (!shouldAttemptLive()) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[iLumos:ai] Using mock assistant (AI mode = mock)");
    }
    return finish(mock(), "mock");
  }

  // Parallelize claim shaping with request assembly prep.
  const [claimForRequest] = await Promise.all([
    Promise.resolve(
      params.baseSuggestion && params.baseSuggestion.isNewRowProposal
        ? {
            ...claimElement,
            id: params.baseSuggestion.claimElementId,
            patentClaimElement:
              params.baseSuggestion.proposedPatentClaimElement ??
              claimElement.patentClaimElement,
            accusedProductFeature:
              params.baseSuggestion.proposedAccusedProductFeature ??
              claimElement.accusedProductFeature,
            reasoning: params.baseSuggestion.suggestedReasoning,
            evidenceSource: params.baseSuggestion.citation,
          }
        : params.baseSuggestion
          ? {
              ...claimElement,
              reasoning: params.baseSuggestion.suggestedReasoning,
              evidenceSource: params.baseSuggestion.citation,
            }
          : claimElement
    ),
  ]);

  const request = buildAIRequest({
    claimElement: claimForRequest,
    evidence,
    messages,
    analystInstruction: trimmedPrompt,
    requestId: `ws-${threadId}-${Date.now()}`,
  });

  const knownDocumentNames = evidence
    .map((item) => item.documentName?.trim())
    .filter((name): name is string => Boolean(name));

  const mapLive = (aiResponse: AIResponse): ChatMessage =>
    mapAIResponseToAssistantMessage(aiResponse, {
      claimElementId:
        params.baseSuggestion?.claimElementId ?? claimElement.id,
      originalReasoning:
        params.baseSuggestion?.suggestedReasoning ?? claimElement.reasoning,
      version: params.version ?? 1,
      intro: params.intro,
      isNewRowProposal: params.baseSuggestion?.isNewRowProposal,
      proposedPatentClaimElement:
        params.baseSuggestion?.proposedPatentClaimElement ??
        aiResponse.proposedUpdates.patentClaimElement,
      proposedAccusedProductFeature:
        params.baseSuggestion?.proposedAccusedProductFeature ??
        aiResponse.proposedUpdates.accusedProductFeature,
      knownDocumentNames,
    });

  const attemptLive = async (): Promise<ChatMessage> => {
    const aiResponse = await fetchLiveSuggestion(request);
    return mapLive(aiResponse);
  };

  try {
    const message = await attemptLive();
    if (process.env.NODE_ENV === "development") {
      console.debug("[iLumos:ai] Live Gemini suggestion applied", {
        claimElementId: message.suggestion?.claimElementId,
        documentCount: evidence.length,
        promptChars: JSON.stringify(request.context).length,
        totalClientMs: Date.now() - started,
      });
    }
    return finish(message, "live");
  } catch (firstError) {
    // One client-level retry for transient failures, then mock fallback.
    if (isRetryableWorkspaceError(firstError)) {
      try {
        if (process.env.NODE_ENV === "development") {
          console.warn("[iLumos:ai] Retrying live AI once", {
            kind: classifyWorkspaceError(firstError),
          });
        }
        await sleep(300);
        const message = await attemptLive();
        return finish(message, "live");
      } catch (retryError) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[iLumos:ai] Live AI retry failed; falling back to mock",
            retryError
          );
        }
        return finish(mock(), "mock");
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[iLumos:ai] Live AI unavailable; falling back to mock suggestion",
        firstError
      );
    }
    return finish(mock(), "mock");
  }
}
