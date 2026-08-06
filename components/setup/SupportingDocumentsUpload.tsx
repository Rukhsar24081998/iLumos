"use client";

import { CheckCircle2, FileText, Upload, X } from "lucide-react";

import { SAMPLE_SUPPORTING_DOCUMENTS } from "@/components/setup/sampleFiles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SupportingDocumentsUploadProps {
  files: string[];
  onSimulateAdd: (fileNames: string[]) => void;
  onRemove: (fileName: string) => void;
}

/**
 * Simulated multi-document dropzone — selection UI only.
 */
export function SupportingDocumentsUpload({
  files,
  onSimulateAdd,
  onRemove,
}: SupportingDocumentsUploadProps) {
  const hasFiles = files.length > 0;

  const handleSimulateBrowse = () => {
    const next = SAMPLE_SUPPORTING_DOCUMENTS.find(
      (name) => !files.includes(name)
    );
    if (next) onSimulateAdd([next]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          Supporting Documents
        </h3>
        <p className="text-sm text-muted-foreground">
          Optional. Multiple files supported.
        </p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onSimulateAdd([...SAMPLE_SUPPORTING_DOCUMENTS]);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed px-6 py-8 transition-colors",
          hasFiles
            ? "border-orange-200 bg-orange-50/50"
            : "border-border/90 bg-muted/15 hover:border-foreground/20 hover:bg-muted/30"
        )}
      >
        {hasFiles ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <CheckCircle2 className="size-5" aria-hidden />
              </div>
              <p className="text-sm font-medium text-orange-700">
                Ready for analysis
              </p>
            </div>

            <ul className="space-y-2">
              {files.map((fileName) => (
                <li
                  key={fileName}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        ✓ {fileName}
                      </p>
                      <p className="text-xs font-medium text-orange-700">
                        Ready for analysis
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove ${fileName}`}
                    onClick={() => onRemove(fileName)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>

            {files.length < SAMPLE_SUPPORTING_DOCUMENTS.length ? (
              <div className="flex justify-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 bg-background focus-visible:border-orange-300 focus-visible:ring-orange-500/40"
                  onClick={handleSimulateBrowse}
                >
                  Browse Files
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
              <Upload className="size-5" aria-hidden />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                No supporting documents selected yet.
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Add technical manuals and product materials, or load the sample
                dataset.
              </p>
              <p className="text-sm font-medium text-foreground/80">
                Drag & drop supporting documents
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats:{" "}
                <span className="font-medium text-foreground/70">
                  DOCX • PDF
                </span>
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Multiple files supported
              </p>
            </div>

            <div className="w-full max-w-md rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-left">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Example files
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {SAMPLE_SUPPORTING_DOCUMENTS.map((name) => (
                  <li key={name} className="truncate">
                    {name}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 bg-background shadow-sm focus-visible:border-orange-300 focus-visible:ring-orange-500/40"
              onClick={handleSimulateBrowse}
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
