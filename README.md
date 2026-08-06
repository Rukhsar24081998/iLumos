# iLumos — AI-Powered Patent Claim Chart Refinement

**iLumos** is a functional prototype of a conversational workspace for refining patent claim charts with a human-in-the-loop review workflow.

Built for the Lumenci Product Manager assignment.

Analysts can load a sample matter, ask an AI assistant to strengthen reasoning or evidence, accept or reject suggestions, refine further through chat, and export the finalized chart to Microsoft Word — without switching between disconnected tools.

---

## Problem statement

Patent claim charts map each claim element to accused-product features with supporting evidence and legal reasoning. AI drafts help, but they are rarely courtroom-ready. Today, analysts bounce between Word, PDFs, and chat tools, lose context, and lack a structured Accept / Reject / Refine loop.

iLumos keeps the **claim chart**, **AI conversation**, and **supporting evidence** in one workspace so the analyst remains the final decision-maker on every change.

See [`docs/01_ProblemStatement.md`](docs/01_ProblemStatement.md) for the full product problem statement.

---

## Features

- **Setup / Quick Start** — load the sample claim chart and supporting documents
- **Three-panel workspace** — Claim Chart · AI Analysis · Supporting Evidence
- **Suggested actions** — Strengthen Evidence, Improve Reasoning, Add Missing Feature, and related prompts
- **Custom prompts** — free-form refinement requests scoped to the selected claim
- **Human review** — Accept, Reject, or Refine Further on every AI suggestion
- **Live Gemini AI** — structured JSON suggestions via Google Gemini (server-side)
- **Mock fallback** — demo-safe suggestions when Gemini is unavailable or mode is `mock`
- **Export DOCX** — download the current reviewed chart as `ClaimChart_US123456.docx`
- **New Session** — reset workspace state for a clean demo run
- **Accessibility basics** — keyboard focus, skip link, labeled controls, friendly errors

---

## Architecture (high level)

```
Browser (React workspace)
  ├─ ClaimChartPanel / ChatPanel / EvidencePanel
  ├─ WorkspaceApp (session state: claims, messages, selection)
  └─ workspaceBridge → POST /api/ai/refine  OR  mock suggestions
                           │
                           ▼
                     Gemini (server-only)
                           │
                     parse → map → SuggestionPayload
                           │
                     Accept updates claim chart
                           │
                     Export DOCX (client, docx package)
```

Full detail: [`docs/07_Architecture.md`](docs/07_Architecture.md).

---

## Technology stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Lucide |
| AI | `@google/generative-ai` (Gemini) |
| Export | `docx` |
| Tooling | ESLint, tsx scripts |

---

## Gemini integration

1. The workspace builds an `AIRequest` from the selected claim, evidence, and recent chat turns.
2. The browser calls **`POST /api/ai/refine`** (API key never ships to the client).
3. The route invokes Gemini with a structured JSON schema / prompt.
4. The response is **parsed**, **validated**, and **mapped** into the existing `SuggestionPayload` UI model.
5. On success, a suggestion card appears in chat with Accept / Reject / Refine Further.

Configuration:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server/script-only Gemini API key |
| `GEMINI_MODEL` | Model id (default in `.env.example`: `gemini-3.6-flash`) |

---

## Mock fallback

| `NEXT_PUBLIC_AI_MODE` | Behavior |
| --- | --- |
| `auto` (default) | Try live Gemini; on failure, fall back to mock |
| `mock` | Always use mock suggestions (no key required) |
| `live` | Prefer Gemini; still falls back to mock if the request fails |

Mock mode is ideal for demos without network or API quota. Live/auto modes use the same UI and Accept / Reject / Refine flow.

---

## Export DOCX

- Header control: **Export DOCX**
- Captures the **current** workspace state (accepted / pending / rejected / needs review)
- Includes claim text, reasoning, confidence, evidence, latest accepted refinement only, and a summary
- Filename example: `ClaimChart_US123456.docx`
- Failures show a friendly error; AI state is not modified

---

## Folder structure

```
app/
  page.tsx                 # Setup / onboarding
  workspace/page.tsx       # AI workspace
  api/ai/refine/route.ts   # Gemini proxy (server-only)
components/
  layout/                  # Header, AppShell
  setup/                   # Onboarding UI
  workspace/               # Panels, suggestion cards, export context
  ui/                      # shadcn primitives
data/
  mockWorkspace.ts         # Sample matter + mock suggestions
docs/                      # Product & engineering docs
lib/
  ai/                      # Prompt, Gemini, parse, map, bridge, errors
  export/                  # Snapshot + DOCX generation
scripts/                   # test:gemini, test:docx
types/                     # Domain TypeScript types
```

