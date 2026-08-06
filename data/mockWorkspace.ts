import { formatTimeLabel, MOCK_TIME_LABEL } from "@/lib/formatTimeLabel";
import type {
  ChatMessage,
  ClaimElement,
  EvidenceItem,
  PromptChip,
  ScenarioKey,
  SuggestionPayload,
} from "@/types/workspace";

/** Matter metadata from docs/04_MockData.md */
export const MATTER = {
  title: "US123456 vs. Acme Corp Thermostat",
  patentId: "US123456",
  accusedProduct: "Acme Corp Smart Thermostat",
  documentCount: 4,
} as const;

export const WELCOME_MESSAGE =
  "I've analyzed the uploaded claim chart and identified areas where the reasoning and supporting evidence can be strengthened. Select a claim element or choose one of the suggested actions below to begin refining the chart.";

/** Initial claim chart — exact wording from docs/04_MockData.md */
export const INITIAL_CLAIM_ELEMENTS: ClaimElement[] = [
  {
    id: "CE-1",
    patentClaimElement:
      "A temperature control device with a wireless communication module",
    accusedProductFeature:
      'Acme Thermostat product page states: "WiFi-enabled smart thermostat connects to your home network."',
    reasoning:
      "The Acme device has WiFi capability which satisfies the wireless communication module requirement.",
    evidenceSource:
      "Product_Brochure.pdf — product page / marketing description of WiFi connectivity",
    status: "needs_review",
    keywords: ["WiFi", "wireless", "communication", "network"],
  },
  {
    id: "CE-2",
    patentClaimElement: "A motion sensor for detecting occupancy",
    accusedProductFeature:
      'Acme technical specifications document shows: "Built-in motion sensor detects when people are home."',
    reasoning:
      "Motion sensor explicitly mentioned in specifications directly maps to the claim element for occupancy detection.",
    evidenceSource:
      "Technical_Specification.pdf — motion sensor / occupancy detection statement",
    status: "needs_review",
    keywords: ["motion sensor", "occupancy", "detects", "people"],
  },
  {
    id: "CE-3",
    patentClaimElement:
      "Machine learning algorithm that learns user temperature preferences over time",
    accusedProductFeature:
      'Acme marketing materials claim: "Auto-Schedule learns your preferred temperatures."',
    reasoning:
      "The learning behavior described suggests a machine learning algorithm, though technical implementation details are not disclosed. May need stronger technical evidence.",
    evidenceSource: "Product_Brochure.pdf — Auto-Schedule marketing claim",
    status: "needs_review",
    keywords: ["Auto-Schedule", "learns", "preferences", "machine learning"],
  },
];

/** Frozen intro count for welcome messages (initial chart needs_review rows). */
export const INITIAL_NEEDS_REVIEW_COUNT = INITIAL_CLAIM_ELEMENTS.filter(
  (element) => element.status === "needs_review"
).length;

/** Evidence snippets keyed to claim elements — detailed view lives here */
export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "EV-1A",
    claimElementId: "CE-1",
    documentName: "Product_Brochure.pdf",
    snippet:
      '"WiFi-enabled smart thermostat connects to your home network."',
    source: "Product page / marketing description",
    sourceType: "Product Brochure",
    citation: "Product_Brochure.pdf — WiFi-enabled product page statement",
    confidence: 0.82,
  },
  {
    id: "EV-1B",
    claimElementId: "CE-1",
    documentName: "Technical_Specification.pdf",
    snippet:
      "Connectivity: IEEE 802.11 b/g/n WiFi module for home network communication",
    source: "Technical specifications — connectivity",
    sourceType: "Technical Specification",
    citation: "Technical_Specification.pdf — IEEE 802.11 WiFi module",
    confidence: 0.9,
  },
  {
    id: "EV-2A",
    claimElementId: "CE-2",
    documentName: "Technical_Specification.pdf",
    snippet: '"Built-in motion sensor detects when people are home."',
    source: "Technical specifications — occupancy",
    sourceType: "Technical Specification",
    citation: "Technical_Specification.pdf — built-in motion sensor statement",
    confidence: 0.88,
  },
  {
    id: "EV-2B",
    claimElementId: "CE-2",
    documentName: "Engineering_Manual.pdf",
    snippet:
      "Built-in passive infrared motion sensor used to determine whether the premises are occupied and to adjust HVAC runtime accordingly",
    source: "Engineering manual — motion / occupancy",
    sourceType: "Engineering Manual",
    citation:
      "Engineering_Manual.pdf — PIR motion sensor / occupancy-based HVAC",
    confidence: 0.93,
  },
  {
    id: "EV-3A",
    claimElementId: "CE-3",
    documentName: "Product_Brochure.pdf",
    snippet: '"Auto-Schedule learns your preferred temperatures."',
    source: "Marketing materials — Auto-Schedule",
    sourceType: "Product Brochure",
    citation: "Product_Brochure.pdf — Auto-Schedule marketing claim",
    confidence: 0.7,
  },
  {
    id: "EV-3B",
    claimElementId: "CE-3",
    documentName: "Engineering_Manual.pdf",
    snippet:
      "Auto-Schedule records user setpoint changes over multiple days and updates recommended schedules based on observed preference patterns",
    source: "Engineering manual — Auto-Schedule",
    sourceType: "Engineering Manual",
    citation:
      "Engineering_Manual.pdf — Auto-Schedule preference learning from setpoints",
    confidence: 0.92,
  },
  {
    id: "EV-4A",
    claimElementId: "CE-4",
    documentName: "Technical_Specification.pdf",
    snippet:
      "Temperature sensor array with multiple thermistors for ambient measurement",
    source: "Technical specifications — sensing",
    sourceType: "Technical Specification",
    citation: "Technical_Specification.pdf — temperature sensor array",
    confidence: 0.89,
  },
  {
    id: "EV-4B",
    claimElementId: "CE-4",
    documentName: "Engineering_Manual.pdf",
    snippet:
      "Multi-point temperature sensor array used for ambient room temperature measurement",
    source: "Engineering manual — temperature sensing",
    sourceType: "Engineering Manual",
    citation: "Engineering_Manual.pdf — multi-point temperature sensor array",
    confidence: 0.9,
  },
];

