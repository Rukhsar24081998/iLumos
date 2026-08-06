# Implementation Plan — Lumenci Claim Chart Refinement MVP

## Overview

This plan defines how to build a **functional prototype** of an AI-powered conversational workspace for refining patent claim charts. The goal is to demonstrate the human-in-the-loop refinement workflow described in the problem statement — not to ship a production-ready product.

The MVP should let a patent analyst:

1. Upload a claim chart and supporting documents
2. Review claim elements in a structured viewer
3. Request refinements via chat
4. Review AI suggestions with evidence
5. Accept, reject, or further refine those suggestions
6. Export the finalized chart to Microsoft Word

Each phase below is sized so it can be implemented independently in Cursor.

---

## Implementation Status

✅ **Phase 1 — Project Setup** (Completed)

✅ **Phase 2 — Initial Onboarding Experience** (Completed)

✅ **Phase 3 — Integrated AI Workspace** (Completed)

The current prototype already includes a functional implementation of several capabilities originally planned across the Claim Chart Viewer, Conversational AI Chat, AI Refinement Suggestions, and Human Review phases. These capabilities currently operate using structured mock data and simulated AI responses. The remaining phases focus on replacing the mock implementation with production-ready AI services, export functionality, and final production readiness.

---

## MVP Scope

| In Scope | Description |
| --- | --- |
| Document upload | Claim chart + supporting technical documents (PDF/DOCX/TXT) |
| Claim chart viewer | Structured view of claim elements, evidence, and reasoning |
| Conversational AI chat | Natural-language refinement requests scoped to selected elements |
| Evidence-backed suggestions | AI proposes changes with supporting evidence citations |
| Human review loop | Accept / Reject / Refine for every AI suggestion |
| Change visibility | Clear before/after view of what the AI proposes to change |
| Edge case handling | Wrong evidence, undo, and “no evidence found” states |
| Word export | Download the refined claim chart as a `.docx` file |
| Single-session prototype | Local or simple in-browser state; no multi-user persistence |

---

## Out of Scope

The following are explicitly **not** part of this MVP:

- User authentication or accounts
- Multi-user collaboration or shared workspaces
- Role-based access control
- Analytics dashboards or usage metrics
- Notification systems
- Backend microservices or complex infrastructure
- Patent database integrations or prior-art search
- Automated infringement scoring / legal conclusions
- Version history across sessions (beyond in-session undo)
- Mobile-native apps
- Real-time multiplayer editing
- Production-grade security, compliance, or audit logging

---

## Success Criteria

The prototype is successful if a reviewer can complete this demo flow end-to-end without leaving the app:

1. Upload a sample claim chart and at least one supporting document
2. Select a claim element and ask the AI to improve its reasoning or evidence
3. See a suggested change with cited evidence
4. Accept, reject, or refine that suggestion through continued conversation
5. Handle at least one edge case (wrong evidence, undo, or no evidence found)
6. Export the updated claim chart to Word

Qualitative goals:

- Analyst remains the final decision-maker for every change
- Context switching between chat, chart, and documents is minimized
- AI suggestions are transparent (what changed + why + evidence)

---

## Phase 1 — Project Setup ✅ Completed

### Goal

Establish a working application shell and foundational project structure so subsequent features can be built incrementally.

### Features

- Initialize the frontend app (recommended: React + TypeScript + Vite, or equivalent modern stack already preferred by the team)
- Basic routing / screen structure for Setup → Workspace → Export
- Shared layout (header, main content area)
- Placeholder state model for claim chart, documents, chat, and suggestions
- Styling foundation (CSS variables / design tokens; keep visual system simple and readable)
- Environment configuration for AI API key(s) via local `.env` (no auth layer)

### Deliverables

- Runnable local app (`npm run dev` or equivalent)
- Empty screens wired for: Onboarding/Setup, AI Workspace
- Core TypeScript types for:
  - Claim chart / claim elements
  - Supporting documents
  - Chat messages
  - AI suggestions (proposed change, evidence, status)
- README with setup instructions

---

## Phase 2 — Initial Onboarding Experience ✅ Completed

### Goal

Allow the analyst to start a refinement session by uploading the claim chart and supporting materials.

### Features

