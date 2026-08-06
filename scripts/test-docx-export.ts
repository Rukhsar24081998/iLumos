/**
 * Phase 6 validation: build export snapshots for Accept / Reject / Pending
 * scenarios and generate a real .docx buffer.
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/test-docx-export.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildWelcomeMessages,
  INITIAL_CLAIM_ELEMENTS,
  INITIAL_NEEDS_REVIEW_COUNT,
  SCENARIO_SUGGESTIONS,
} from "@/data/mockWorkspace";
import { buildClaimChartDocxBuffer } from "@/lib/export/buildClaimChartDocx";
import {
  buildExportSnapshot,
  exportFilename,
} from "@/lib/export/buildExportSnapshot";
import type { ChatMessage, ClaimElement, SuggestionPayload } from "@/types/workspace";

function cloneElements(): ClaimElement[] {
  return INITIAL_CLAIM_ELEMENTS.map((element) => ({ ...element }));
}

function baseMessages(): Record<string, ChatMessage[]> {
  return {
    "CE-1": buildWelcomeMessages("CE-1", INITIAL_NEEDS_REVIEW_COUNT),
    "CE-2": buildWelcomeMessages("CE-2", INITIAL_NEEDS_REVIEW_COUNT),
    "CE-3": buildWelcomeMessages("CE-3", INITIAL_NEEDS_REVIEW_COUNT),
  };
}

function suggestionMessage(
  suggestion: SuggestionPayload,
  claimElementId: string
): ChatMessage {
  return {
    id: `msg-${suggestion.id}`,
    role: "assistant",
    content: suggestion.summary,
    claimElementId,
    suggestion,
    timeLabel: "12:00 PM",
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const strengthen = SCENARIO_SUGGESTIONS.strengthen_evidence;
  assert(strengthen, "Expected strengthen_evidence mock suggestion");

  // --- Accepted (V2 accepted after V1 rejected conceptually) ---
  const acceptedElements = cloneElements();
  const v1: SuggestionPayload = {
    ...strengthen,
    id: "sug-v1",
    claimElementId: "CE-1",
    version: 1,
    status: "rejected",
    suggestedReasoning: "Discarded version 1 reasoning — should not export.",
  };
  const v2: SuggestionPayload = {
    ...strengthen,
    id: "sug-v2",
    claimElementId: "CE-1",
    version: 2,
    status: "accepted",
    suggestedReasoning: "Accepted version 2 reasoning for CE-1.",
    confidence: 0.94,
  };
  acceptedElements[0] = {
    ...acceptedElements[0]!,
    reasoning: v2.suggestedReasoning,
    status: "accepted",
    evidenceSource: v2.citation,
  };
  const acceptedMessages = baseMessages();
  acceptedMessages["CE-1"] = [
    ...acceptedMessages["CE-1"]!,
    suggestionMessage(v1, "CE-1"),
    suggestionMessage(v2, "CE-1"),
  ];

  // --- Rejected ---
  const rejectedElements = cloneElements();
  const rejectedSuggestion: SuggestionPayload = {
    ...strengthen,
    id: "sug-rej",
    claimElementId: "CE-2",
    version: 1,
    status: "rejected",
    suggestedReasoning: "Rejected suggestion — chart keeps original.",
  };
  const rejectedMessages = baseMessages();
  rejectedMessages["CE-2"] = [
    ...rejectedMessages["CE-2"]!,
    suggestionMessage(rejectedSuggestion, "CE-2"),
  ];

  // --- Pending ---
  const pendingElements = cloneElements();
  const pendingSuggestion: SuggestionPayload = {
    ...strengthen,
    id: "sug-pend",
    claimElementId: "CE-3",
    version: 1,
    status: "pending",
    suggestedReasoning: "Pending suggestion — not yet applied.",
  };
  const pendingMessages = baseMessages();
  pendingMessages["CE-3"] = [
    ...pendingMessages["CE-3"]!,
    suggestionMessage(pendingSuggestion, "CE-3"),
  ];

  // Combined multi-claim workspace
  const elements = [
    acceptedElements[0]!,
    rejectedElements[1]!,
    pendingElements[2]!,
  ];
  const messagesByClaim: Record<string, ChatMessage[]> = {
    "CE-1": acceptedMessages["CE-1"]!,
    "CE-2": rejectedMessages["CE-2"]!,
    "CE-3": pendingMessages["CE-3"]!,
  };

  const snapshot = buildExportSnapshot(elements, messagesByClaim, new Date());

  assert(snapshot.elements.length === 3, "Expected 3 claim elements");
  assert(snapshot.elements[0]?.reviewStatus === "Accepted", "CE-1 Accepted");
  assert(
    snapshot.elements[0]?.reasoning === "Accepted version 2 reasoning for CE-1.",
    "CE-1 uses accepted reasoning"
  );
  assert(
    snapshot.elements[0]?.acceptedRefinement?.version === 2,
    "Only latest accepted version exported"
  );
  assert(
    !snapshot.elements[0]?.acceptedRefinement?.reasoning.includes("Discarded"),
    "Discarded V1 must not appear"
  );
  assert(snapshot.elements[1]?.reviewStatus === "Rejected", "CE-2 Rejected");
  assert(
    snapshot.elements[1]?.reasoning === INITIAL_CLAIM_ELEMENTS[1]!.reasoning,
    "Rejected keeps original reasoning"
  );
  assert(snapshot.elements[2]?.reviewStatus === "Pending", "CE-3 Pending");
  assert(snapshot.summary.accepted === 1, "summary accepted");
  assert(snapshot.summary.rejected === 1, "summary rejected");
  assert(snapshot.summary.pending === 1, "summary pending");
  assert(snapshot.summary.needsReview === 0, "summary needs review");

  const buffer = await buildClaimChartDocxBuffer(snapshot);
  assert(buffer.byteLength > 1000, "DOCX buffer too small");
  // DOCX is a ZIP — starts with PK
  assert(buffer[0] === 0x50 && buffer[1] === 0x4b, "Expected ZIP/DOCX signature");

  const outPath = join(process.cwd(), "tmp", exportFilename(snapshot.patentId));
  try {
    writeFileSync(outPath, buffer);
    console.log(`Wrote sample: ${outPath}`);
  } catch {
    // tmp/ may not exist — still validate generation
    console.log("Skipped writing sample file (tmp/ unavailable)");
  }

  console.log("Export validation passed:");
  console.log(`  filename: ${exportFilename(snapshot.patentId)}`);
  console.log(`  size: ${buffer.byteLength} bytes`);
  console.log(
    `  statuses: ${snapshot.elements.map((e) => `${e.id}=${e.reviewStatus}`).join(", ")}`
  );
  console.log(
    `  summary: A=${snapshot.summary.accepted} R=${snapshot.summary.rejected} P=${snapshot.summary.pending} NR=${snapshot.summary.needsReview}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
