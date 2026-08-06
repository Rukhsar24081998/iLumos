/**
 * Server API: claim-chart refinement via Gemini.
 * Keeps API keys off the client. Falls back signal when mock should be used.
 */

import { NextResponse } from "next/server";

import {
  AIClientError,
  AIParseError,
  requestRefinementSuggestion,
  type AIRequest,
} from "@/lib/ai";

export const runtime = "nodejs";

function isAIRequest(value: unknown): value is AIRequest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const context = record.context;
  if (!context || typeof context !== "object") return false;
  const ctx = context as Record<string, unknown>;
  return (
    typeof ctx.claimElementId === "string" &&
    typeof ctx.analystInstruction === "string" &&
    typeof ctx.patentClaimElement === "string"
  );
}

export async function POST(request: Request) {
  if (process.env.AI_MODE === "mock" || process.env.NEXT_PUBLIC_AI_MODE === "mock") {
    return NextResponse.json(
      { useMock: true, error: "AI mode is set to mock.", code: "PROVIDER" },
      { status: 503 }
    );
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json(
      {
        useMock: true,
        error: "GEMINI_API_KEY is not configured.",
        code: "MISSING_API_KEY",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  if (!isAIRequest(body)) {
    return NextResponse.json(
      { error: "Invalid AI request payload.", code: "PROVIDER" },
      { status: 400 }
    );
  }

  const instruction = body.context.analystInstruction?.trim() ?? "";
  if (!instruction) {
    return NextResponse.json(
      { error: "Refinement instruction is empty.", code: "PROVIDER" },
      { status: 400 }
    );
  }

  if (!body.context.claimElementId?.trim()) {
    return NextResponse.json(
      { error: "Claim element id is required.", code: "PROVIDER" },
      { status: 400 }
    );
  }

  // Normalize empty optional collections so Gemini prompting stays stable.
  const normalized: AIRequest = {
    ...body,
    context: {
      ...body.context,
      analystInstruction: instruction,
      supportingDocuments: Array.isArray(body.context.supportingDocuments)
        ? body.context.supportingDocuments
        : [],
      uploadedDocumentNames: Array.isArray(body.context.uploadedDocumentNames)
        ? body.context.uploadedDocumentNames
        : [],
      conversationHistory: Array.isArray(body.context.conversationHistory)
        ? body.context.conversationHistory
        : [],
    },
  };

  try {
    const suggestion = await requestRefinementSuggestion(normalized);
    return NextResponse.json({ suggestion, source: "live" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[iLumos:ai] /api/ai/refine failed", error);
    }

    if (error instanceof AIParseError) {
      return NextResponse.json(
        {
          useMock: true,
          error: "AI response could not be parsed.",
          code: "PARSE_VALIDATION",
        },
        { status: 502 }
      );
    }

    if (error instanceof AIClientError) {
      return NextResponse.json(
        {
          useMock: true,
          error: error.message,
          code: error.code,
          retryable: error.retryable,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { useMock: true, error: "AI request failed.", code: "PROVIDER" },
      { status: 502 }
    );
  }
}
