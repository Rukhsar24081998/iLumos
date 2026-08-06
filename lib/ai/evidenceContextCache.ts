/**
 * Cache claim-scoped evidence context between refinements.
 * Rebuild only when the selected claim or its evidence ids change.
 */

import type { SupportingDocumentContext } from "@/lib/ai/types";
import type { EvidenceItem } from "@/types/workspace";

export interface CachedEvidenceContext {
  claimElementId: string;
  fingerprint: string;
  supportingDocuments: SupportingDocumentContext[];
  uploadedDocumentNames: string[];
}

function fingerprintEvidence(evidence: EvidenceItem[]): string {
  return evidence
    .map(
      (item) =>
        `${item.id}:${item.documentName}:${item.snippet?.length ?? 0}:${item.confidence ?? ""}`
    )
    .join("|");
}

function toSupportingDocuments(
  evidence: EvidenceItem[]
): SupportingDocumentContext[] {
  return evidence.map((item) => ({
    documentName: item.documentName,
    excerpt: item.snippet,
    sourceType: item.sourceType,
    citation: item.citation,
    source: item.source,
    confidence: item.confidence,
  }));
}

function toUploadedDocumentNames(evidence: EvidenceItem[]): string[] {
  const names: string[] = [];
  for (const item of evidence) {
    const name = item.documentName?.trim();
    if (!name || names.includes(name)) continue;
    names.push(name);
  }
  return names;
}

const cache = new Map<string, CachedEvidenceContext>();

/**
 * Return cached supporting-doc context for a claim, or build and store it.
 */
export function getCachedEvidenceContext(
  claimElementId: string,
  evidence: EvidenceItem[]
): CachedEvidenceContext {
  const fingerprint = fingerprintEvidence(evidence);
  const hit = cache.get(claimElementId);
  if (hit && hit.fingerprint === fingerprint) {
    return hit;
  }

  const next: CachedEvidenceContext = {
    claimElementId,
    fingerprint,
    supportingDocuments: toSupportingDocuments(evidence),
    uploadedDocumentNames: toUploadedDocumentNames(evidence),
  };
  cache.set(claimElementId, next);
  return next;
}

/** Test / New Session helper — clears all cached evidence contexts. */
export function clearEvidenceContextCache(): void {
  cache.clear();
}
