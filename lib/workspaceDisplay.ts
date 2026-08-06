import type { ClaimElement } from "@/types/workspace";

/**
 * Presentation-only review labels for the claim chart.
 * Keeps underlying ClaimStatus for interactions; does not change mock data.
 */
export type ReviewStatusLabel =
  | "Needs Review"
  | "Weak Evidence"
  | "Weak Reasoning"
  | "Improved"
  | "Accepted"
  | "Pending Review";

/** Scenario-aligned labels while a claim is still awaiting analyst action. */
const INITIAL_REVIEW_LABEL: Record<string, ReviewStatusLabel> = {
  "CE-1": "Needs Review",
  "CE-2": "Weak Evidence",
  "CE-3": "Weak Reasoning",
  "CE-4": "Pending Review",
};

export function getReviewStatusLabel(
  element: ClaimElement | null | undefined
): ReviewStatusLabel {
  if (!element) return "Needs Review";
  if (element.status === "accepted") return "Accepted";
  if (element.status === "improved") return "Improved";
  return INITIAL_REVIEW_LABEL[element.id] ?? "Needs Review";
}

export function getReviewStatusTone(
  label: ReviewStatusLabel | null | undefined
): "amber" | "rose" | "orange" | "emerald" | "slate" {
  switch (label) {
    case "Accepted":
      return "emerald";
    case "Improved":
      return "orange";
    case "Weak Reasoning":
    case "Weak Evidence":
      return "rose";
    case "Pending Review":
      return "slate";
    case "Needs Review":
    default:
      return "amber";
  }
}

/** Average confidence for evidence tied to the selected claim (0–1). */
export function averageConfidence(
  confidences: Array<number | null | undefined> | null | undefined
): number | null {
  if (!confidences?.length) return null;
  const values = confidences.filter(
    (value): value is number => typeof value === "number" && !Number.isNaN(value)
  );
  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}
