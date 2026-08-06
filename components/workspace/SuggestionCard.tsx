"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SuggestionPayload } from "@/types/workspace";

interface SuggestionCardProps {
  suggestion: SuggestionPayload;
  isActive?: boolean;
  isActionable?: boolean;
  onSelect?: () => void;
  onAccept: (suggestion: SuggestionPayload) => void;
  onReject: (suggestion: SuggestionPayload) => void;
  onRefine: (suggestion: SuggestionPayload) => void;
}

/**
 * Compact conversational suggestion card — details collapsed by default.
 * Article container + dedicated select control (no nested interactive wrapper).
 */
export function SuggestionCard({
  suggestion,
  isActive = false,
  isActionable = false,
  onSelect,
  onAccept,
  onReject,
  onRefine,
}: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const timeLabel = suggestion.timeLabel;
  const version = suggestion.version ?? 1;
  const confidence =
    typeof suggestion.confidence === "number" ? suggestion.confidence : 0;
  const sources = suggestion.evidenceSources ?? [];

  return (
    <article
      aria-label={suggestion.title ?? "Suggestion"}
      className={cn(
        "w-full max-w-full min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-colors",
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
            {suggestion.title ?? "Suggestion"}
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
            className="border-orange-200 bg-orange-50 text-[10px] text-orange-800"
          >
            {(confidence * 100).toFixed(0)}% confidence
          </Badge>
          <Badge variant="outline" className="text-[10px] capitalize">
            {suggestion.status ?? "pending"}
          </Badge>
          {timeLabel ? (
            <span className="text-[10px] text-muted-foreground/70">
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
          {suggestion.summary ?? ""}
        </button>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground/80">
          <span className="inline-flex min-w-0 max-w-full items-center gap-1">
            <FileText className="size-3.5 shrink-0 text-orange-500" aria-hidden />
            <span className="min-w-0 break-all font-medium text-foreground/80">
              {suggestion.primarySource ?? "—"}
            </span>
          </span>
          <span className="min-w-0 break-all text-orange-800/80">
            {suggestion.citation ?? ""}
          </span>
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
          className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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
              value={suggestion.originalReasoning ?? ""}
              muted
            />
            <DetailBlock
              label="Improved Reasoning"
              value={suggestion.suggestedReasoning ?? ""}
            />
            <DetailBlock
              label="Supporting Evidence"
              value={suggestion.evidence ?? ""}
            />
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
                {suggestion.citation ?? "—"}
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
          disabled={!isActionable}
          onClick={() => onReject(suggestion)}
        >
          Reject
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!isActionable}
          onClick={() => onRefine(suggestion)}
          className="border-orange-200 text-orange-800 hover:bg-orange-50"
        >
          Refine Further
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!isActionable}
          onClick={() => onAccept(suggestion)}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          Accept
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
