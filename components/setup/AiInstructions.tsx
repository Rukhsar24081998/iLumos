"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AiInstructionsProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Optional free-text instructions for later AI refinement phases.
 */
export function AiInstructions({ value, onChange }: AiInstructionsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="ai-instructions" className="text-sm font-semibold">
          AI Instructions{" "}
          <span className="font-normal text-muted-foreground">(Optional)</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Guide how the AI should refine evidence and reasoning.
        </p>
      </div>
      <Textarea
        id="ai-instructions"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: Prioritize technical documentation and use legally precise language when refining reasoning."
        className="min-h-28 resize-y bg-background"
      />
    </div>
  );
}
