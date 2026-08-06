"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatPanel } from "@/components/workspace/ChatPanel";
import { ClaimChartPanel } from "@/components/workspace/ClaimChartPanel";
import { EvidencePanel } from "@/components/workspace/EvidencePanel";
import {
  buildWelcomeMessages,
  claimElementFromSuggestion,
  EVIDENCE_ITEMS,
  INITIAL_CLAIM_ELEMENTS,
  INITIAL_NEEDS_REVIEW_COUNT,
  MATTER,
} from "@/data/mockWorkspace";
import {
  classifyWorkspaceError,
  userFacingMessage,
} from "@/lib/ai/userFacingErrors";
import { resolveAssistantMessage } from "@/lib/ai/workspaceBridge";
import { formatTimeLabel } from "@/lib/formatTimeLabel";
import { WORKSPACE_RESET_FLAG } from "@/lib/workspaceReset";
import type {
  ChatMessage,
  ClaimElement,
  SuggestionPayload,
} from "@/types/workspace";

const TYPING_DELAY_MS = 1100;
const EMPTY_MESSAGES: ChatMessage[] = [];

function createInitialMessages(): Record<string, ChatMessage[]> {
  return {
    "CE-3": buildWelcomeMessages("CE-3", INITIAL_NEEDS_REVIEW_COUNT),
    "CE-1": buildWelcomeMessages("CE-1", INITIAL_NEEDS_REVIEW_COUNT),
    "CE-2": buildWelcomeMessages("CE-2", INITIAL_NEEDS_REVIEW_COUNT),
  };
}

/**
 * Phase 3–5 workspace — live/mock AI with resilient request handling.
 */
