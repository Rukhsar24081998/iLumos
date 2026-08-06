"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKSPACE_RESET_FLAG } from "@/lib/workspaceReset";

/**
 * Global application header — Phase 2 branding retained.
 */
export function Header() {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace");

  const markWorkspaceReset = () => {
    try {
      sessionStorage.setItem(WORKSPACE_RESET_FLAG, "1");
    } catch {
      // Ignore storage failures; home → workspace remount still resets.
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div
        className={cn(
          "mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6",
          isWorkspace ? "max-w-[1600px]" : "max-w-5xl"
        )}
      >
        <Link href="/" className="flex items-center gap-3">
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
            <span className="text-[11px] leading-none text-muted-foreground">
              AI-powered Patent Claim Chart Refinement
            </span>
          </span>
        </Link>

        {isWorkspace ? (
          <Link
            href="/"
            onClick={markWorkspaceReset}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-border bg-background text-foreground hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800"
            )}
          >
            New Session
          </Link>
        ) : null}
      </div>
    </header>
  );
}
