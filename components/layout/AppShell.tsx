"use client";

import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/Header";
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
    <div
      className={cn(
        "flex flex-col bg-background",
        isWorkspace
          ? "min-h-dvh md:h-dvh md:overflow-hidden"
          : "min-h-screen"
      )}
    >
      <Header />
      <main
        className={cn(
          "mx-auto w-full max-w-[1600px] min-h-0 flex-1",
          isWorkspace
            ? "overflow-y-auto px-3 py-2 sm:px-4 sm:py-3 md:overflow-hidden"
            : "px-4 py-6 sm:px-6 lg:py-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}