- Upload claim chart (DOCX/PDF/TXT; parse what is practical for MVP)
- Upload one or more supporting documents (product manuals, technical docs)
- Simple session naming or default title (e.g., “Claim Chart Refinement Session”)
- Validation: require at least a claim chart before continuing
- “Start refinement” CTA that navigates to the AI workspace
- Optional: preload a sample/demo dataset so the assignment can be demoed without real uploads

### Deliverables

- Setup screen UI
- Upload handling that stores files/content in app state (in-memory or local storage)
- Parsed or structured claim chart representation ready for the viewer
- Navigation into the workspace with loaded session data

**MVP note:** Perfect document parsing is not required. Prefer a reliable path for a known sample claim chart format, plus a fallback for plain text if full DOCX/PDF parsing is fragile.

---

## Phase 3 — Integrated AI Workspace ✅ Completed

### Goal

Provide a single integrated workspace where the claim chart, documents context, and chat live together — eliminating the multi-tool switching described in the problem statement.

### Features

- Three-region layout (adaptable for desktop demo):
  1. **Claim chart viewer** (primary)
  2. **Conversational chat** panel
  3. **Document / evidence context** panel or drawer (can be lightweight)
- Claim element selection that scopes subsequent AI actions
- Session header showing chart title and document count
- Empty states when no element is selected or no suggestions exist

### Deliverables

- Workspace shell with resizable or clearly separated panels
- Selected claim element state shared across viewer and chat
- Wireframe-complete interaction model (even if AI is stubbed initially)

**Status note:** Phase 3 is complete with a mock-driven prototype. The claim chart viewer, conversational chat, evidence-backed suggestion cards, and Accept / Reject / Refine Further review loop are implemented and demoable using structured mock data. Live model integration, edge-case depth, Word export, and final production polish remain in later phases.

### Capability area — Claim Chart Viewer (delivered in Phase 3)

#### Goal

Display the claim chart in a structured, reviewable format so analysts can inspect each element’s mapping, evidence, and reasoning.

#### Features

- List or table of claim elements (e.g., Claim 1(a), 1(b), …)
- For each element show:
  - Claim language / element text
  - Mapped product feature
  - Supporting evidence excerpt
  - Legal / technical reasoning
- Visual selection state for the active element
- Indicator when an element has a pending AI suggestion
- Indicator when an element was recently updated (accepted change)
- Read-only evidence snippets with source document reference when available

#### Deliverables

- Interactive claim chart viewer component
- Element detail view suitable for side-by-side comparison with AI suggestions
- Data binding from the session’s claim chart model

### Capability area — Conversational AI Chat (delivered in Phase 3 via mock responses)

#### Goal

Enable analysts to request targeted improvements through natural language, grounded in the selected claim element and uploaded documents.

#### Features

- Chat input and message history
- Context injection: selected claim element + relevant document excerpts
- Example prompts / starter suggestions (e.g., “Strengthen evidence for this element”, “Improve technical depth of reasoning”)
- Streaming or progressive response display if feasible; otherwise full response is acceptable for MVP
- Clear association between each AI reply and the claim element it targets
- Loading and error states for AI calls

#### Deliverables

- Working chat panel connected to an LLM API
- Prompt construction that includes claim element + document context
- Chat message model persisted in session state
- Ability to trigger a structured suggestion from a chat turn

**MVP note:** Use a single LLM provider. Prefer structured outputs (JSON) for suggestions rather than free-form text alone. *(Live provider wiring is Phase 4; Phase 3 uses simulated responses.)*

### Capability area — AI Refinement Suggestions (delivered in Phase 3 via mock data)

#### Goal

Turn conversational requests into evidence-backed, reviewable change proposals — not silent auto-edits.

#### Features

- AI returns a structured suggestion containing:
  - Target claim element ID
  - Fields to update (feature mapping, evidence, reasoning — as applicable)
  - Proposed new content
  - Evidence citations (document name + excerpt)
  - Brief rationale (“why this change”)
- Suggestion card / panel shown next to or overlaid on the selected element
- Before/after comparison for changed fields
- Suggestion status lifecycle: `pending` → `accepted` | `rejected` | `superseded`

#### Deliverables

- Suggestion data model and UI
- AI response parsing into structured suggestions
- Visual before/after diff for the analyst
- Hook into Human Review actions

### Capability area — Human Review / Accept · Reject · Refine (delivered in Phase 3)

#### Goal

Ensure the analyst remains the final decision-maker. No AI change is applied without explicit review.

