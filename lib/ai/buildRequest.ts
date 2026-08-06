/**
 * Build AIRequest objects from workspace claim/chat/evidence state.
 */

import type {
  AIRequest,
  ConversationTurn,
  PromptContext,
  SupportingDocumentContext,
} from "@/lib/ai/types";
import type {
  ChatMessage,
  ClaimElement,
  EvidenceItem,
} from "@/types/workspace";

function toConversationTurns(messages: ChatMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];

  for (const message of messages) {
    if (!message?.role) continue;
    if (message.role === "welcome") continue;

    const role =
      message.role === "user"
        ? "user"
        : message.role === "system"
          ? "system"
          : "assistant";

    const content = message.suggestion?.summary?.trim()
      ? message.suggestion.summary
      : message.content?.trim() ?? "";

    if (!content) continue;
    turns.push({ role, content });
  }

  return turns.slice(-12);
}

function toSupportingDocuments(
  evidence: EvidenceItem[]
): SupportingDocumentContext[] {
  return evidence.map((item) => ({
    documentName: item.documentName,
    excerpt: item.snippet,
    sourceType: item.sourceType,
    citation: item.citation,
    source: item.source,
    confidence: item.confidence,
  }));
}

function toUploadedDocumentNames(evidence: EvidenceItem[]): string[] {
  const names: string[] = [];
  for (const item of evidence) {
    const name = item.documentName?.trim();
    if (!name || names.includes(name)) continue;
    names.push(name);
  }
  return names;
}

export function buildPromptContext(params: {
  claimElement: ClaimElement;
  evidence: EvidenceItem[];
  messages: ChatMessage[];
  analystInstruction: string;
}): PromptContext {
  const { claimElement, evidence, messages, analystInstruction } = params;

  return {
    claimElementId: claimElement.id,
    patentClaimElement: claimElement.patentClaimElement,
    accusedProductFeature: claimElement.accusedProductFeature,
    currentReasoning: claimElement.reasoning,
    currentEvidenceSource: claimElement.evidenceSource,
    claimStatus: claimElement.status,
    supportingDocuments: toSupportingDocuments(evidence),
    uploadedDocumentNames: toUploadedDocumentNames(evidence),
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
