import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

/** Compact spinner for buttons and inline busy feedback. */
export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("size-3.5 shrink-0 animate-spin", className)}
      aria-hidden
    />
  );
}