#### Features

- **Accept:** Apply proposed fields to the claim chart; mark suggestion accepted; update viewer
- **Reject:** Discard suggestion; leave claim chart unchanged; optionally capture a short reason (optional for MVP)
- **Refine:** Keep suggestion context and continue the chat (“Make this more technical”, “Use a different section of the manual”)
- Disable Accept/Reject while a new refinement is in progress
- Update pending indicators on the claim chart after each action
- Append a lightweight activity note in chat (e.g., “Accepted evidence update for Claim 1(b)”)

#### Deliverables

- Accept / Reject / Refine controls on every pending suggestion
- Claim chart mutation only on Accept
- Chat continuation path for Refine that references the current proposal
- Session state that reflects applied vs discarded changes

---

## Phase 4 — Live AI Integration

### Goal

Replace mock AI behavior with a live model integration while preserving the existing workspace UI and human-in-the-loop interaction model.

### Focus

- Replace mock AI responses with Gemini
- Structured JSON responses for suggestions
- Prompt orchestration grounded in selected claim element and supporting documents
- Evidence-grounded responses (cite uploaded / available sources only)
- Loading and error handling for live AI calls
- Maintain the existing UI and interaction model (chat, suggestion cards, Accept / Reject / Refine)

### Deliverables

- Live AI path wired into the existing chat and suggestion flow
- Structured suggestion parsing aligned to the current suggestion model
- User-visible loading and failure states without changing the Phase 3 UX shell
- Mock fixtures retained as fallback or demo seed where useful

---

## Phase 5 — Edge Case Handling ✅

### Goal

Demonstrate trust and control when the AI is wrong, uncertain, or when the analyst needs to reverse a decision.

### Focus

- Wrong evidence (reject and refine with corrective guidance)
- No evidence found (explicit uncertain / empty state; no fabricated citations)
- Request reliability (duplicate prevention, stale response guards, typing cleanup)
- Friendly error recovery (timeout, network, parse, missing key) without crashing
- Hallucination guardrails (cite only from provided documents)
- Retry workflow after failed or unusable suggestions (one automatic retry + mock fallback)

### Features

#### Wrong evidence

- Analyst can reject a suggestion because evidence is incorrect
- Analyst can refine with guidance: “This evidence is wrong; use the section about [X] instead”
- UI should make it obvious that rejected content was not applied

#### Request & session reliability

- Duplicate Send / Accept / Reject / Refine clicks ignored while busy
- Stale async generations discarded via per-thread generation tokens
- Typing / busy state always clears on success or failure
- New Session marks a full workspace state reset

#### AI cannot find evidence

- Explicit empty/uncertain state when supporting evidence is not found in uploaded docs
- AI communicates uncertainty clearly (no fabricated citations)
- Empty prompt / missing claim handled with system messages (no exceptions)

### Deliverables

- Reject + refine path for incorrect evidence ✅
- Friendly system messages for recoverable AI failures ✅
- “No evidence found” handling via structured AI + sanitized UI ✅
- Guardrails in prompting to reduce hallucinated citations ✅
- One automatic retry for transient live AI failures, then mock fallback ✅

---

## Phase 6 — Export to Word

### Goal

Produce a Microsoft Word claim chart that reflects only accepted refinements.

### Focus

- Generate `.docx` from the current accepted claim chart state
- Export accepted refinements only
- Preserve a clean table-oriented layout suitable for demo
- Download experience from workspace header/actions

### Features

- Export current claim chart state to `.docx`
- Include claim elements, mapped features, evidence, and reasoning
- Preserve a clean, readable table-oriented layout suitable for demo
- Filename based on session title + date
- Export available from workspace header/actions

### Deliverables

- Word generation utility (e.g., `docx` library or equivalent)
- Export button and download flow
- Exported file matches the on-screen accepted content

---

## Phase 7 — Final UI Polish & Production Readiness

### Goal

Make the prototype feel coherent, reliable, and demoable: clear hierarchy, readable typography, intentional interaction feedback, and production-ready basics — without overbuilding a design system.

### Focus

- Accessibility (focus states, labels, contrast, keyboard paths)
- Performance (avoid unnecessary re-renders; keep demo interactions snappy)
- Responsive verification (desktop-first; no clipping on common laptop sizes)
- Error handling for user-visible failure paths
- Code cleanup (dead code, unused imports, consistency)
- Build verification (`npm run build`, lint, typecheck)