export const PROMPT_CHIPS: PromptChip[] = [
  {
    id: "chip-strengthen",
    label: "Strengthen evidence",
    prompt: "Add technical documentation for the motion sensor claim.",
    scenarioKey: "strengthen_evidence",
  },
  {
    id: "chip-reasoning",
    label: "Improve reasoning",
    prompt:
      "The AI reasoning for element 3 is vague. Add more specific technical analysis.",
    scenarioKey: "fix_weak_reasoning",
  },
  {
    id: "chip-legal",
    label: "Clarify legal language",
    prompt:
      "Rewrite the reasoning to address potential claim construction arguments.",
    scenarioKey: "clarify_legal",
  },
  {
    id: "chip-missing",
    label: "Add missing feature",
    prompt: "AI missed that Acme also has a temperature sensor array.",
    scenarioKey: "add_missing_feature",
  },
];

function suggestion(
  partial: Omit<SuggestionPayload, "status"> & {
    status?: SuggestionPayload["status"];
  }
): SuggestionPayload {
  return {
    status: "pending",
    createdAt: "2026-08-06T18:21:00.000Z",
    timeLabel: MOCK_TIME_LABEL,
    ...partial,
  };
}

/** Scenario → suggestion payloads from docs/04_MockData.md */
export const SCENARIO_SUGGESTIONS: Record<ScenarioKey, SuggestionPayload> = {
  strengthen_evidence: suggestion({
    id: "S1",
    claimElementId: "CE-2",
    title: "Strengthen Evidence — CE-2",
    summary:
      "I found stronger technical support for the motion sensor claim. Engineering documentation ties the built-in sensor to occupancy detection and HVAC control more clearly than the current chart.",
    primarySource: "Engineering_Manual.pdf",
    citation:
      "Engineering_Manual.pdf — PIR motion sensor / occupancy-based HVAC",
    confidence: 0.91,
    originalReasoning:
      "Motion sensor explicitly mentioned in specifications directly maps to the claim element for occupancy detection.",
    suggestedReasoning:
      "The accused Acme Corp Smart Thermostat includes a built-in motion sensor that detects occupant presence. Technical_Specification.pdf expressly states that the motion sensor detects when people are home, and Engineering_Manual.pdf further explains that the sensor’s occupancy state is used to adjust HVAC operation. This evidence maps directly to the claimed “motion sensor for detecting occupancy.”",
    evidence:
      "The Acme Smart Thermostat includes a built-in passive infrared motion sensor that detects occupant presence and uses occupancy state to adjust HVAC operation when people are home. Technical_Specification.pdf also states: “Built-in motion sensor detects when people are home.”",
    evidenceSources: ["Engineering_Manual.pdf", "Technical_Specification.pdf"],
  }),
  fix_weak_reasoning: suggestion({
    id: "S2",
    claimElementId: "CE-3",
    title: "Improve Reasoning — CE-3",
    summary:
      "The current ML reasoning is too speculative. I recommend grounding it in Auto-Schedule’s engineering description of learning from historical setpoint changes.",
    primarySource: "Engineering_Manual.pdf",
    citation:
      "Engineering_Manual.pdf — Auto-Schedule preference learning from setpoints",
    confidence: 0.88,
    originalReasoning:
      "The learning behavior described suggests a machine learning algorithm, though technical implementation details are not disclosed. May need stronger technical evidence.",
    suggestedReasoning:
      "Acme’s Auto-Schedule feature learns user temperature preferences over time by recording historical setpoint adjustments and updating recommended schedules based on observed preference patterns, as described in Engineering_Manual.pdf. This adaptive scheduling behavior corresponds to the claimed machine learning algorithm that learns user temperature preferences over time. While the brochure uses consumer-facing “learns your preferred temperatures” language, the engineering manual supplies the operational detail needed to support the claim mapping.",
    evidence:
      "Auto-Schedule records user setpoint changes over multiple days and updates recommended schedules based on observed preference patterns. Secondary support: “Auto-Schedule learns your preferred temperatures.”",
    evidenceSources: ["Engineering_Manual.pdf", "Product_Brochure.pdf"],
  }),
  add_missing_feature: suggestion({
    id: "S3",
    claimElementId: "CE-4",
    title: "Add Missing Feature — CE-4",
    summary:
      "You’re right — the chart omits Acme’s temperature sensor array. I can propose a new claim chart row based on the technical and engineering docs. Nothing is added until you Accept.",
    primarySource: "Technical_Specification.pdf",
    citation: "Technical_Specification.pdf — temperature sensor array",
    confidence: 0.84,
    originalReasoning: "(None — feature missing from initial chart)",
    suggestedReasoning:
      "The accused product includes a temperature sensor array that measures ambient room temperature as part of the thermostat’s temperature control function. This feature was omitted from the initial chart and should be considered for inclusion as supporting product evidence related to the temperature control device.",
    evidence:
      "Temperature sensor array with multiple thermistors for ambient measurement. Engineering manual also describes a multi-point temperature sensor array for ambient room temperature measurement.",
    evidenceSources: ["Technical_Specification.pdf", "Engineering_Manual.pdf"],
    isNewRowProposal: true,
    proposedPatentClaimElement:
      "Temperature sensing capability associated with the temperature control device",
    proposedAccusedProductFeature:
      "Acme Technical_Specification.pdf and Engineering_Manual.pdf describe a temperature sensor array with multiple thermistors for ambient room temperature measurement",
  }),
  clarify_legal: suggestion({
    id: "S4",
    claimElementId: "CE-1",
    title: "Clarify Legal Language — CE-1",
    summary:
      "I tightened the CE-1 reasoning for claim construction around “wireless communication module,” without changing the underlying WiFi evidence.",
    primarySource: "Product_Brochure.pdf",
    citation: "Product_Brochure.pdf — WiFi-enabled product page statement",
    confidence: 0.86,
    originalReasoning:
      "The Acme device has WiFi capability which satisfies the wireless communication module requirement.",
    suggestedReasoning:
      "Under a plain meaning construction, a “wireless communication module” includes a module that enables communication without a wired connection. The Acme Corp Smart Thermostat is described as a WiFi-enabled device that connects to the home network. WiFi is a wireless networking technology; accordingly, the accused product’s WiFi capability satisfies this claim element as currently evidenced by the product page statement that the thermostat “connects to your home network.”",
    evidence:
      "Evidence unchanged: “WiFi-enabled smart thermostat connects to your home network.”",
    evidenceSources: ["Product_Brochure.pdf"],
  }),
  refine_further: suggestion({
    id: "S-REFINE",
    claimElementId: "CE-3",
    title: "Refined Suggestion — CE-3",
    summary:
      "Here’s a tighter revision focused on Auto-Schedule’s engineering behavior, with the brochure kept as secondary support only.",
    primarySource: "Engineering_Manual.pdf",
    citation:
      "Engineering_Manual.pdf — Auto-Schedule preference learning from setpoints",
    confidence: 0.9,
    originalReasoning:
      "The learning behavior described suggests a machine learning algorithm, though technical implementation details are not disclosed. May need stronger technical evidence.",
    suggestedReasoning:
      "Acme’s Auto-Schedule feature learns user temperature preferences over time by recording historical setpoint adjustments and updating recommended schedules based on observed preference patterns, as described in Engineering_Manual.pdf. This adaptive scheduling behavior corresponds to the claimed machine learning algorithm that learns user temperature preferences over time.",
    evidence:
      "Auto-Schedule records user setpoint changes over multiple days and updates recommended schedules based on observed preference patterns.",
    evidenceSources: ["Engineering_Manual.pdf"],
  }),
};

