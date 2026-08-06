"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/workspace/LoadingSpinner";
import { useWorkspaceExport } from "@/components/workspace/WorkspaceExportContext";
import { cn } from "@/lib/utils";
import { WORKSPACE_RESET_FLAG } from "@/lib/workspaceReset";

/**
 * Global application header — Phase 2 branding retained.
 * Phase 6–7: Export DOCX + session controls beside each other.
 */
export function Header() {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace");
  const {
    exportDocx,
    isExporting,
    isWorkspaceBusy,
    exportError,
    clearExportError,
  } = useWorkspaceExport();

  const sessionLocked = isExporting || isWorkspaceBusy;

  const markWorkspaceReset = () => {
    try {
      sessionStorage.setItem(WORKSPACE_RESET_FLAG, "1");
    } catch {
      // Ignore storage failures; home → workspace remount still resets.
    }
  };

  return (
    <header
      data-screenshot="app-header"
      className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur-md"
    >      <div
        className={cn(
          "mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6",
          isWorkspace ? "max-w-[1600px]" : "max-w-5xl"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-lg",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
          )}
          aria-label="iLumos home"
        >
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-sm font-semibold tracking-tight text-white shadow-sm"
          >
            iL
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              iLumos
            </span>
            <span className="hidden text-[11px] leading-none text-muted-foreground sm:block">
              AI-powered Patent Claim Chart Refinement
            </span>
          </span>
        </Link>

        {isWorkspace ? (
          <div className="flex min-w-0 flex-col items-end gap-1">
            <div
              data-screenshot="export-controls"
              className="flex flex-wrap items-center justify-end gap-2"
            >
              <button
                type="button"
                disabled={isExporting}
                aria-busy={isExporting}
                aria-label={
                  isExporting
                    ? "Exporting claim chart"
                    : "Export claim chart as DOCX"
                }
                onClick={() => {
                  clearExportError();
                  void exportDocx();
                }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-border bg-background text-foreground transition-colors duration-150",
                  "hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner className="text-orange-600" />
                    Exporting…
                  </>
                ) : (
                  "Export DOCX"
                )}
              </button>
              <Link
                href="/"
                aria-disabled={sessionLocked}
                tabIndex={sessionLocked ? -1 : undefined}
                onClick={(event) => {
                  if (sessionLocked) {
                    event.preventDefault();
                    return;
                  }
                  markWorkspaceReset();
                }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-border bg-background text-foreground transition-colors duration-150",
                  "hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800",
                  sessionLocked &&
                    "pointer-events-none cursor-not-allowed opacity-60"
                )}
                title={
                  sessionLocked
                    ? "Wait for the current action to finish before starting a new session"
                    : "Start a new analysis session"
                }
              >
                {sessionLocked && isWorkspaceBusy && !isExporting ? (
                  <>
                    <LoadingSpinner className="text-orange-600" />
                    New Session
                  </>
                ) : (
                  "New Session"
                )}
              </Link>
            </div>
            {exportError ? (
              <div className="flex max-w-[min(100%,20rem)] items-start gap-2 sm:max-w-xs">
                <p
                  role="alert"
                  className="flex-1 text-right text-[11px] leading-snug text-rose-700"
                >
                  {exportError}
                </p>
                <button
                  type="button"
                  onClick={clearExportError}
                  className="shrink-0 rounded text-[11px] font-medium text-rose-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                  aria-label="Dismiss export error"
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
