"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AiInstructions } from "@/components/setup/AiInstructions";
import { ClaimChartUpload } from "@/components/setup/ClaimChartUpload";
import { QuickStart } from "@/components/setup/QuickStart";
import {
  SAMPLE_CLAIM_CHART,
  SAMPLE_SUPPORTING_DOCUMENTS,
} from "@/components/setup/sampleFiles";
import { SupportingDocumentsUpload } from "@/components/setup/SupportingDocumentsUpload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Phase 2 onboarding form — local UI state.
 * Phase 3: Start Analysis navigates to the workspace.
 */
export function SetupForm() {
  const router = useRouter();
  const [claimChart, setClaimChart] = useState<string | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<string[]>([]);
  const [aiInstructions, setAiInstructions] = useState("");

  const canStart = Boolean(claimChart);
  const allSampleDocsLoaded = useMemo(
    () =>
      SAMPLE_SUPPORTING_DOCUMENTS.every((name) =>
        supportingDocs.includes(name)
      ),
    [supportingDocs]
  );

  const handleStartAnalysis = () => {
    if (!canStart) return;
    router.push("/workspace");
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
      <QuickStart
        claimChartLoaded={claimChart === SAMPLE_CLAIM_CHART}
        documentsLoaded={allSampleDocsLoaded}
        onLoadClaimChart={() => {
          setClaimChart(SAMPLE_CLAIM_CHART);
        }}
        onLoadSupportingDocuments={() => {
          setSupportingDocs([...SAMPLE_SUPPORTING_DOCUMENTS]);
        }}
      />

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="space-y-1.5 border-b border-border/60 bg-card px-6 py-5">
          <CardTitle className="text-base font-semibold tracking-tight">
            Start a refinement session
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Provide a claim chart to continue. Supporting documents and AI
            instructions are optional.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 px-6 py-7">
          <ClaimChartUpload
            fileName={claimChart}
            onSimulateSelect={setClaimChart}
            onClear={() => {
              setClaimChart(null);
            }}
          />

          <div className="h-px bg-border/70" />

          <SupportingDocumentsUpload
            files={supportingDocs}
            onSimulateAdd={(fileNames) => {
              setSupportingDocs((current) => {
                const next = new Set(current);
                fileNames.forEach((name) => next.add(name));
                return Array.from(next);
              });
            }}
            onRemove={(fileName) => {
              setSupportingDocs((current) =>
                current.filter((name) => name !== fileName)
              );
            }}
          />

          <div className="h-px bg-border/70" />

          <AiInstructions
            value={aiInstructions}
            onChange={setAiInstructions}
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-border/60 bg-muted/25 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {canStart
              ? "Claim chart selected. Start analysis to open the workspace."
              : "Select a claim chart to enable Start Analysis."}
          </p>
          <Button
            type="button"
            size="lg"
            disabled={!canStart}
            onClick={handleStartAnalysis}
            className={cn(
              "h-11 w-full bg-orange-500 px-8 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:ring-orange-500/50 sm:w-auto sm:min-w-48",
              canStart && "shadow-md",
              !canStart && "disabled:bg-orange-500/40 disabled:text-white"
            )}
          >
            Start Analysis
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
