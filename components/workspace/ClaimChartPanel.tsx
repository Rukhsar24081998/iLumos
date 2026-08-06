"use client";

import { EmptyState } from "@/components/workspace/EmptyState";
import { StatusBadge } from "@/components/workspace/StatusBadge";
import { getReviewStatusLabel } from "@/lib/workspaceDisplay";
import { cn } from "@/lib/utils";
import type { ClaimElement } from "@/types/workspace";

interface ClaimChartPanelProps {
  elements: ClaimElement[];
  selectedId: string;
  highlightedId?: string | null;
  onSelect: (id: string) => void;
}

/**
 * Left panel — selectable claim chart rows from mock data.
 */
export function ClaimChartPanel({
  elements,
  selectedId,
  highlightedId,
  onSelect,
}: ClaimChartPanelProps) {
  const selected = elements.find((element) => element.id === selectedId);

  return (
    <section
      data-screenshot="claim-chart"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      aria-label="Claim Chart"
    >
      <div className="shrink-0 border-b border-border/70 px-3 py-2">
        <div className="flex h-5 items-center gap-2">
          <span
            className="flex size-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white"
            aria-hidden
          >
            1
          </span>
          <h2 className="text-sm font-semibold text-foreground">Claim Chart</h2>
        </div>
        <div className="mt-1.5 min-h-[4.5rem]">
          {selected ? (
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                Selected
              </p>
              <p className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-snug text-foreground">
                {selected.patentClaimElement}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/80">
                {selected.id} · Choose another row to switch analysis focus
              </p>
            </div>
          ) : (
            <p className="text-[11px] leading-snug text-muted-foreground">
              No claim selected. Choose a claim element below to begin analysis.
            </p>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {elements.length === 0 ? (
          <EmptyState
            className="m-2.5"
            title="No claim elements"
            description="Upload or load a claim chart to populate this panel. Nothing is available to review yet."
          />
        ) : (
          <ul className="space-y-1.5 p-2.5" role="list">
            {elements.map((element) => {
              if (!element?.id) return null;
              const isSelected = element.id === selectedId;
              const flash = element.id === highlightedId;
              return (
                <li key={element.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelect(element.id)}
                    aria-pressed={isSelected}
                    aria-label={`${element.patentClaimElement ?? "Claim element"} (${element.id}), status ${getReviewStatusLabel(element)}`}
                    className={cn(
                      "relative w-full max-w-full min-w-0 overflow-hidden rounded-lg bg-background px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow] duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
                      "cursor-pointer",
                      isSelected
                        ? "border-2 border-orange-500 bg-orange-50 shadow-sm"
                        : "border border-border/80 hover:border-foreground/15 hover:bg-muted/30",
                      flash &&
                        "border-orange-400 bg-orange-100/70 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.35)]"
                    )}
                  >
                    {isSelected ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-1 bg-orange-500"
                      />
                    ) : null}

                    <div className={cn(isSelected && "pl-1.5")}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-foreground">
                          {element.patentClaimElement ??
                            "Untitled claim element"}
                        </p>
                        <StatusBadge
                          element={element}
                          className="shrink-0 whitespace-nowrap"
                        />
                      </div>

                      <p className="mt-1 line-clamp-2 break-words text-[11px] leading-snug text-muted-foreground">
                        {element.accusedProductFeature ?? ""}
                      </p>

                      <p className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground/80">
                        {element.id}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
