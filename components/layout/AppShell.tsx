"use client";

import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { WorkspaceExportProvider } from "@/components/workspace/WorkspaceExportContext";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Reusable application shell: header + main content container.
 * Desktop workspace stays viewport-locked; below md the page can scroll.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace");

  return (
    <WorkspaceExportProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-orange-300"
      >
        Skip to main content
      </a>
      <div
        data-screenshot="app-shell"
        className={cn(
          "flex flex-col bg-background",
          isWorkspace
            ? "min-h-dvh md:h-dvh md:overflow-hidden"
            : "min-h-screen"
        )}
      >
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "mx-auto w-full max-w-[1600px] min-h-0 flex-1 outline-none",
            isWorkspace
              ? "overflow-y-auto px-3 py-2 sm:px-4 sm:py-3 md:overflow-hidden md:px-4 lg:px-5"
              : "px-4 py-6 sm:px-6 lg:py-8"
          )}
        >
          {children}
        </main>
      </div>
    </WorkspaceExportProvider>
  );
}
