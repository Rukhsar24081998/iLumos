"use client";

import { useEffect, useMemo, useRef } from "react";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/workspace/EmptyState";
import { cn } from "@/lib/utils";
import type { ClaimElement, EvidenceItem } from "@/types/workspace";

interface EvidencePanelProps {
  selectedElement: ClaimElement | undefined;
  evidence: EvidenceItem[];
  activeSources?: string[];
}

function highlightKeywords(text: string, keywords: string[]) {
  if (!keywords.length || !text) return text;

  const pattern = new RegExp(
    `(${keywords
      .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})`,
    "gi"
  );

  const parts = text.split(pattern);
  return parts.map((part, index) => {
    const isMatch = keywords.some(
      (keyword) => keyword.toLowerCase() === part.toLowerCase()
    );
    if (!isMatch) return <span key={`${part}-${index}`}>{part}</span>;
    return (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-orange-100 px-0.5 text-orange-900"
      >
        {part}
      </mark>
    );
  });
}

function matchesActiveSource(item: EvidenceItem, sources: string[]) {
  if (!sources.length) return false;
  return sources.some(
    (source) =>
      item.documentName === source ||
      item.citation?.includes(source) ||
      item.source?.includes(source)
  );
}

/**
 * Right panel — detailed evidence for the selected claim element.
 */
export function EvidencePanel({
  selectedElement,
  evidence,
  activeSources = [],
}: EvidencePanelProps) {
  const keywords = selectedElement?.keywords;
  const hasActiveSources = activeSources.length > 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  const highlightedSnippets = useMemo(() => {
    const keywordList = keywords ?? [];
    return evidence.map((item) => ({
      id: item.id,
      nodes: highlightKeywords(item.snippet ?? "", keywordList),
    }));
  }, [evidence, keywords]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = 0;
  }, [selectedElement?.id]);

  const keywordList = keywords ?? [];

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      aria-label="Supporting Evidence"
    >
      <div className="shrink-0 border-b border-border/70 px-3 py-2">
        <div className="flex h-5 items-center gap-2">
          <span
            className="flex size-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white"
            aria-hidden
          >
            3
          </span>
          <h2 className="text-sm font-semibold text-foreground">
            Supporting Evidence
          </h2>
        </div>

        <div className="mt-1.5 min-h-[4.5rem]">
          {selectedElement ? (
            <div className="min-w-0 overflow-hidden">
              <p className="break-words text-sm font-semibold leading-snug text-foreground">
                {selectedElement.patentClaimElement ?? "Untitled claim element"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                <span>
                  {evidence.length} supporting document
                  {evidence.length === 1 ? "" : "s"}
                </span>
                <span className="text-border" aria-hidden>
                  ·
                </span>
                <span className="text-muted-foreground/80">
                  {selectedElement.id ?? ""}
                </span>
              </div>
              {keywordList.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {keywordList.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="border-orange-200 bg-orange-50/50 text-[10px] text-orange-800"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] leading-snug text-muted-foreground">
              No claim selected. Uploaded documents and snippets appear here
              after you choose a claim element.
            </p>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2.5"
      >
        <div className="space-y-1.5">
          {!selectedElement ? (
            <EmptyState
              title="No claim selected"
              description="Select a claim element from the chart to review supporting evidence and citations."
            />
          ) : evidence.length === 0 ? (
            <EmptyState
              title="No supporting evidence"
              description="No sufficient technical evidence was found for this claim element in the uploaded documents."
            />
          ) : (
            evidence.map((item) => {
              if (!item?.id) return null;
              const isHighlighted =
                hasActiveSources && matchesActiveSource(item, activeSources);
              const snippet = highlightedSnippets.find(
                (entry) => entry.id === item.id
              )?.nodes;
              const confidenceLabel =
                typeof item.confidence === "number"
                  ? `${(item.confidence * 100).toFixed(0)}% confidence`
                  : "Confidence unavailable";
              return (
                <article
                  key={item.id}
                  className={cn(
                    "min-w-0 max-w-full overflow-hidden rounded-lg border bg-background p-2.5 transition-colors duration-200",
                    isHighlighted
                      ? "border-orange-300 bg-orange-50/40 ring-1 ring-orange-200"
                      : "border-border/80",
                    hasActiveSources && !isHighlighted && "opacity-55"
                  )}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <FileText
                          className="size-3.5 shrink-0 text-orange-500"
                          aria-hidden
                        />
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.documentName ?? "Untitled document"}
                        </p>
                      </div>
                      <p className="mt-0.5 pl-5 text-[10px] text-muted-foreground">
                        {item.sourceType ?? "Document"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      aria-label={confidenceLabel}
                      className="shrink-0 border-orange-200 bg-orange-50 text-[10px] font-medium text-orange-800"
                    >
                      {typeof item.confidence === "number"
                        ? `${(item.confidence * 100).toFixed(0)}%`
                        : "—"}
                    </Badge>
                  </div>

                  <p className="break-words whitespace-normal text-xs leading-snug text-foreground">
                    {snippet ?? item.snippet ?? ""}
                  </p>

                  <div className="mt-1.5 space-y-0.5 overflow-hidden border-t border-border/50 pt-1.5">
                    <p className="break-words text-[10px] leading-snug text-muted-foreground">
                      <span className="font-medium text-foreground/70">
                        Citation
                      </span>
                      <span className="mx-1 text-border">·</span>
                      {item.citation ?? "—"}
                    </p>
                    <p className="break-words text-[10px] leading-snug text-muted-foreground">
                      <span className="font-medium text-foreground/70">
                        Context
                      </span>
                      <span className="mx-1 text-border">·</span>
                      {item.source ?? "—"}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