export function WorkspaceApp() {
  const [elements, setElements] = useState<ClaimElement[]>(
    INITIAL_CLAIM_ELEMENTS
  );
  const [selectedId, setSelectedId] = useState("CE-3");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(
    null
  );
  const [typingThreadId, setTypingThreadId] = useState<string | null>(null);
  const [messagesByClaim, setMessagesByClaim] = useState<
    Record<string, ChatMessage[]>
  >(createInitialMessages);

  const typingThreadRef = useRef<string | null>(null);
  const selectedIdRef = useRef(selectedId);
  const messagesByClaimRef = useRef(messagesByClaim);
  const elementsRef = useRef(elements);
  /** Sync lock against double-clicks before React re-renders. */
  const actionLockRef = useRef(false);
  /** Per-thread generation counters — stale async results are ignored. */
  const generationByThreadRef = useRef<Record<string, number>>({});

  selectedIdRef.current = selectedId;
  messagesByClaimRef.current = messagesByClaim;
  elementsRef.current = elements;

  const resetWorkspace = useCallback(() => {
    generationByThreadRef.current = {};
    actionLockRef.current = false;
    typingThreadRef.current = null;
    setElements(INITIAL_CLAIM_ELEMENTS);
    setSelectedId("CE-3");
    setHighlightedId(null);
    setActiveSuggestionId(null);
    setTypingThreadId(null);
    setMessagesByClaim(createInitialMessages());
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(WORKSPACE_RESET_FLAG) === "1") {
        sessionStorage.removeItem(WORKSPACE_RESET_FLAG);
        resetWorkspace();
      }
    } catch {
      // sessionStorage may be unavailable; initial state is already clean.
    }
  }, [resetWorkspace]);

  useEffect(() => {
    if (!highlightedId) return;
    const timer = window.setTimeout(() => setHighlightedId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [highlightedId]);

  // Keep the sync guard aligned with React state.
  useEffect(() => {
    typingThreadRef.current = typingThreadId;
  }, [typingThreadId]);

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId),
    [elements, selectedId]
  );

  const messages = messagesByClaim[selectedId] ?? EMPTY_MESSAGES;
  const isBusy = typingThreadId !== null;
  const showTypingIndicator = typingThreadId === selectedId;

  const activeSuggestion = useMemo(() => {
    if (!activeSuggestionId) {
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        const suggestion = messages[index]?.suggestion;
        if (suggestion) return suggestion;
      }
      return null;
    }
    return (
      messages.find(
        (message) => message.suggestion?.id === activeSuggestionId
      )?.suggestion ?? null
    );
  }, [activeSuggestionId, messages]);

  const evidence = useMemo(() => {
    const claimId = activeSuggestion?.claimElementId ?? selectedId;
    return EVIDENCE_ITEMS.filter((item) => item.claimElementId === claimId);
  }, [selectedId, activeSuggestion?.claimElementId]);

  const latestSuggestionId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const id = messages[index]?.suggestion?.id;
      if (id) return id;
    }
    return null;
  }, [messages]);

  const evidenceElement = useMemo(() => {
    const claimId = activeSuggestion?.claimElementId ?? selectedId;
    return (
      elements.find((element) => element.id === claimId) ?? selectedElement
    );
  }, [activeSuggestion?.claimElementId, elements, selectedElement, selectedId]);

  const updateMessages = useCallback(
    (
      claimElementId: string,
      updater: (current: ChatMessage[]) => ChatMessage[]
    ) => {
      setMessagesByClaim((current) => ({
        ...current,
        [claimElementId]: updater(
          current[claimElementId] ??
            buildWelcomeMessages(claimElementId, INITIAL_NEEDS_REVIEW_COUNT)
        ),
      }));
    },
    []
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setActiveSuggestionId(null);
    setMessagesByClaim((current) => {
      if (current[id]) return current;
      return {
        ...current,
        [id]: buildWelcomeMessages(id, INITIAL_NEEDS_REVIEW_COUNT),
      };
    });
  }, []);

  const beginTyping = useCallback((threadId: string) => {
    const generation = (generationByThreadRef.current[threadId] ?? 0) + 1;
    generationByThreadRef.current[threadId] = generation;
    typingThreadRef.current = threadId;
    setTypingThreadId(threadId);
    return generation;
  }, []);

  const clearTyping = useCallback((threadId: string) => {
    if (typingThreadRef.current === threadId) {
      typingThreadRef.current = null;
      setTypingThreadId(null);
    }
    actionLockRef.current = false;
  }, []);

  const isCurrentGeneration = useCallback(
    (threadId: string, generation: number) =>
      generationByThreadRef.current[threadId] === generation,
    []
  );

  const makeSystemMessage = useCallback(
    (claimElementId: string, content: string): ChatMessage => {
      const stamp = new Date();
      return {
        id: `sys-${stamp.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "system",
        claimElementId,
        content,
        createdAt: stamp.toISOString(),
        timeLabel: formatTimeLabel(stamp),
      };
    },
    []
  );

  const commitAssistant = useCallback(
    (threadId: string, generation: number, assistant: ChatMessage) => {
      if (!isCurrentGeneration(threadId, generation)) return;
      if (typingThreadRef.current !== threadId) return;
      updateMessages(threadId, (current) => [...current, assistant]);
      if (assistant.suggestion && selectedIdRef.current === threadId) {
        setActiveSuggestionId(assistant.suggestion.id);
      }
      clearTyping(threadId);
    },
    [clearTyping, isCurrentGeneration, updateMessages]
  );

  const commitFailure = useCallback(
    (threadId: string, generation: number, error: unknown) => {
      if (!isCurrentGeneration(threadId, generation)) return;
      const kind = classifyWorkspaceError(error);
      updateMessages(threadId, (current) => [
        ...current,
        makeSystemMessage(threadId, userFacingMessage(kind)),
      ]);
      clearTyping(threadId);
    },
    [clearTyping, isCurrentGeneration, makeSystemMessage, updateMessages]
  );

  const recoverIdleGuard = useCallback(() => {
    if (typingThreadId === null && typingThreadRef.current !== null) {
      typingThreadRef.current = null;
    }
  }, [typingThreadId]);

  const handleSend = useCallback(
    (prompt: string) => {
      recoverIdleGuard();
      if (actionLockRef.current) return;
      if (typingThreadId !== null || typingThreadRef.current) return;

      const trimmed = prompt.trim();
      const threadId = selectedId;

      if (!trimmed) {
        updateMessages(threadId, (current) => [
          ...current,
          makeSystemMessage(threadId, userFacingMessage("empty_prompt")),
        ]);
        return;
      }

      actionLockRef.current = true;
      const stamp = new Date();
      const userMessage: ChatMessage = {
        id: `msg-u-${stamp.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        claimElementId: threadId,
        content: trimmed,
        createdAt: stamp.toISOString(),
        timeLabel: formatTimeLabel(stamp),
      };

      const generation = beginTyping(threadId);
      actionLockRef.current = false;
      updateMessages(threadId, (current) => [...current, userMessage]);

      const claimElement =
        elementsRef.current.find((element) => element.id === threadId) ??
        elementsRef.current[0];
      if (!claimElement) {
        updateMessages(threadId, (current) => [
          ...current,
          makeSystemMessage(threadId, userFacingMessage("missing_claim")),
        ]);
        clearTyping(threadId);
        return;
      }

      const threadMessages = [
        ...(messagesByClaimRef.current[threadId] ?? EMPTY_MESSAGES),
        userMessage,
      ];
      const evidenceForClaim = EVIDENCE_ITEMS.filter(
        (item) => item.claimElementId === claimElement.id
      );

      void (async () => {
        try {
          const { message } = await resolveAssistantMessage({
            prompt: trimmed,
            threadId,
            claimElement,
            evidence: evidenceForClaim,
            messages: threadMessages,
            version: 1,
            minDelayMs: TYPING_DELAY_MS,
          });
          commitAssistant(threadId, generation, message);
        } catch (error) {
          commitFailure(threadId, generation, error);
        }
      })();
    },
    [
      beginTyping,
      clearTyping,
      commitAssistant,
      commitFailure,
      makeSystemMessage,
      recoverIdleGuard,
      selectedId,
      typingThreadId,
      updateMessages,
    ]
  );

  const patchSuggestionStatus = useCallback(
    (suggestionId: string, status: SuggestionPayload["status"]) => {
      setMessagesByClaim((current) => {
        const next: Record<string, ChatMessage[]> = {};
        for (const [key, list] of Object.entries(current)) {
          next[key] = list.map((message) => {
            if (message.suggestion?.id !== suggestionId) return message;
            return {
              ...message,
              suggestion: { ...message.suggestion, status },
            };
          });
        }
        return next;
      });
    },
    []
  );

  const handleAccept = useCallback(
    (suggestion: SuggestionPayload) => {
      recoverIdleGuard();
      if (actionLockRef.current) return;
      if (
        suggestion.status !== "pending" ||
        typingThreadId !== null ||
        typingThreadRef.current
      ) {
        return;
      }

      actionLockRef.current = true;
      try {
        patchSuggestionStatus(suggestion.id, "accepted");
        setActiveSuggestionId(suggestion.id);

        if (suggestion.isNewRowProposal) {
          const targetId = suggestion.claimElementId;
          setElements((current) => {
            const existing = current.find((element) => element.id === targetId);
            const nextElement = claimElementFromSuggestion(suggestion, existing);
            if (existing) {
              return current.map((element) =>
                element.id === targetId ? nextElement : element
              );
            }
            return [...current, nextElement];
          });
          setHighlightedId(targetId);
          setMessagesByClaim((current) => ({
            ...current,
            [targetId]:
              current[targetId] ??
              buildWelcomeMessages(targetId, INITIAL_NEEDS_REVIEW_COUNT),
          }));
          updateMessages(selectedId, (current) => [
            ...current,
            makeSystemMessage(
              selectedId,
              "Suggestion accepted. Claim chart updated."
            ),
          ]);
          return;
        }

        setElements((current) =>
          current.map((element) =>
            element.id === suggestion.claimElementId
              ? {
                  ...element,
                  reasoning: suggestion.suggestedReasoning,
                  status: "accepted",
                  evidenceSource: suggestion.citation,
                }
              : element
          )
        );
        setHighlightedId(suggestion.claimElementId);

        updateMessages(selectedId, (current) => [
          ...current,
          makeSystemMessage(
            selectedId,
            "Suggestion accepted. Claim chart updated."
          ),
        ]);
      } finally {
        actionLockRef.current = false;
      }
    },
    [
      makeSystemMessage,
      patchSuggestionStatus,
      recoverIdleGuard,
      selectedId,
      typingThreadId,
      updateMessages,
    ]
  );

  const handleReject = useCallback(
    (suggestion: SuggestionPayload) => {
      recoverIdleGuard();
      if (actionLockRef.current) return;
      if (
        suggestion.status !== "pending" ||
        typingThreadId !== null ||
        typingThreadRef.current
      ) {
        return;
      }

      actionLockRef.current = true;
      try {
        patchSuggestionStatus(suggestion.id, "rejected");
        setActiveSuggestionId(suggestion.id);
        updateMessages(selectedId, (current) => [
          ...current,
          makeSystemMessage(
            selectedId,
            "Suggestion rejected. Claim chart unchanged."
          ),
        ]);
      } finally {
        actionLockRef.current = false;
      }
    },
    [
      makeSystemMessage,
      patchSuggestionStatus,
      recoverIdleGuard,
      selectedId,
      typingThreadId,
      updateMessages,
    ]
  );

  const handleRefine = useCallback(
    (suggestion: SuggestionPayload) => {
      recoverIdleGuard();
      if (actionLockRef.current) return;
      if (
        suggestion.status !== "pending" ||
        typingThreadId !== null ||
        typingThreadRef.current
      ) {
        return;
      }

      actionLockRef.current = true;
      const stamp = new Date();
      const threadId = selectedId;
      const thread = messagesByClaimRef.current[threadId] ?? EMPTY_MESSAGES;

      // Version from the latest suggestion in this thread (accepted or pending).
      let maxVersion = suggestion.version ?? 1;
      for (const message of thread) {
        const version = message.suggestion?.version ?? 0;
        if (version > maxVersion) maxVersion = version;
      }
      const nextVersion = maxVersion + 1;

      // Prefer the newest pending suggestion as refine base when ids differ.
      let baseSuggestion = suggestion;
      for (let index = thread.length - 1; index >= 0; index -= 1) {
        const candidate = thread[index]?.suggestion;
        if (candidate?.status === "pending") {
          baseSuggestion = candidate;
          break;
        }
      }

      const userMessage: ChatMessage = {
        id: `msg-u-refine-${stamp.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        claimElementId: threadId,
        content: "Refine Further",
        createdAt: stamp.toISOString(),
        timeLabel: formatTimeLabel(stamp),
      };

      const generation = beginTyping(threadId);
      actionLockRef.current = false;
      updateMessages(threadId, (current) => [...current, userMessage]);
      setHighlightedId(baseSuggestion.claimElementId);

      const claimElement =
        elementsRef.current.find(
          (element) => element.id === baseSuggestion.claimElementId
        ) ??
        elementsRef.current.find((element) => element.id === threadId) ??
        elementsRef.current[0];

      if (!claimElement) {
        updateMessages(threadId, (current) => [
          ...current,
          makeSystemMessage(threadId, userFacingMessage("missing_claim")),
        ]);
        clearTyping(threadId);
        return;
      }

      const evidenceForClaim = EVIDENCE_ITEMS.filter(
        (item) =>
          item.claimElementId === baseSuggestion.claimElementId ||
          item.claimElementId === claimElement.id
      );

      void (async () => {
        try {
          const { message } = await resolveAssistantMessage({
            prompt: "Refine Further",
            threadId,
            claimElement,
            evidence: evidenceForClaim,
            messages: [...thread, userMessage],
            version: nextVersion,
            intro:
              "Here's a more technically grounded version based on your refinement request.",
            baseSuggestion,
            minDelayMs: TYPING_DELAY_MS,
          });
          commitAssistant(threadId, generation, message);
        } catch (error) {
          commitFailure(threadId, generation, error);
        }
      })();
    },
    [
      beginTyping,
      clearTyping,
      commitAssistant,
      commitFailure,
      makeSystemMessage,
      recoverIdleGuard,
      selectedId,
      typingThreadId,
      updateMessages,
    ]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto md:h-full md:overflow-hidden">
      <div className="shrink-0 rounded-xl border border-border/80 bg-card px-4 py-1.5 shadow-sm">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
            Patent Analysis Session
          </p>
          <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {MATTER.title}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground/80">
            {elements.length} Claim Element
            {elements.length === 1 ? "" : "s"}
            {" · "}
            {MATTER.documentCount} Supporting Documents
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 md:h-full md:overflow-hidden md:grid-cols-[minmax(0,3fr)_minmax(0,4.2fr)_minmax(0,3fr)]">
        <div className="min-h-[min(70vh,28rem)] overflow-hidden md:min-h-0 md:h-full">
          <ClaimChartPanel
            elements={elements}
            selectedId={selectedId}
            highlightedId={highlightedId}
            onSelect={handleSelect}
          />
        </div>
        <div className="min-h-[min(70vh,28rem)] overflow-hidden md:min-h-0 md:h-full">
          <ChatPanel
            selectedElement={selectedElement}
            evidence={evidence}
            messages={messages}
            isBusy={isBusy}
            showTypingIndicator={showTypingIndicator}
            activeSuggestionId={activeSuggestionId ?? latestSuggestionId}
            latestSuggestionId={latestSuggestionId}
            onSend={handleSend}
            onAccept={handleAccept}
            onReject={handleReject}
            onRefine={handleRefine}
            onSelectSuggestion={setActiveSuggestionId}
          />
        </div>
        <div className="min-h-[min(70vh,28rem)] overflow-hidden md:min-h-0 md:h-full">
          <EvidencePanel
            selectedElement={evidenceElement}
            evidence={evidence}
            activeSources={activeSuggestion?.evidenceSources}
          />
        </div>
      </div>
    </div>
  );
}
