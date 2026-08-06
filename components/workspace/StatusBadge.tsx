"use client";

import { Badge } from "@/components/ui/badge";
import {
  getReviewStatusLabel,
  getReviewStatusTone,
} from "@/lib/workspaceDisplay";
import { cn } from "@/lib/utils";
import type { ClaimElement } from "@/types/workspace";

interface StatusBadgeProps {
  element: ClaimElement;
  className?: string;
}

/**
 * Shared claim-status badge used in chart and chat headers.
 */
export function StatusBadge({ element, className }: StatusBadgeProps) {
  const label = getReviewStatusLabel(element);
  const tone = getReviewStatusTone(label);

  return (
    <Badge
      variant="outline"
      aria-label={`Review status: ${label}`}
      className={cn(
        "text-[10px] font-medium transition-colors duration-200",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "rose" && "border-rose-200 bg-rose-50 text-rose-800",
        tone === "orange" && "border-orange-200 bg-orange-50 text-orange-800",
        tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-700",
        className
      )}
    >
      {label}
    </Badge>
  );
}
