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
import { mapAIResponseToAssistantMessage } from "@/lib/ai/mapper";
import type { AIRequest, AIResponse } from "@/lib/ai/types";
import type {
  ChatMessage,
  ClaimElement,
  EvidenceItem,
  SuggestionPayload,
} from "@/types/workspace";

export type WorkspaceAIMode = "auto" | "live" | "mock";

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

async function fetchLiveSuggestion(request: AIRequest): Promise<AIResponse> {
  const response = await fetch("/api/ai/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    suggestion?: AIResponse;
    error?: string;
    useMock?: boolean;
  };

  if (!response.ok || payload.useMock || !payload.suggestion) {
    const message = payload.error || `AI request failed (${response.status})`;
    throw new Error(message);
  }

  return payload.suggestion;
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
  claimElement: ClaimElement;
  evidence: EvidenceItem[];
  messages: ChatMessage[];
  version?: number;
  intro?: string;
  /** Prior suggestion when refining further. */
  baseSuggestion?: SuggestionPayload;
  minDelayMs?: number;
}

/**
 * Resolve an assistant chat message via Gemini (when available) or mock fallback.
 * Preserves existing ChatMessage / SuggestionPayload shapes for the UI.
 */
export async function resolveAssistantMessage(
  params: ResolveAssistantParams
): Promise<{ message: ChatMessage; source: "live" | "mock" }> {
  const minDelayMs = params.minDelayMs ?? 1100;
  const started = Date.now();

  const finish = async (
    message: ChatMessage,
    source: "live" | "mock"
  ): Promise<{ message: ChatMessage; source: "live" | "mock" }> => {
    const remaining = Math.max(0, minDelayMs - (Date.now() - started));
    if (remaining > 0) await sleep(remaining);
    return { message, source };
  };

  const mock = () =>
    buildMockAssistant({
      prompt: params.prompt,
      threadId: params.threadId,
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

  try {
    const claimForRequest =
      params.baseSuggestion && params.baseSuggestion.isNewRowProposal
        ? {
            ...params.claimElement,
            id: params.baseSuggestion.claimElementId,
            patentClaimElement:
              params.baseSuggestion.proposedPatentClaimElement ??
              params.claimElement.patentClaimElement,
            accusedProductFeature:
              params.baseSuggestion.proposedAccusedProductFeature ??
              params.claimElement.accusedProductFeature,
            reasoning: params.baseSuggestion.suggestedReasoning,
            evidenceSource: params.baseSuggestion.citation,
          }
        : params.baseSuggestion
          ? {
              ...params.claimElement,
              reasoning: params.baseSuggestion.suggestedReasoning,
              evidenceSource: params.baseSuggestion.citation,
            }
          : params.claimElement;

    const request = buildAIRequest({
      claimElement: claimForRequest,
      evidence: params.evidence,
      messages: params.messages,
      analystInstruction: params.prompt,
      requestId: `ws-${params.threadId}-${Date.now()}`,
    });

    const aiResponse = await fetchLiveSuggestion(request);
    const knownDocumentNames = params.evidence
      .map((item) => item.documentName?.trim())
      .filter((name): name is string => Boolean(name));

    const message = mapAIResponseToAssistantMessage(aiResponse, {
      claimElementId:
        params.baseSuggestion?.claimElementId ?? params.claimElement.id,
      originalReasoning:
        params.baseSuggestion?.suggestedReasoning ??
        params.claimElement.reasoning,
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

    if (process.env.NODE_ENV === "development") {
      console.debug("[iLumos:ai] Live Gemini suggestion applied", {
        claimElementId: message.suggestion?.claimElementId,
      });
    }

    return finish(message, "live");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[iLumos:ai] Live AI unavailable; falling back to mock suggestion",
        error
      );
    }
    return finish(mock(), "mock");
  }
}