---

## Installation

```bash
git clone <your-repo-url>
cd iLumos
npm install
cp .env.example .env.local
```

Edit `.env.local` and set `GEMINI_API_KEY` if you want live AI. Leave it empty and/or set `NEXT_PUBLIC_AI_MODE=mock` for a key-free demo.

---

## Environment variables

Copy placeholders only — never commit real keys:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | For live AI | Google AI Studio / Gemini API key |
| `GEMINI_MODEL` | No | Model override (see `.env.example`) |
| `NEXT_PUBLIC_AI_MODE` | No | `auto` \| `mock` \| `live` |
| `AI_DEBUG` | No | `true` to force AI debug logs |

`.env`, `.env.local`, and `.env*.local` are gitignored. Only `.env.example` is committed.

---

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. On Setup, use **Quick Start** (or upload) to load the sample claim chart
2. Click **Start Analysis** → workspace
3. Select a claim element (e.g. CE-3)
4. Use a suggested action or type a custom prompt
5. Review the suggestion → **Refine Further** / **Accept** / **Reject**
6. Click **Export DOCX**

Production-style local run:

```bash
npm run build
npm start
```

---

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test:gemini` | Smoke-test Gemini `generateSuggestion` (needs key) |
| `npm run test:docx` | Validate DOCX export snapshot + ZIP signature |

---

## How to run the demo

See the step-by-step walkthrough in [`docs/08_DemoChecklist.md`](docs/08_DemoChecklist.md).

**Happy path (≈5 minutes):**

1. `NEXT_PUBLIC_AI_MODE=auto` (or `mock`) + `npm run dev`
2. Quick Start → Start Analysis
3. Select CE-3 → Strengthen Evidence or Improve Reasoning
4. View Details → Refine Further once
5. Accept → claim chart updates
6. Export DOCX → open in Microsoft Word

**Edge case:** Reject a suggestion and confirm the chart reasoning is unchanged; or run with `mock` / no key to show resilient fallback messaging.

---

## Example screenshots

Place demo captures in [`docs/screenshots/`](docs/screenshots/) (optional for submission):

| Suggested file | Capture |
| --- | --- |
| `01-setup.png` | Setup / Quick Start |
| `02-workspace.png` | Three-panel workspace |
| `03-suggestion.png` | Pending AI suggestion card |
| `04-accepted.png` | Accepted update on claim chart |
| `05-export.png` | Exported Word document |

Until images are added, use the live app at `/` and `/workspace` for review.

---

## Documentation index

| Doc | Contents |
| --- | --- |
| [`docs/01_ProblemStatement.md`](docs/01_ProblemStatement.md) | Product problem |
| [`docs/02_ImplementationPlan.md`](docs/02_ImplementationPlan.md) | Phased delivery (1–8 ✅) |
| [`docs/03_UserFlow.md`](docs/03_UserFlow.md) | User flows |
| [`docs/04_MockData.md`](docs/04_MockData.md) | Sample matter |
| [`docs/05_UI_UX_Design.md`](docs/05_UI_UX_Design.md) | UI/UX notes |
| [`docs/06_PRD.md`](docs/06_PRD.md) | PRD |
| [`docs/07_Architecture.md`](docs/07_Architecture.md) | Technical architecture |
| [`docs/08_DemoChecklist.md`](docs/08_DemoChecklist.md) | Demo & QA checklist |

---

## Future improvements

- Persist sessions (refresh-safe state) and multi-document upload parsing
- True undo of accepted chart edits and richer version history
- Citation deep-links into PDF page/paragraph anchors
- Stronger evaluation harness for suggestion quality
- Auth, multi-user collaboration, and audit logging (out of MVP scope)
- Hosted deployment (e.g. Vercel) with server-only secrets

---

## Known limitations

- Single in-browser session (no database); **New Session** resets workspace
- Setup uploads are UI-scaffolded; the demo path uses seeded mock matter
- AI quality depends on Gemini availability, model, and document fixtures
- Export reflects current workspace state, not a separate “published” revision
- No mobile-native app; desktop / laptop layout is the primary target

---

## License

MIT License — see [`LICENSE`](LICENSE).

This prototype is provided for evaluation of the Lumenci PM assignment.
