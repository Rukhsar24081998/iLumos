# Architecture — iLumos

Technical overview of the claim-chart refinement prototype. Product behavior is defined in the PRD and implementation plan; this document describes **how the code is structured**.

---

## 1. UI

### Screens

| Route | Component | Role |
| --- | --- | --- |
| `/` | `SetupForm` + setup components | Onboarding, Quick Start, Start Analysis |
| `/workspace` | `WorkspaceApp` | Interactive three-panel refinement |

### Shell

- `AppShell` — sticky header, main landmark, skip link, `WorkspaceExportProvider`
- `Header` — brand, **Export DOCX**, **New Session** (workspace only)

### Workspace panels

```
WorkspaceApp
├─ Matter bar (title, counts)
├─ ClaimChartPanel     # selectable claim rows + status badges
├─ ChatPanel           # conversation, chips, composer, suggestion cards
│   └─ SuggestionCard  # Accept / Reject / Refine Further
└─ EvidencePanel       # snippets, citations, confidence
```

Visual language: Lumenci-inspired orange accent, card panels, desktop-first three-column grid (`md+`), stacked scroll on smaller viewports.

---

## 2. Workspace state

Owned by `WorkspaceApp` (React state + refs):

| State | Purpose |
| --- | --- |
| `elements` | Current claim chart rows |
| `messagesByClaim` | Per-claim chat threads |
| `selectedId` | Focused claim |
| `activeSuggestionId` | Highlighted suggestion / evidence sources |
| `typingThreadId` | In-flight AI request (busy lock) |
| `generationByThreadRef` | Ignore stale async results |
| `actionLockRef` | Prevent duplicate Accept / Reject / Refine |

**New Session** sets a `sessionStorage` flag (`lib/workspaceReset.ts`); remounting `/workspace` resets to initial mock data.

Export registers a read-only snapshot getter via `WorkspaceExportContext` — no duplicate chart store.

---

## 3. AI layer

```
lib/ai/
  buildRequest.ts    # AIRequest from claim + evidence + turns
  prompt.ts          # Prompt assembly (server/client shared text)
  schema.ts          # Expected JSON shape
  gemini.ts          # generateSuggestion() — server/script
  parser.ts          # normalize / parse / validate
  mapper.ts          # AIResponse → SuggestionPayload / ChatMessage
  workspaceBridge.ts # Client: mode, fetch API, mock fallback, retry
  userFacingErrors.ts# Friendly chat/header messages
  service.ts         # Higher-level request helpers
  errors.ts          # Typed AI errors
  logger.ts          # Debug/warn gated by env
```

Public barrel: `lib/ai/index.ts`.

---

## 4. Gemini flow

1. User sends a prompt or chip / Refine Further.
2. `resolveAssistantMessage` (client) checks `NEXT_PUBLIC_AI_MODE`.
3. If not forced mock, `POST /api/ai/refine` with serialized request context.
4. Route loads `GEMINI_API_KEY`, calls `generateSuggestion`.
5. Model returns structured JSON → `parseSuggestionResponse` → `mapAIResponseToSuggestion`.
6. Bridge returns an assistant `ChatMessage` with `suggestion`.
7. One live retry on retryable failures, then mock fallback (`auto` / soft `live` failure).

**Security:** API key is server-only; the browser never receives it.

---

## 5. Mock flow

1. Mode is `mock`, or live path fails / is skipped.
2. Bridge selects a scenario-aligned `SuggestionPayload` from `data/mockWorkspace.ts`.
3. Same UI path as live: suggestion card, Accept / Reject / Refine.

Enables demos without network or quota.

---

## 6. Parser

`lib/ai/parser.ts`:

- Strip fences / noise from model text
- Parse JSON
- Validate required fields (reasoning, evidence, confidence bounds, etc.)
- Normalize confidence and string fields

Invalid payloads surface as typed parse errors → user-facing system messages (no stack traces in UI).

---

## 7. Mapper

`lib/ai/mapper.ts`:

- Maps validated `AIResponse` → existing `SuggestionPayload`
- Preserves claim id, version, original vs suggested reasoning, citations, sources
- Builds assistant message content for the chat timeline

Keeps Phase 3 UI contracts stable while swapping live vs mock generation.

---

## 8. Export pipeline

```
WorkspaceApp state
  → buildExportSnapshot()        # client — statuses, reasoning, evidence
  → POST /api/export/docx        # server — docx package (kept off the client bundle)
  → downloadBlob()               # ClaimChart_<patentId>.docx
```

Files: `lib/export/*`, `app/api/export/docx/route.ts`, triggered from Header via `WorkspaceExportContext`.

`docx` runs **server-side only**. Importing it into the client (Turbopack) previously produced an illegal `super` syntax error that broke page modules.

Does not call Gemini and does not mutate workspace state on failure.

---

## 9. API routes

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/ai/refine` | Server-side Gemini refine; returns mapped suggestion or error payload |

No other backend services. No database.

---

## 10. Component hierarchy

```
RootLayout
└─ AppShell
   ├─ Header
   │   └─ useWorkspaceExport()
   └─ main
      ├─ / → SetupHero, SetupForm, WorkflowPreview, …
      └─ /workspace → WorkspaceApp
           ├─ ClaimChartPanel
           ├─ ChatPanel → SuggestionCard
           └─ EvidencePanel
```

---

## 11. Data & types

- `types/workspace.ts` — `ClaimElement`, `ChatMessage`, `SuggestionPayload`, evidence types
- `data/mockWorkspace.ts` — matter metadata, initial claims, evidence items, scenario suggestions

---

## 12. Configuration

| Env | Where used |
| --- | --- |
| `GEMINI_API_KEY` | API route + `test:gemini` |
| `GEMINI_MODEL` | Gemini client |
| `NEXT_PUBLIC_AI_MODE` | Client bridge |
| `AI_DEBUG` | Logger verbosity |

See `.env.example` and the root README.
