/**
 * Friendly, user-visible messages for AI / workspace edge cases.
 * Keep internal error codes out of the chat UI.
 */

export type WorkspaceFailureKind =
  | "timeout"
  | "network"
  | "invalid_json"
  | "missing_api_key"
  | "empty_response"
  | "provider"
  | "parse"
  | "empty_prompt"
  | "missing_claim"
  | "no_documents"
  | "unknown";

const MESSAGES: Record<WorkspaceFailureKind, string> = {
  timeout:
    "The AI request timed out. Your conversation is unchanged — try again in a moment.",
  network:
    "A network issue interrupted the AI request. Your conversation is unchanged — please retry.",
  invalid_json:
    "The AI returned an unexpected response format. Your conversation is unchanged — please retry.",
  missing_api_key:
    "Live AI is unavailable (API key not configured). Your conversation is unchanged — check configuration or continue in mock mode.",
  empty_response:
    "The AI returned an empty response. Your conversation is unchanged — please retry.",
  provider:
    "The AI service is temporarily unavailable. Your conversation is unchanged — please retry in a moment.",
  parse:
    "The AI response could not be validated. Your conversation is unchanged — please retry.",
  empty_prompt:
    "Please enter a refinement request or choose a suggested action before sending.",
  missing_claim:
    "No claim element is selected. Select a claim element from the chart, then try again.",
  no_documents:
    "No supporting documents are available for this claim element. Upload or select evidence, then retry.",
  unknown:
    "Something went wrong while generating a suggestion. Your conversation is unchanged — please retry.",
};

export function userFacingMessage(kind: WorkspaceFailureKind): string {
  return MESSAGES[kind];
}

export function classifyWorkspaceError(error: unknown): WorkspaceFailureKind {
  if (!error) return "unknown";

  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code.toUpperCase()
      : "";

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  if (code === "TIMEOUT" || message.includes("timed out") || message.includes("timeout")) {
    return "timeout";
  }
  if (
    code === "MISSING_API_KEY" ||
    message.includes("api key") ||
    message.includes("not configured")
  ) {
    return "missing_api_key";
  }
  if (code === "EMPTY_RESPONSE" || message.includes("empty response")) {
    return "empty_response";
  }
  if (
    code === "INVALID_JSON" ||
    code === "PARSE_VALIDATION" ||
    message.includes("not valid json") ||
    message.includes("could not be parsed") ||
    message.includes("invalid ai payload")
  ) {
    return message.includes("json") && !message.includes("payload")
      ? "invalid_json"
      : "parse";
  }
  if (
    code === "NETWORK" ||
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch")
  ) {
    return "network";
  }
  if (code === "PROVIDER" || code === "SAFETY_BLOCKED") {
    return "provider";
  }

  return "unknown";
}

export function isRetryableWorkspaceError(error: unknown): boolean {
  const kind = classifyWorkspaceError(error);
  if (kind === "timeout" || kind === "network" || kind === "provider") {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "retryable" in error &&
    (error as { retryable?: boolean }).retryable
  ) {
    return true;
  }
  return false;
}
