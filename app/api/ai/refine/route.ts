/**
 * Server API: claim-chart refinement via Gemini (streamed NDJSON).
 * Keeps API keys off the client. Falls back signal when mock should be used.
 */

import {
  AIClientError,
  AIParseError,
  requestRefinementSuggestionWithTimings,
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

function ndjsonLine(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(payload)}\n`);
}

export async function POST(request: Request) {
  if (process.env.AI_MODE === "mock" || process.env.NEXT_PUBLIC_AI_MODE === "mock") {
    return Response.json(
      { useMock: true, error: "AI mode is set to mock.", code: "PROVIDER" },
      { status: 503 }
    );
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return Response.json(
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
    return Response.json(
      { error: "Invalid JSON body.", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  if (!isAIRequest(body)) {
    return Response.json(
      { error: "Invalid AI request payload.", code: "PROVIDER" },
      { status: 400 }
    );
  }

  const instruction = body.context.analystInstruction?.trim() ?? "";
  if (!instruction) {
    return Response.json(
      { error: "Refinement instruction is empty.", code: "PROVIDER" },
      { status: 400 }
    );
  }

  if (!body.context.claimElementId?.trim()) {
    return Response.json(
      { error: "Claim element id is required.", code: "PROVIDER" },
      { status: 400 }
    );
  }

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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(ndjsonLine(payload));
      };

      try {
        send({ type: "status", phase: "generating" });

        const result = await requestRefinementSuggestionWithTimings(
          normalized,
          {
            onProgress: ({ chars }) => {
              send({ type: "chunk", chars });
            },
          }
        );

        send({
          type: "done",
          suggestion: result.response,
          source: "live",
          timings: result.timings,
        });
        controller.close();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[iLumos:ai] /api/ai/refine failed", error);
        }

        if (error instanceof AIParseError) {
          send({
            type: "error",
            useMock: true,
            error: "AI response could not be parsed.",
            code: "PARSE_VALIDATION",
          });
          controller.close();
          return;
        }

        if (error instanceof AIClientError) {
          send({
            type: "error",
            useMock: true,
            error: error.message,
            code: error.code,
            retryable: error.retryable,
          });
          controller.close();
          return;
        }

        send({
          type: "error",
          useMock: true,
          error: "AI request failed.",
          code: "PROVIDER",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
