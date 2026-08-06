"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Send, Sparkles } from "lucide-react";

import { StatusBadge } from "@/components/workspace/StatusBadge";
import { SuggestionCard } from "@/components/workspace/SuggestionCard";
import { PROMPT_CHIPS } from "@/data/mockWorkspace";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { averageConfidence } from "@/lib/workspaceDisplay";
import { cn } from "@/lib/utils";
import type {
  ChatMessage,
  ClaimElement,
  EvidenceItem,
  SuggestionPayload,
} from "@/types/workspace";

interface ChatPanelProps {
  selectedElement: ClaimElement | undefined;
  evidence: EvidenceItem[];
  messages: ChatMessage[];
  /** Disables composer/chips while any claim thread is awaiting a reply. */
  isBusy: boolean;
  /** Typing indicator for the currently selected claim thread only. */
  showTypingIndicator: boolean;
  activeSuggestionId: string | null;
  latestSuggestionId: string | null;
  onSend: (prompt: string) => void;
  onAccept: (suggestion: SuggestionPayload) => void;
  onReject: (suggestion: SuggestionPayload) => void;
  onRefine: (suggestion: SuggestionPayload) => void;
  onSelectSuggestion: (suggestionId: string) => void;
}

function titleCaseChip(label: string | undefined) {
  if (!label) return "";
  return label
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function MessageMeta({
  role,
  timeLabel,
  align = "left",
}: {
  role?: string;
  timeLabel?: string;
  align?: "left" | "right";
}) {
  if (!role && !timeLabel) return null;
  return (
    <div
      className={cn(
        "mb-0.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/80",
        align === "right" && "justify-end"
      )}
    >
      {role ? <span>{role}</span> : null}
      {timeLabel ? (
        <span className="font-medium normal-case tracking-normal text-muted-foreground/60">
          {timeLabel}
        </span>
      ) : null}
    </div>
  );
}

function TimelineStep({
  role,
  timeLabel,
  live,
  children,
}: {
  role: "System" | "Assistant" | "User";
  timeLabel?: string;
  live?: boolean;
  children: ReactNode;
}) {
  const isUser = role === "User";
  const isSystem = role === "System";

  return (
    <div
      className={cn("flex min-w-0 max-w-full gap-2", isUser && "justify-end")}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
    >
      {!isUser ? (
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
            isSystem
              ? "bg-muted text-muted-foreground"
              : "bg-orange-500 text-white"
          )}
          aria-hidden
        >
          {isSystem ? "S" : <Sparkles className="size-2.5" aria-hidden />}
        </span>
      ) : null}
      <div
        className={cn(
          "min-w-0 max-w-[min(100%,28rem)] overflow-hidden break-words whitespace-normal",
          isUser
            ? "rounded-xl rounded-br-md bg-orange-500 px-2.5 py-1.5 text-sm leading-snug text-white"
            : isSystem
              ? "rounded-md bg-muted/50 px-2.5 py-1 text-[11px] leading-snug text-muted-foreground"
              : "rounded-xl rounded-tl-md border border-border/80 bg-background px-2.5 py-1.5 text-sm leading-snug text-foreground shadow-sm"
        )}
      >
        {!isUser ? (
          <MessageMeta role={role} timeLabel={timeLabel} />
        ) : timeLabel ? (
          <p className="mb-0.5 text-right text-[9px] font-medium text-white/70">
            {timeLabel}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      className="flex min-w-0 max-w-full gap-2"
      role="status"
      aria-live="polite"
      aria-label="Analyzing claim element"
    >
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white"
        aria-hidden
      >
        <Sparkles className="size-2.5" aria-hidden />
      </span>
      <div className="min-w-0 max-w-[min(100%,28rem)] rounded-xl rounded-tl-md border border-border/80 bg-background px-2.5 py-1.5 shadow-sm">
        <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          Assistant
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="inline-flex gap-0.5" aria-hidden>
            <span className="size-1 animate-pulse rounded-full bg-orange-400 [animation-delay:0ms]" />
            <span className="size-1 animate-pulse rounded-full bg-orange-400 [animation-delay:150ms]" />
            <span className="size-1 animate-pulse rounded-full bg-orange-400 [animation-delay:300ms]" />
          </span>
          Analyzing claim element…
        </p>
      </div>
    </div>
  );
}

/**
 * Center panel — compact conversational refinement UI.
 */
export function ChatPanel({
  selectedElement,
  evidence,
  messages,
  isBusy,
  showTypingIndicator,
  activeSuggestionId,
  latestSuggestionId,
  onSend,
  onAccept,
  onReject,
  onRefine,
  onSelectSuggestion,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const safeMessages = messages;
  const safeEvidence = evidence;
  const overallConfidence = averageConfidence(
    safeEvidence.map((item) => item.confidence)
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, selectedElement?.id, showTypingIndicator]);

  const handleSubmit = () => {
    const value = draft.trim();
    if (!value || isBusy) return;
    onSend(value);
    setDraft("");
  };

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      aria-label="AI Analysis"
    >
      <div className="shrink-0 border-b border-border/70 px-3 py-2">
        <div className="flex h-5 items-center gap-2">
          <span
            className="flex size-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white"
            aria-hidden
          >
            2
          </span>
          <h2 className="text-sm font-semibold text-foreground">AI Analysis</h2>
        </div>

        <div className="mt-1.5 min-h-[4.5rem]">
          {selectedElement ? (
            <div className="overflow-hidden rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-orange-800/70">
                Currently Reviewing
              </p>
              <p className="mt-1 break-words text-sm font-semibold leading-snug text-foreground">
                {selectedElement.patentClaimElement ?? "Untitled claim element"}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusBadge element={selectedElement} />
                <span className="text-[10px] text-muted-foreground/80">
                  {safeEvidence.length} supporting document
                  {safeEvidence.length === 1 ? "" : "s"}
                </span>
                {overallConfidence !== null ? (
                  <>
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                    <span className="text-[10px] font-medium text-orange-800">
                      {(overallConfidence * 100).toFixed(0)}% overall confidence
                    </span>
                  </>
                ) : null}
                <span className="text-[10px] text-muted-foreground/70">
                  {selectedElement.id ?? ""}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/80">
              Select a claim element to begin refinement
            </p>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2.5"
        role="log"
        aria-relevant="additions"
        aria-label="Conversation history"
      >
        <div className="space-y-1.5 py-2">
          {safeMessages.map((message) => {
            if (!message?.id) return null;

            if (message.role === "welcome") {
              const frozenCount = message.introNeedsReviewCount ?? 0;
              return (
                <div key={message.id} className="min-w-0 space-y-1.5">
                  <TimelineStep role="System" timeLabel={message.timeLabel}>
                    Analysis completed successfully.
                  </TimelineStep>

                  <div className="flex justify-center" aria-hidden>
                    <span className="text-[9px] leading-none text-muted-foreground/60">
                      ↓
                    </span>
                  </div>

                  <TimelineStep role="Assistant" timeLabel={message.timeLabel}>
                    <p className="break-words leading-snug">
                      I found {frozenCount} claim element
                      {frozenCount === 1 ? "" : "s"} requiring refinement.
                    </p>
                    <p className="mt-1 break-words text-[12px] leading-snug text-foreground/90">
                      {message.content ?? ""}
                    </p>
                  </TimelineStep>
                </div>
              );
            }

            if (message.role === "system") {
              return (
                <TimelineStep
                  key={message.id}
                  role="System"
                  timeLabel={message.timeLabel}
                  live
                >
                  {message.content ?? ""}
                </TimelineStep>
              );
            }

            if (message.role === "user") {
              return (
                <div key={message.id} className="min-w-0 space-y-1.5">
                  <div className="flex justify-center" aria-hidden>
                    <span className="text-[9px] leading-none text-muted-foreground/60">
                      ↓
                    </span>
                  </div>
                  <TimelineStep role="User" timeLabel={message.timeLabel}>
                    {message.content ?? ""}
                  </TimelineStep>
                </div>
              );
            }

            const suggestion = message.suggestion;

            return (
              <div key={message.id} className="min-w-0 max-w-full space-y-1.5">
                <div className="flex justify-center" aria-hidden>
                  <span className="text-[9px] leading-none text-muted-foreground/60">
                    ↓
                  </span>
                </div>
                {suggestion ? (
                  <div className="min-w-0 max-w-full space-y-1.5 overflow-hidden">
                    {message.content &&
                    message.content !== suggestion.summary ? (
                      <TimelineStep
                        role="Assistant"
                        timeLabel={message.timeLabel}
                      >
                        {message.content}
                      </TimelineStep>
                    ) : (
                      <MessageMeta
                        role="Assistant"
                        timeLabel={message.timeLabel}
                      />
                    )}
                    <SuggestionCard
                      suggestion={suggestion}
                      isActive={activeSuggestionId === suggestion.id}
                      isActionable={
                        suggestion.status === "pending" &&
                        suggestion.id === latestSuggestionId &&
                        !isBusy
                      }
                      onSelect={() => onSelectSuggestion(suggestion.id)}
                      onAccept={onAccept}
                      onReject={onReject}
                      onRefine={onRefine}
                    />
                  </div>
                ) : (
                  <TimelineStep
                    role="Assistant"
                    timeLabel={message.timeLabel}
                  >
                    {message.content ?? ""}
                  </TimelineStep>
                )}
              </div>
            );
          })}

          {showTypingIndicator ? <TypingIndicator /> : null}
        </div>
      </div>

      <div className="shrink-0 space-y-1.5 border-t border-border/70 p-2.5">
        <div className="space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            Suggested Actions
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested actions">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={isBusy}
                onClick={() => onSend(chip.prompt)}
                className={cn(
                  "rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground transition-colors",
                  "hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                {titleCaseChip(chip.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask to strengthen evidence, improve reasoning…"
            aria-label="Message to AI"
            className="max-h-32 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-background text-sm"
            disabled={isBusy}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!draft.trim() || isBusy}
            className="h-9 shrink-0 bg-orange-500 px-3 text-white hover:bg-orange-600"
            aria-label="Send message"
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
