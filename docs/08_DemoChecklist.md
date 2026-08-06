# Demo & QA Checklist — Phase 8

Use this checklist for reviewer demos and final verification. No code changes are required to run the demo.

---

## Prerequisites

```bash
npm install
cp .env.example .env.local
# Optional for live AI:
# GEMINI_API_KEY=your_key_here
# NEXT_PUBLIC_AI_MODE=auto

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Mode | Setting |
| --- | --- |
| Guaranteed offline demo | `NEXT_PUBLIC_AI_MODE=mock` |
| Live + fallback | `NEXT_PUBLIC_AI_MODE=auto` + valid `GEMINI_API_KEY` |

---

## Scripted happy path (~5 minutes)

1. **Setup** — Quick Start: load sample claim chart (+ supporting docs if prompted)
2. **Start Analysis** — land on `/workspace`
3. **Select claim** — e.g. CE-3 (weak reasoning)
4. **Evidence panel** — confirm snippets / citations for the selection
5. **Suggested action** — Strengthen Evidence or Improve Reasoning
6. **Review suggestion** — View Details (original vs improved reasoning, sources)
7. **Refine Further** — wait for next version; confirm version badge
8. **Accept** — claim chart status/reasoning updates; highlight flash
9. **Export DOCX** — download opens; file name like `ClaimChart_US123456.docx`
10. **New Session** — return to setup / reset and confirm clean state

---

## Edge / resilience moments

| Scenario | Expected |
| --- | --- |
| **Reject** a pending suggestion | Chart reasoning unchanged; suggestion marked Rejected |
| **Custom prompt** | User message + assistant suggestion (live or mock) |
| **Add Missing Feature** | New-row proposal path; Accept adds/updates row |
| **Mock mode** | Suggestions without Gemini key |
| **Network / Gemini failure** | Friendly system message; conversation unchanged; mock fallback when mode allows |
| **Export with no chart** | Friendly error; workspace unchanged |
| **Busy state** | Buttons disabled; no duplicate sends; New Session locked while AI/export runs |

---

## Full QA checklist

### Workflows

- [ ] New Session
- [ ] Select claim
- [ ] Evidence panel updates with selection
- [ ] Suggested actions
- [ ] Custom prompt
- [ ] Improve Reasoning
- [ ] Strengthen Evidence
- [ ] Add Missing Feature
- [ ] Refine Further
- [ ] Accept
- [ ] Reject
- [ ] Export DOCX
- [ ] Gemini mode (`auto` / `live` with key)
- [ ] Mock mode
- [ ] Network failure / missing-key fallback behavior

### UX / a11y / layout

- [ ] Keyboard navigation (Tab to claim rows, chips, composer, Accept/Reject)
- [ ] Visible focus rings
- [ ] Skip to main content (keyboard)
- [ ] Responsive: desktop three-panel; smaller widths stack without clipping header actions
- [ ] Empty / error states readable (no stack traces)

### Build scripts

- [ ] `npm install`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:docx`
- [ ] `npm run test:gemini` (requires `GEMINI_API_KEY`)
- [ ] `npm run dev` starts cleanly

---

## Submission notes

- Do **not** commit `.env.local` or real API keys
- Optional screenshots: `docs/screenshots/`
- Point reviewers at root `README.md` and this checklist
