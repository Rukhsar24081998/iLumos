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

## Phase 1 — Project Setup

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

## Phase 2 — Initial Onboarding / Setup Screen

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

## Phase 3 — AI Workspace

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

---

## Phase 4 — Claim Chart Viewer

### Goal

Display the claim chart in a structured, reviewable format so analysts can inspect each element’s mapping, evidence, and reasoning.

### Features

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

### Deliverables

- Interactive claim chart viewer component
- Element detail view suitable for side-by-side comparison with AI suggestions
- Data binding from the session’s claim chart model

---

## Phase 5 — Conversational AI Chat

### Goal

Enable analysts to request targeted improvements through natural language, grounded in the selected claim element and uploaded documents.

### Features

- Chat input and message history
- Context injection: selected claim element + relevant document excerpts
- Example prompts / starter suggestions (e.g., “Strengthen evidence for this element”, “Improve technical depth of reasoning”)
- Streaming or progressive response display if feasible; otherwise full response is acceptable for MVP
- Clear association between each AI reply and the claim element it targets
- Loading and error states for AI calls

### Deliverables

- Working chat panel connected to an LLM API
- Prompt construction that includes claim element + document context
- Chat message model persisted in session state
- Ability to trigger a structured suggestion (Phase 6) from a chat turn

**MVP note:** Use a single LLM provider. Prefer structured outputs (JSON) for suggestions rather than free-form text alone.

---

## Phase 6 — AI Refinement Suggestions

### Goal

Turn conversational requests into evidence-backed, reviewable change proposals — not silent auto-edits.

### Features

- AI returns a structured suggestion containing:
  - Target claim element ID
  - Fields to update (feature mapping, evidence, reasoning — as applicable)
  - Proposed new content
  - Evidence citations (document name + excerpt)
  - Brief rationale (“why this change”)
- Suggestion card / panel shown next to or overlaid on the selected element
- Before/after comparison for changed fields
- Suggestion status lifecycle: `pending` → `accepted` | `rejected` | `superseded`

### Deliverables

- Suggestion data model and UI
- AI response parsing into structured suggestions
- Visual before/after diff for the analyst
- Hook into Human Review actions (Phase 7)

---

## Phase 7 — Human Review (Accept / Reject / Refine)

### Goal

Ensure the analyst remains the final decision-maker. No AI change is applied without explicit review.

### Features

- **Accept:** Apply proposed fields to the claim chart; mark suggestion accepted; update viewer
- **Reject:** Discard suggestion; leave claim chart unchanged; optionally capture a short reason (optional for MVP)
- **Refine:** Keep suggestion context and continue the chat (“Make this more technical”, “Use a different section of the manual”)
- Disable Accept/Reject while a new refinement is in progress
- Update pending indicators on the claim chart after each action
- Append a lightweight activity note in chat (e.g., “Accepted evidence update for Claim 1(b)”)

### Deliverables

- Accept / Reject / Refine controls on every pending suggestion
- Claim chart mutation only on Accept
- Chat continuation path for Refine that references the current proposal
- Session state that reflects applied vs discarded changes

---

## Phase 8 — Edge Case Handling

### Goal

Demonstrate trust and control when the AI is wrong, uncertain, or when the analyst needs to reverse a decision.

### Features

#### 8a — Wrong evidence

- Analyst can reject a suggestion because evidence is incorrect
- Analyst can refine with guidance: “This evidence is wrong; use the section about [X] instead”
- UI should make it obvious that rejected content was not applied

#### 8b — Undo previous refinement

- In-session undo for the last accepted change (minimum)
- Restore previous element field values
- Chat/system note that undo occurred
- Optional: simple undo stack for multiple accepts within the session

#### 8c — AI cannot find evidence

- Explicit empty/uncertain state when supporting evidence is not found in uploaded docs
- AI communicates uncertainty clearly (no fabricated citations)
- Offer next steps: upload another document, broaden the request, or manually edit (manual edit can be minimal/out of primary path)
- Suggestion UI variant: “No evidence found” instead of a fake proposal

### Deliverables

- Reject + refine path for incorrect evidence
- Undo control for last accepted change (or undo stack)
- “No evidence found” suggestion/empty state with clear messaging
- Guardrails in prompting to reduce hallucinated citations (cite only from provided documents)

---

## Phase 9 — Export to Word

### Goal

Produce a Microsoft Word claim chart that reflects only accepted refinements.

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

## Phase 10 — UI Polish

### Goal

Make the prototype feel coherent and demoable: clear hierarchy, readable typography, and intentional interaction feedback — without overbuilding a design system.

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

---

## Phase 11 — Demo Readiness

### Goal

Prepare a reliable end-to-end demonstration of the refinement workflow for the Lumenci Product Manager assignment.

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
| 1 | Project setup | Foundation |
| 2 | Onboarding/setup | Session input |
| 3 | AI workspace shell | Integration surface |
| 4 | Claim chart viewer | Core review UI |
| 5 | Conversational AI chat | Analyst interaction |
| 6 | AI refinement suggestions | Structured proposals |
| 7 | Human review loop | Decision-making |
| 8 | Edge cases | Trust & control |
| 9 | Export to Word | Final output |
| 10 | UI polish | Presentation quality |
| 11 | Demo readiness | Assignment delivery |

Phases 5–7 are the product core (conversational refinement with human approval). Earlier phases enable them; later phases make the story complete and credible.

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
