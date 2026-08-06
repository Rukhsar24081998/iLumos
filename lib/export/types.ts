/** Snapshot of the current workspace for DOCX export (Phase 6). */

export type ExportReviewStatus =
  | "Accepted"
  | "Pending"
  | "Rejected"
  | "Needs Review";

export interface ExportEvidenceItem {
  documentName: string;
  snippet: string;
  citation: string;
  confidence: number | null;
}

export interface ExportAcceptedRefinement {
  version: number;
  title: string;
  reasoning: string;
  confidence: number | null;
  primarySource: string;
  citation: string;
}

export interface ExportClaimElement {
  id: string;
  originalClaimText: string;
  reviewStatus: ExportReviewStatus;
  reasoning: string;
  overallConfidence: number | null;
  supportingDocuments: string[];
  evidenceSnippets: string[];
  evidenceCitations: string[];
  supportingDocumentCount: number;
  evidenceItems: ExportEvidenceItem[];
  /** Latest accepted AI refinement only — discarded versions omitted. */
  acceptedRefinement: ExportAcceptedRefinement | null;
}

export interface ExportSummary {
  totalClaimElements: number;
  accepted: number;
  rejected: number;
  pending: number;
  needsReview: number;
  averageConfidence: number | null;
}

export interface ClaimChartExportSnapshot {
  patentTitle: string;
  patentId: string;
  generatedAt: Date;
  elements: ExportClaimElement[];
  summary: ExportSummary;
}
