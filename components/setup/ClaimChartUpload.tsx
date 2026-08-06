"use client";

import { CheckCircle2, FileText, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClaimChartUploadProps {
  fileName: string | null;
  onSimulateSelect: (fileName: string) => void;
  onClear: () => void;
}

/**
 * Simulated claim chart dropzone — visual selection only, no real uploads.
 */
export function ClaimChartUpload({
  fileName,
  onSimulateSelect,
  onClear,
}: ClaimChartUploadProps) {
  const isSelected = Boolean(fileName);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Claim Chart</h3>
        <p className="text-sm text-muted-foreground">
          Required to begin a refinement session.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isSelected) onSimulateSelect("Patent_US123456.docx");
        }}
        onKeyDown={(event) => {
          if (!isSelected && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSimulateSelect("Patent_US123456.docx");
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onSimulateSelect("Patent_US123456.docx");
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed px-6 py-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50",
          isSelected
            ? "border-orange-200 bg-orange-50/70"
            : "border-border/90 bg-muted/15 hover:border-foreground/20 hover:bg-muted/30"
        )}
      >
        {isSelected && fileName ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <CheckCircle2 className="size-6" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                <FileText className="size-4 text-muted-foreground" aria-hidden />
                ✓ {fileName}
              </p>
              <p className="text-sm font-medium text-orange-700">
                Ready for analysis
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
              <Upload className="size-5" aria-hidden />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                No claim chart selected yet.
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Upload a claim chart or use the sample dataset to begin.
              </p>
              <p className="text-sm font-medium text-foreground/80">
                Drag & drop your claim chart here
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats:{" "}
                <span className="font-medium text-foreground/70">
                  DOCX • PDF
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 bg-background shadow-sm focus-visible:border-orange-300 focus-visible:ring-orange-500/40"
              onClick={(event) => {
                event.stopPropagation();
                onSimulateSelect("Patent_US123456.docx");
              }}
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