export function buildWelcomeMessages(
  claimElementId: string,
  introNeedsReviewCount = INITIAL_NEEDS_REVIEW_COUNT
): ChatMessage[] {
  return [
    {
      id: `welcome-${claimElementId}`,
      role: "welcome",
      claimElementId,
      content: WELCOME_MESSAGE,
      createdAt: "2026-08-06T18:21:00.000Z",
      timeLabel: MOCK_TIME_LABEL,
      introNeedsReviewCount,
    },
  ];
}

export function resolveScenarioFromPrompt(prompt: string): ScenarioKey {
  const normalized = prompt.toLowerCase();
  if (
    normalized.includes("refine this suggestion") ||
    normalized.includes("refine further") ||
    normalized.includes("tighter technical")
  ) {
    return "refine_further";
  }
  if (
    normalized.includes("motion sensor") ||
    normalized.includes("technical documentation for the motion") ||
    normalized.includes("strengthen evidence")
  ) {
    return "strengthen_evidence";
  }
  if (
    normalized.includes("vague") ||
    normalized.includes("element 3") ||
    normalized.includes("ml algorithm") ||
    normalized.includes("technical analysis") ||
    normalized.includes("technical details") ||
    normalized.includes("improve reasoning")
  ) {
    return "fix_weak_reasoning";
  }
  if (
    normalized.includes("temperature sensor") ||
    normalized.includes("missing") ||
    normalized.includes("sensor array")
  ) {
    return "add_missing_feature";
  }
  if (
    normalized.includes("claim construction") ||
    normalized.includes("legal") ||
    normalized.includes("wireless communication")
  ) {
    return "clarify_legal";
  }
  return "fix_weak_reasoning";
}

