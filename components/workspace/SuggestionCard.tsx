"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/workspace/LoadingSpinner";
import { cn } from "@/lib/utils";
import type { SuggestionPayload } from "@/types/workspace";

interface SuggestionCardProps {
  suggestion: SuggestionPayload;
  isActive?: boolean;
  isActionable?: boolean;
  /** True while any AI request is in flight (disables actions). */
  isBusy?: boolean;
  onSelect?: () => void;
  onAccept: (suggestion: SuggestionPayload) => void;
  onReject: (suggestion: SuggestionPayload) => void;
  onRefine: (suggestion: SuggestionPayload) => void;
}

function suggestionStatusLabel(
  status: SuggestionPayload["status"]
): "Pending" | "Accepted" | "Rejected" {
  if (status === "accepted") return "Accepted";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function suggestionStatusTone(
  status: SuggestionPayload["status"]
): "amber" | "emerald" | "slate" {
  if (status === "accepted") return "emerald";
  if (status === "rejected") return "slate";
  return "amber";
}

/**
 * Compact conversational suggestion card — details collapsed by default.
 * Article container + dedicated select control (no nested interactive wrapper).
 */
export function SuggestionCard({
  suggestion,
  isActive = false,
  isActionable = false,
  isBusy = false,
  onSelect,
  onAccept,
  onReject,
  onRefine,
}: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "accept" | "reject" | "refine" | null
  >(null);
  const detailsId = useId();
  const timeLabel = suggestion.timeLabel;
  const version = suggestion.version ?? 1;
  const rawConfidence =
    typeof suggestion.confidence === "number" &&
    Number.isFinite(suggestion.confidence)
      ? suggestion.confidence
      : 0.55;
  const confidence = Math.min(1, Math.max(0.15, rawConfidence));
  const sources = (suggestion.evidenceSources ?? []).filter(
    (name) =>
      typeof name === "string" &&
      name.trim() &&
      !["undefined", "null", "true", "false"].includes(name.trim().toLowerCase())
  );
  const primarySource =
    typeof suggestion.primarySource === "string" &&
    suggestion.primarySource.trim() &&
    !["undefined", "null", "true", "false"].includes(
      suggestion.primarySource.trim().toLowerCase()
    )
      ? suggestion.primarySource.trim()
      : sources[0] ?? "Supporting documents";
  const citation =
    typeof suggestion.citation === "string" &&
    suggestion.citation.trim() &&
    !["undefined", "null", "true", "false", "noevidencefound"].includes(
      suggestion.citation.trim().toLowerCase()
    )
      ? suggestion.citation.trim()
      : "";
  const summary =
    typeof suggestion.summary === "string" ? suggestion.summary.trim() : "";
  const title =
    typeof suggestion.title === "string" && suggestion.title.trim()
      ? suggestion.title.trim()
      : "Suggestion";
  const originalReasoning =
    typeof suggestion.originalReasoning === "string"
      ? suggestion.originalReasoning.trim()
      : "";
  const suggestedReasoning =
    typeof suggestion.suggestedReasoning === "string"
      ? suggestion.suggestedReasoning.trim()
      : "";
  const evidenceText =
    typeof suggestion.evidence === "string" ? suggestion.evidence.trim() : "";
  const statusLabel = suggestionStatusLabel(suggestion.status);
  const statusTone = suggestionStatusTone(suggestion.status);
  const actionsLocked = !isActionable || pendingAction !== null;

  useEffect(() => {
    if (!isBusy && pendingAction === "refine") {
      setPendingAction(null);
    }
  }, [isBusy, pendingAction]);

  useEffect(() => {
    if (pendingAction !== "accept" && pendingAction !== "reject") return;
    const timer = window.setTimeout(() => setPendingAction(null), 200);
    return () => window.clearTimeout(timer);
  }, [pendingAction]);

  const runAction = (
    action: "accept" | "reject" | "refine",
    handler: (suggestion: SuggestionPayload) => void
  ) => {
    if (actionsLocked) return;
    setPendingAction(action);
    handler(suggestion);
  };

  const disabledReason = isBusy
    ? "Wait for the current AI request to finish"
    : !isActionable
      ? "Only the latest pending suggestion can be updated"
      : undefined;

  return (
    <article
      data-screenshot="suggestion"
      aria-label={title}
      className={cn(
        "w-full max-w-full min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-colors duration-200",
        suggestion.status === "accepted" && "border-emerald-200 bg-emerald-50/20",
        suggestion.status === "rejected" && "border-border opacity-60",
        suggestion.status === "pending" && "border-border/80",
        isActive && "ring-1 ring-orange-300"
      )}
    >
      <div className="space-y-1.5 overflow-hidden p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={isActive}
            className={cn(
              "min-w-0 break-words text-left text-xs font-semibold text-foreground",
              "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            )}
          >
            {title}
          </button>
          {version > 1 ? (
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 text-[10px] text-slate-700"
            >
              Version {version}
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            aria-label={`${(confidence * 100).toFixed(0)} percent confidence`}
            className="border-orange-200 bg-orange-50 text-[10px] text-orange-800"
          >
            {(confidence * 100).toFixed(0)}% confidence
          </Badge>
          <Badge
            variant="outline"
            aria-label={`Suggestion status: ${statusLabel}`}
            className={cn(
              "text-[10px]",
              statusTone === "emerald" &&
                "border-emerald-200 bg-emerald-50 text-emerald-800",
              statusTone === "slate" &&
                "border-slate-200 bg-slate-50 text-slate-700",
              statusTone === "amber" &&
                "border-amber-200 bg-amber-50 text-amber-800"
            )}
          >
            {statusLabel}
          </Badge>
          {timeLabel ? (
            <span className="text-[10px] text-muted-foreground/80">
              {timeLabel}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isActive}
          className="w-full break-words whitespace-normal text-left text-sm leading-snug text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {summary}
        </button>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex min-w-0 max-w-full items-center gap-1">
            <FileText className="size-3.5 shrink-0 text-orange-500" aria-hidden />
            <span className="min-w-0 break-all font-medium text-foreground/80">
              {primarySource}
            </span>
          </span>
          {citation ? (
            <span className="min-w-0 break-all text-orange-800/80">
              {citation}
            </span>
          ) : null}
        </div>

        {suggestion.isNewRowProposal ? (
          <p className="break-words text-[11px] font-medium text-orange-800">
            Proposed new row — added to the chart only after Accept.
          </p>
        ) : null}

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 transition-colors duration-150 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {expanded ? (
            <>
              Hide Details <ChevronUp className="size-3.5" aria-hidden />
            </>
          ) : (
            <>
              View Details <ChevronDown className="size-3.5" aria-hidden />
            </>
          )}
        </button>

        {expanded ? (
          <div
            id={detailsId}
            className="min-w-0 space-y-2 overflow-hidden border-t border-border/70 pt-2"
          >
            <DetailBlock
              label="Original Reasoning"
              value={originalReasoning}
              muted
            />
            <DetailBlock
              label="Improved Reasoning"
              value={suggestedReasoning}
            />
            <DetailBlock label="Supporting Evidence" value={evidenceText} />
            <div className="min-w-0 overflow-hidden">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                Evidence Sources
              </p>
              <p className="break-words text-xs text-foreground">
                {sources.length ? sources.join(" · ") : "—"}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                Citations
              </p>
              <p className="break-all text-xs text-orange-800">
                {citation || "—"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-1.5 border-t border-border/60 bg-muted/15 px-2.5 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actionsLocked}
          title={disabledReason}
          aria-label="Reject suggestion"
          onClick={() => runAction("reject", onReject)}
          className="transition-opacity duration-150"
        >
          {pendingAction === "reject" ? (
            <>
              <LoadingSpinner />
              Rejecting…
            </>
          ) : (
            "Reject"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actionsLocked}
          title={disabledReason}
          aria-label="Refine suggestion further"
          aria-busy={pendingAction === "refine"}
          onClick={() => runAction("refine", onRefine)}
          className="border-orange-200 text-orange-800 transition-opacity duration-150 hover:bg-orange-50"
        >
          {pendingAction === "refine" ? (
            <>
              <LoadingSpinner className="text-orange-600" />
              Refining…
            </>
          ) : (
            "Refine Further"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={actionsLocked}
          title={disabledReason}
          aria-label="Accept suggestion"
          onClick={() => runAction("accept", onAccept)}
          className="bg-orange-500 text-white transition-opacity duration-150 hover:bg-orange-600"
        >
          {pendingAction === "accept" ? (
            <>
              <LoadingSpinner className="text-white" />
              Accepting…
            </>
          ) : (
            "Accept"
          )}
        </Button>
      </div>
    </article>
  );
}

function DetailBlock({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
        {label}
      </p>
      <p
        className={cn(
          "break-words whitespace-normal rounded-md px-2 py-1.5 text-xs leading-snug",
          muted
            ? "bg-muted/40 text-muted-foreground"
            : "border border-border/70 bg-background text-foreground"
        )}
      >
        {value || "—"}
      </p>
    </div>
  );
}
