/**
 * Structured AI layer errors.
 * Safe messages for callers; details stay in debug logs only.
 */

export type AIErrorCode =
  | "MISSING_API_KEY"
  | "NETWORK"
  | "TIMEOUT"
  | "EMPTY_RESPONSE"
  | "INVALID_JSON"
  | "PARSE_VALIDATION"
  | "SAFETY_BLOCKED"
  | "PROVIDER"
  | "UNKNOWN";

export class AIClientError extends Error {
  readonly code: AIErrorCode;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(
    code: AIErrorCode,
    message: string,
    options?: { retryable?: boolean; cause?: unknown }
  ) {
    super(message);
    this.name = "AIClientError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;
  }
}

export class AIParseError extends Error {
  readonly code: AIErrorCode = "PARSE_VALIDATION";
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "AIParseError";
    this.details = details;
  }
}

export function isAIClientError(error: unknown): error is AIClientError {
  return error instanceof AIClientError;
}

export function isAIParseError(error: unknown): error is AIParseError {
  return error instanceof AIParseError;
}