export function createAssistantMessage(
  scenarioKey: ScenarioKey,
  claimElementId: string,
  options?: { version?: number; intro?: string }
): ChatMessage {
  const base = SCENARIO_SUGGESTIONS[scenarioKey];
  const version = options?.version ?? 1;
  const stamp = new Date();
  const now = stamp.toISOString();
  const timeLabel = formatTimeLabel(stamp);
  const suggestionPayload: SuggestionPayload = {
    ...base,
    id: `${base.id}-${stamp.getTime()}`,
    claimElementId:
      scenarioKey === "add_missing_feature"
        ? "CE-4"
        : base.claimElementId || claimElementId,
    status: "pending",
    createdAt: now,
    timeLabel,
    version,
    title:
      version > 1
        ? `${base.title.replace(/ — .*$/, "")} — Version ${version}`
        : base.title,
  };

  return {
    id: `msg-a-${stamp.getTime()}`,
    role: "assistant",
    claimElementId: suggestionPayload.claimElementId,
    content:
      options?.intro ??
      (version > 1
        ? "Here's a more technically grounded version based on your refinement request."
        : suggestionPayload.summary),
    suggestion: suggestionPayload,
    createdAt: now,
    timeLabel,
  };
}

/**
 * Build/update a claim chart row from an accepted suggestion payload.
 * Keeps mock architecture — no hardcoded CE-4 template.
 */
export function claimElementFromSuggestion(
  suggestion: SuggestionPayload,
  existing?: ClaimElement
): ClaimElement {
  const sources = suggestion.evidenceSources ?? [];
  const patentClaimElement =
    suggestion.proposedPatentClaimElement?.trim() ||
    existing?.patentClaimElement ||
    suggestion.title ||
    "Untitled claim element";
  const accusedProductFeature =
    suggestion.proposedAccusedProductFeature?.trim() ||
    existing?.accusedProductFeature ||
    suggestion.summary ||
    "";

  return {
    id: suggestion.claimElementId || existing?.id || "CE-new",
    patentClaimElement,
    accusedProductFeature,
    reasoning: suggestion.suggestedReasoning || existing?.reasoning || "",
    evidenceSource:
      sources.length > 0
        ? sources.join("; ")
        : suggestion.citation || existing?.evidenceSource || "",
    status: "improved",
    keywords: existing?.keywords?.length
      ? existing.keywords
      : deriveKeywordsFromSuggestion(suggestion),
  };
}

function deriveKeywordsFromSuggestion(suggestion: SuggestionPayload): string[] {
  const text = [
    suggestion.proposedPatentClaimElement,
    suggestion.evidence,
    ...(suggestion.evidenceSources ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const matches = text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [];
  const stop = new Set([
    "that",
    "with",
    "from",
    "this",
    "have",
    "been",
    "were",
    "which",
    "their",
    "into",
    "over",
    "time",
    "also",
    "pdf",
  ]);

  const unique: string[] = [];
  for (const word of matches) {
    if (stop.has(word) || unique.includes(word)) continue;
    unique.push(word);
    if (unique.length >= 4) break;
  }
  return unique;
}
