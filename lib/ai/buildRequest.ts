/**
 * Build AIRequest objects from workspace claim/chat/evidence state.
 * Keeps context scoped to the selected claim and recent turns only.
 */

import { getCachedEvidenceContext } from "@/lib/ai/evidenceContextCache";
import type {
  AIRequest,
  ConversationTurn,
  PromptContext,
} from "@/lib/ai/types";
import type {
  ChatMessage,
  ClaimElement,
  EvidenceItem,
} from "@/types/workspace";

/** Latest turns only — older accepted/rejected refinements are omitted. */
const MAX_CONVERSATION_TURNS = 3;

function toConversationTurns(messages: ChatMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];

  for (const message of messages) {
    if (!message?.role) continue;
    if (message.role === "welcome") continue;
    // Activity notes are not useful model context.
    if (message.role === "system") continue;

    // Drop settled suggestions — only recent live dialogue matters.
    if (
      message.suggestion &&
      (message.suggestion.status === "accepted" ||
        message.suggestion.status === "rejected")
    ) {
      continue;
    }

    const role = message.role === "user" ? "user" : "assistant";

    let content = "";
    if (message.role === "user") {
      content = message.content?.trim() ?? "";
    } else if (message.suggestion?.summary?.trim()) {
      // Compact: summary only, not full reasoning payload.
      content = message.suggestion.summary.trim();
    } else {
      content = message.content?.trim() ?? "";
    }

    if (!content) continue;
    // Cap turn length to keep prompts small.
    if (content.length > 400) {
      content = `${content.slice(0, 397)}...`;
    }
    turns.push({ role, content });
  }

  return turns.slice(-MAX_CONVERSATION_TURNS);
}

export function buildPromptContext(params: {
  claimElement: ClaimElement;
  evidence: EvidenceItem[];
  messages: ChatMessage[];
  analystInstruction: string;
}): PromptContext {
  const { claimElement, evidence, messages, analystInstruction } = params;
  const cached = getCachedEvidenceContext(claimElement.id, evidence);

  return {
    claimElementId: claimElement.id,
    patentClaimElement: claimElement.patentClaimElement,
    accusedProductFeature: claimElement.accusedProductFeature,
    currentReasoning: claimElement.reasoning,
    currentEvidenceSource: claimElement.evidenceSource,
    claimStatus: claimElement.status,
    supportingDocuments: cached.supportingDocuments,
    uploadedDocumentNames: cached.uploadedDocumentNames,
    conversationHistory: toConversationTurns(messages),
    analystInstruction,
  };
}

export function buildAIRequest(params: {
  claimElement: ClaimElement;
  evidence: EvidenceItem[];
  messages: ChatMessage[];
  analystInstruction: string;
  requestId?: string;
}): AIRequest {
  return {
    requestId: params.requestId,
    context: buildPromptContext(params),
  };
}
