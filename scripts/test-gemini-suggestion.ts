/**
 * Local-only helper to exercise generateSuggestion().
 *
 * Usage:
 *   1. cp .env.example .env.local  (set GEMINI_API_KEY)
 *   2. npm run test:gemini
 *
 * Not connected to the Next.js app or workspace UI.
 */

import { config } from "dotenv";
import { resolve } from "node:path";

import {
  AIClientError,
  AIParseError,
  generateSuggestionWithTimings,
  type AIRequest,
} from "../lib/ai";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const sampleRequest: AIRequest = {
  requestId: "local-test-ce3",
  context: {
    claimElementId: "CE-3",
    patentClaimElement:
      "Machine learning algorithm that learns user temperature preferences over time",
    accusedProductFeature:
      'Acme marketing materials claim: "Auto-Schedule learns your preferred temperatures."',
    currentReasoning:
      "The learning behavior described suggests a machine learning algorithm, though technical implementation details are not disclosed. May need stronger technical evidence.",
    currentEvidenceSource: "Product_Brochure.pdf — Auto-Schedule marketing claim",
    claimStatus: "needs_review",
    uploadedDocumentNames: [
      "Engineering_Manual.pdf",
      "Product_Brochure.pdf",
    ],
    supportingDocuments: [
      {
        documentName: "Engineering_Manual.pdf",
        sourceType: "Technical Manual",
        citation:
          "Engineering_Manual.pdf — Auto-Schedule preference learning from setpoints",
        source: "Engineering manual — Auto-Schedule",
        confidence: 0.92,
        excerpt:
          "Auto-Schedule records historical setpoint adjustments and updates recommended schedules based on observed preference patterns.",
      },
      {
        documentName: "Product_Brochure.pdf",
        sourceType: "Marketing",
        citation: "Product_Brochure.pdf — Auto-Schedule marketing claim",
        source: "Marketing materials — Auto-Schedule",
        confidence: 0.7,
        excerpt:
          "Auto-Schedule learns your preferred temperatures over time.",
      },
    ],
    conversationHistory: [
      {
        role: "user",
        content:
          "Improve the reasoning for this claim element with stronger technical evidence.",
      },
    ],
    analystInstruction:
      "Improve the reasoning for CE-3 using the engineering documentation. Keep citations grounded in the provided documents.",
  },
};

async function main() {
  console.log("Calling generateSuggestion() with sample CE-3 request…\n");

  try {
    const { response, timings, rawChars } =
      await generateSuggestionWithTimings(sampleRequest);
    console.log("Success — AIResponse:\n");
    console.log(JSON.stringify(response, null, 2));
    console.log("\nTimings:", timings);
    console.log("Raw response chars:", rawChars);
  } catch (error) {
    if (error instanceof AIParseError) {
      console.error("AIParseError:", error.message);
      if (error.details) console.error("Details:", error.details);
      process.exitCode = 1;
      return;
    }
    if (error instanceof AIClientError) {
      console.error(`AIClientError [${error.code}]:`, error.message);
      process.exitCode = 1;
      return;
    }
    console.error("Unexpected error:", error);
    process.exitCode = 1;
  }
}

void main();
