"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  buildExportSnapshot,
  exportFilename,
} from "@/lib/export/buildExportSnapshot";
import { downloadBlob } from "@/lib/export/downloadDocx";
import type { ChatMessage, ClaimElement } from "@/types/workspace";

type SnapshotSource = () => {
  elements: ClaimElement[];
  messagesByClaim: Record<string, ChatMessage[]>;
} | null;

interface WorkspaceExportContextValue {
  /** Workspace registers a live snapshot getter; returns unregister. */
  registerSnapshotSource: (source: SnapshotSource) => () => void;
  /** Workspace reports AI busy so header actions can disable safely. */
  setWorkspaceBusy: (busy: boolean) => void;
  exportDocx: () => Promise<void>;
  isExporting: boolean;
  isWorkspaceBusy: boolean;
  exportError: string | null;
  clearExportError: () => void;
}

const WorkspaceExportContext =
  createContext<WorkspaceExportContextValue | null>(null);

const FRIENDLY_EXPORT_ERROR =
  "Couldn't export the claim chart. Please try again — your workspace was not changed.";

export function WorkspaceExportProvider({ children }: { children: ReactNode }) {
  const sourceRef = useRef<SnapshotSource | null>(null);
  const exportLockRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isWorkspaceBusy, setIsWorkspaceBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const registerSnapshotSource = useCallback((source: SnapshotSource) => {
    sourceRef.current = source;
    return () => {
      if (sourceRef.current === source) {
        sourceRef.current = null;
      }
    };
  }, []);

  const setWorkspaceBusy = useCallback((busy: boolean) => {
    setIsWorkspaceBusy(busy);
  }, []);

  const clearExportError = useCallback(() => setExportError(null), []);

  const exportDocx = useCallback(async () => {
    if (exportLockRef.current) return;
    exportLockRef.current = true;
    setExportError(null);
    setIsExporting(true);

    try {
      const source = sourceRef.current;
      const live = source?.() ?? null;
      if (!live || live.elements.length === 0) {
        setExportError(
          "No claim chart is available to export yet. Open the workspace with claim elements, then try again."
        );
        return;
      }

      const snapshot = buildExportSnapshot(
        live.elements,
        live.messagesByClaim,
        new Date()
      );

      // Generate DOCX on the server — `docx` must not enter the client bundle
      // (Turbopack emits illegal `super` usage that crashes page modules).
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

      if (!response.ok) {
        throw new Error(`Export HTTP ${response.status}`);
      }

      const blob = await response.blob();
      downloadBlob(blob, exportFilename(snapshot.patentId));
    } catch {
      setExportError(FRIENDLY_EXPORT_ERROR);
    } finally {
      setIsExporting(false);
      exportLockRef.current = false;
    }
  }, []);

  const value = useMemo(
    () => ({
      registerSnapshotSource,
      setWorkspaceBusy,
      exportDocx,
      isExporting,
      isWorkspaceBusy,
      exportError,
      clearExportError,
    }),
    [
      registerSnapshotSource,
      setWorkspaceBusy,
      exportDocx,
      isExporting,
      isWorkspaceBusy,
      exportError,
      clearExportError,
    ]
  );

  return (
    <WorkspaceExportContext.Provider value={value}>
      {children}
    </WorkspaceExportContext.Provider>
  );
}

export function useWorkspaceExport(): WorkspaceExportContextValue {
  const context = useContext(WorkspaceExportContext);
  if (!context) {
    throw new Error(
      "useWorkspaceExport must be used within WorkspaceExportProvider"
    );
  }
  return context;
}
