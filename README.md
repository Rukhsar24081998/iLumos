# iLumos — Claim Chart Refinement MVP

AI-powered conversational workspace for refining patent claim charts with a human-in-the-loop review workflow.

Built as a functional prototype for the Lumenci Product Manager assignment.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy the example env file when you reach AI integration phases:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API key (Phase 4.2+; server/script only) |
| `GEMINI_MODEL` | Optional model id (default: `gemini-2.0-flash`) |
| `AI_DEBUG` | Optional `true` to force AI debug logs |

Local Gemini client smoke test (not wired to the UI):

```bash
npm run test:gemini
```

## Project structure

```
app/                    # App Router pages
  page.tsx              # Setup screen (/)
  workspace/page.tsx    # AI Workspace (/workspace)
components/
  layout/               # App shell + header
  setup/                # Setup screen components
  workspace/            # Workspace panels
  common/               # Shared UI helpers
  ui/                   # shadcn/ui primitives
data/                   # Mock/session data (later phases)
docs/                   # Product documentation (source of truth)
hooks/                  # Shared React hooks (later phases)
lib/                    # Utilities
types/                  # Domain TypeScript types
public/                 # Static assets
```

## Routes

| Route | Screen | Status |
| --- | --- | --- |
| `/` | Setup | Placeholder (Phase 1) |
| `/workspace` | AI Workspace | Placeholder (Phase 1) |

## Documentation

Product docs in `/docs` are the source of truth:

1. `01_ProblemStatement.md`
2. `02_ImplementationPlan.md`
3. `03_UserFlow.md`
4. `04_MockData.md`
5. `05_UI_UX_Design.md`

## Current phase

**Phase 1 — Project Setup** is complete:

- Runnable Next.js app shell
- Shared layout (header + main)
- Placeholder Setup and Workspace screens
- Core domain types
- Folder structure ready for incremental feature work

Later phases will add uploads, mock data, chat, suggestions, review actions, edge cases, and Word export.
