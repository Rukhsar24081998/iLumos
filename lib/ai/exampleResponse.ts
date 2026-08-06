/**
 * Example successful AIResponse (fixture for docs / local reference).
 * Not used by the app UI.
 */

import type { AIResponse } from "@/lib/ai/types";

export const EXAMPLE_AI_RESPONSE: AIResponse = {
  summary:
    "I strengthened the CE-3 reasoning using Engineering_Manual.pdf, tying Auto-Schedule’s preference learning to the claimed machine-learning behavior.",
  improvedReasoning:
    "Acme’s Auto-Schedule feature learns user temperature preferences over time by recording historical setpoint adjustments and updating recommended schedules based on observed preference patterns, as described in Engineering_Manual.pdf. This adaptive scheduling behavior corresponds to the claimed machine learning algorithm that learns user temperature preferences over time.",
  supportingEvidence:
    "Auto-Schedule records user setpoint changes over multiple days and updates recommended schedules based on observed preference patterns.",
  citation:
    "Engineering_Manual.pdf — Auto-Schedule preference learning from setpoints",
  confidence: 0.91,
  proposedUpdates: {
    claimElementId: "CE-3",
    reasoning:
      "Acme’s Auto-Schedule feature learns user temperature preferences over time by recording historical setpoint adjustments and updating recommended schedules based on observed preference patterns, as described in Engineering_Manual.pdf. This adaptive scheduling behavior corresponds to the claimed machine learning algorithm that learns user temperature preferences over time.",
    evidenceSource:
      "Engineering_Manual.pdf — Auto-Schedule preference learning from setpoints",
  },
  rationale:
    "Engineering documentation provides a more technically grounded basis than marketing copy alone.",
  evidenceCitations: [
    {
      documentName: "Engineering_Manual.pdf",
      excerpt:
        "Auto-Schedule records historical setpoint adjustments and updates recommended schedules based on observed preference patterns.",
      location: "Auto-Schedule preference learning",
    },
  ],
  primarySource: "Engineering_Manual.pdf",
  noEvidenceFound: false,
};
