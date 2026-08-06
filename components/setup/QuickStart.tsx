"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickStartProps {
  onLoadClaimChart: () => void;
  onLoadSupportingDocuments: () => void;
  claimChartLoaded: boolean;
  documentsLoaded: boolean;
}

/**
 * Demo helpers that simulate selecting the mock dataset filenames.
 */
export function QuickStart({
  onLoadClaimChart,
  onLoadSupportingDocuments,
  claimChartLoaded,
  documentsLoaded,
}: QuickStartProps) {
  return (
    <Card className="border-border/80 bg-gradient-to-b from-muted/40 to-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-500 shadow-sm">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <CardTitle className="text-base font-semibold">Quick Start</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Explore the product instantly using the sample claim chart and
              supporting documents from the assignment.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onLoadClaimChart}
          disabled={claimChartLoaded}
          className={cn(
            "h-10 flex-1 shadow-sm",
            claimChartLoaded
              ? "border-orange-200 bg-orange-50 text-orange-800 disabled:opacity-100"
              : "border-border bg-background"
          )}
        >
          {claimChartLoaded
            ? "✓ Sample Claim Chart Loaded"
            : "Load Sample Claim Chart"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onLoadSupportingDocuments}
          disabled={documentsLoaded}
          className={cn(
            "h-10 flex-1 shadow-sm",
            documentsLoaded
              ? "border-orange-200 bg-orange-50 text-orange-800 disabled:opacity-100"
              : "border-border bg-background"
          )}
        >
          {documentsLoaded
            ? "✓ Sample Documents Loaded"
            : "Load Sample Supporting Documents"}
        </Button>
      </CardContent>
    </Card>
  );
}
