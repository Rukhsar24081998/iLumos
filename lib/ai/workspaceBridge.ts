/**
 * Client-safe workspace AI bridge.
 * Calls the server refine API when live AI is enabled; otherwise / on failure
 * falls back to the existing mock assistant generator.
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

/** Client-side ceiling for /api/ai/refine (server Gemini timeout is 30s). */
const CLIENT_FETCH_TIMEOUT_MS = 45_000;

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

async function fetchLiveSuggestion(request: AIRequest): Promise<AIResponse> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch("/api/ai/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

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
  const minDelayMs = params.minDelayMs ?? 1100;
  const started = Date.now();
  const threadId = params.threadId || "unknown";

  const finish = async (
    message: ChatMessage,
    source: ResolveAssistantResult["source"]
  ): Promise<ResolveAssistantResult> => {
    const remaining = Math.max(0, minDelayMs - (Date.now() - started));
    if (remaining > 0) await sleep(remaining);
    return { message, source };
  };

  const trimmedPrompt = params.prompt?.trim() ?? "";
  if (!trimmedPrompt) {
    return finish(
      makeTextAssistantMessage(
        threadId,
        userFacingMessage("empty_prompt")
      ),
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

  const claimForRequest =
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
        : claimElement;

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
      });
    }
    return finish(message, "live");
  } catch (firstError) {
    if (isRetryableWorkspaceError(firstError)) {
      try {
        if (process.env.NODE_ENV === "development") {
          console.warn("[iLumos:ai] Retrying live AI once", {
            kind: classifyWorkspaceError(firstError),
          });
        }
        await sleep(400);
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