### Features

- Consistent spacing, typography, and color variables
- Clear visual hierarchy: selected element, pending suggestion, accepted update
- Loading skeletons or spinners for AI waits
- Responsive enough for laptop demo (desktop-first is fine)
- Accessible basics: focus states, button labels, contrast
- Micro-interactions for selection, accept/reject, and suggestion appearance (2–3 intentional motions max)

### Deliverables

- Polished workspace suitable for a live walkthrough
- Visual states documented by usage in the UI (pending / accepted / rejected / no evidence)
- No placeholder “Lorem” content in primary demo path
- Clean build with no blocking lint/type errors

---

## Phase 8 — Demo Readiness

### Goal

Prepare a reliable end-to-end demonstration of the refinement workflow for the Lumenci Product Manager assignment.

### Focus

- Seeded demo data
- Demo checklist / scripted walkthrough
- README updates (“How to run the demo”)
- Screenshots for submission or walkthrough support
- Known limitations listed briefly
- Stable end-to-end walkthrough covering happy path + at least one edge case

### Features

- Seeded sample claim chart + supporting document(s)
- Scripted demo path covering:
  1. Setup / upload (or load sample)
  2. Select a weak claim element
  3. Ask AI to improve evidence/reasoning
  4. Review suggestion (before/after + citation)
  5. Refine once via chat
  6. Accept final suggestion
  7. Trigger one edge case (wrong evidence or no evidence)
  8. Undo an accepted change
  9. Export to Word
- Error handling for missing API key / failed AI calls with user-visible messages
- Short demo script or checklist in `/docs` (optional companion note)

### Deliverables

- Stable happy-path demo with sample data
- Edge-case demo moments that show human control
- README section: “How to run the demo”
- Known limitations listed briefly (parsing constraints, single-session state, etc.)

---

## Suggested Implementation Order

| Order | Phase | Rationale |
| --- | --- | --- |
| 1 | Project Setup ✅ | Foundation |
| 2 | Initial Onboarding Experience ✅ | Session input |
| 3 | Integrated AI Workspace ✅ | Mock-complete review loop (chart + chat + suggestions + accept/reject/refine) |
| 4 | Live AI Integration ✅ | Replace mock responses with Gemini + structured outputs |
| 5 | Edge Case Handling ✅ | Trust, reliability, and uncertainty |
| 6 | Export to Word | Final output |
| 7 | Final UI Polish & Production Readiness | Presentation quality and build health |
| 8 | Demo Readiness | Assignment delivery |

Phases 1–3 establish the product shell and mock human-in-the-loop workflow. Phase 4 is the product core for live AI. Later phases make the story complete, credible, and demo-ready.

---

## Technical Guidance (MVP-level)

Keep architecture intentionally simple:

- **Frontend-centric prototype** with direct LLM API calls from the client *or* a thin local API route solely to keep keys off the browser — choose the simplest secure-enough option for a local demo
- **In-memory / local session state** for claim chart, chat, suggestions, and undo stack
- **Structured AI outputs** for suggestions to power Accept/Reject reliably
- **Sample fixtures** for claim chart + documents to guarantee a repeatable demo
- **No database** unless a trivial local persistence layer is needed for refresh resilience during demos

---

## Alignment to Problem Statement

| Problem pain point | MVP response |
| --- | --- |
| Weak / incomplete AI reasoning | Chat-driven refinement of reasoning fields |
| Shallow evidence | Evidence-backed suggestions with citations from uploaded docs |
| Missing product features | Analyst can ask AI to identify/update feature mapping |
| Constant tool switching | Single workspace: chart + chat + documents |
| No structured review workflow | Pending suggestions with Accept / Reject / Refine |
| Limited visibility into changes | Before/after comparison + chat activity notes |
| Legal need for human validation | No silent auto-apply; analyst decides every change |
| Manual Word updates | Export finalized chart to `.docx` |

---

## Definition of Done (Prototype)

The MVP is done when:

- A reviewer can run the app locally with sample data
- The full refinement loop works for at least one claim element
- Edge cases for wrong evidence, undo, and no-evidence are demonstrable
- Export produces a Word document reflecting accepted edits
- The experience clearly shows AI as assistant and analyst as decision-maker
