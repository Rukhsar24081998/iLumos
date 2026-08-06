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
      { useMock: true, error: "AI mode is set to mock." },
      { status: 503 }
    );
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json(
      { useMock: true, error: "GEMINI_API_KEY is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!isAIRequest(body)) {
    return NextResponse.json(
      { error: "Invalid AI request payload." },
      { status: 400 }
    );
  }

  try {
    const suggestion = await requestRefinementSuggestion(body);
    return NextResponse.json({ suggestion, source: "live" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[iLumos:ai] /api/ai/refine failed", error);
    }

    if (error instanceof AIParseError) {
      return NextResponse.json(
        { useMock: true, error: "AI response could not be parsed." },
        { status: 502 }
      );
    }

    if (error instanceof AIClientError) {
      return NextResponse.json(
        { useMock: true, error: error.message, code: error.code },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { useMock: true, error: "AI request failed." },
      { status: 502 }
    );
  }
}
