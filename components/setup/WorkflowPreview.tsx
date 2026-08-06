import { cn } from "@/lib/utils";

const STEPS = [
  "Upload Documents",
  "Refine with AI",
  "Review Suggestions",
  "Export Claim Chart",
] as const;

/** Current onboarding step — Upload Documents (index 0). */
const ACTIVE_STEP_INDEX = 0;

/**
 * Lightweight workflow preview under the hero.
 * Visual orientation only — no interactive behavior.
 */
export function WorkflowPreview() {
  return (
    <section
      aria-label="Product workflow"
      className="mx-auto w-full max-w-5xl rounded-2xl border border-border/70 bg-muted/20"
    >
      <div className="px-10 py-7 sm:px-12 lg:px-14">
        <p className="mb-5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          How it works
        </p>

        {/* Mobile: vertical stack */}
        <ol className="mx-auto flex max-w-sm flex-col items-center gap-2 sm:hidden">
          {STEPS.map((step, index) => {
            const isActive = index === ACTIVE_STEP_INDEX;
            return (
              <li key={step} className="flex w-full flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm",
                    isActive
                      ? "border-orange-200 bg-orange-50 text-orange-800"
                      : "border-border bg-card text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      isActive
                        ? "bg-orange-500 text-white"
                        : "bg-foreground text-background"
                    )}
                  >
                    {index + 1}
                  </span>
                  {step}
                </div>
                {index < STEPS.length - 1 ? (
                  <span aria-hidden className="text-muted-foreground/60">
                    ↓
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>

        {/*
          Desktop: 4 equal columns keep every pill inside the padded card.
          Arrows sit in the gutters between columns.
        */}
        <ol className="hidden w-full grid-cols-4 gap-x-5 sm:grid md:gap-x-6 lg:gap-x-8">
          {STEPS.map((step, index) => {
            const isActive = index === ACTIVE_STEP_INDEX;
            const isLast = index === STEPS.length - 1;
            return (
              <li key={step} className="relative min-w-0">
                <div
                  className={cn(
                    "flex h-full min-h-11 w-full items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-center text-[11px] font-medium leading-snug shadow-sm md:gap-2 md:px-2.5 md:text-xs lg:px-3 lg:text-sm",
                    isActive
                      ? "border-orange-200 bg-orange-50 text-orange-800"
                      : "border-border bg-card text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      isActive
                        ? "bg-orange-500 text-white"
                        : "bg-foreground text-background"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-balance">{step}</span>
                </div>

                {!isLast ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 -right-3 -translate-y-1/2 text-sm text-muted-foreground/70 md:-right-3.5 lg:-right-5"
                  >
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
