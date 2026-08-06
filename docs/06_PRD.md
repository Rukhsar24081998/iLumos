# Product Requirements Document

## Product

**iLumos — AI-powered Patent Claim Chart Refinement**

---

## Problem Statement

Patent analysts refine AI-generated claim charts by switching between documents, AI chat tools, and Word—manually verifying weak reasoning, thin evidence, and missing features. Because claim charts are legal work product, every change must be reviewed before it is applied. A single conversational workspace with human-in-the-loop control shortens that loop: analysts request refinements in natural language, review evidence-backed proposals beside the chart, and approve only what they trust.

---

## Goal

Enable patent analysts to refine patent claim charts faster using conversational AI while maintaining complete human control, evidence-backed decisions, and litigation-ready outputs.

---

## North Star Metric

**Average time required to produce an export-ready claim chart.**

This measures whether iLumos helps patent analysts complete high-quality claim chart refinement more efficiently while maintaining analyst control.

---

## Target User

**Primary user:** Patent Analyst

| | |
| --- | --- |
| **Responsibilities** | Map patent claim elements to accused-product features; verify evidence; produce litigation-ready claim charts |
| **Goals** | Faster refinement, stronger evidence-backed reasoning, fewer tool switches, confidence in every accepted edit |
| **Pain points** | Weak AI drafts, shallow citations, missing features, repetitive copy-paste into chat tools, no structured accept/reject workflow |

---

## User Stories

1. As a Patent Analyst, I want to upload an existing claim chart, so that I can start refinement from my current draft.
2. As a Patent Analyst, I want to upload supporting technical documents, so that the AI can ground suggestions in product evidence.
3. As a Patent Analyst, I want to ask the AI to improve specific claim elements in natural language, so that I can target weak reasoning or thin evidence without rewriting everything myself.
4. As a Patent Analyst, I want to review cited evidence beside each suggestion, so that I can verify technical and legal accuracy before accepting.
5. As a Patent Analyst, I want to Accept, Reject, or Refine Further each suggestion, so that only approved changes enter the claim chart.
6. As a Patent Analyst, I want accepted changes to update the live claim chart immediately, so that I always see the current approved state.
7. As a Patent Analyst, I want to export the finalized claim chart to Word, so that I can use it in downstream legal review.

---

## Core Features (MVP)

- Claim chart upload
- Supporting document upload
- Three-panel workspace (claim chart · AI conversation · evidence)
- Conversational refinement requests (including suggested prompts)
- Evidence-backed AI suggestions (before/after, citations, confidence)
- Accept / Reject / Refine Further workflow
- Live claim chart updates on Accept only
- Session matter context (patent vs. accused product)
- Export refined claim chart to Microsoft Word

---

## Out of Scope

- Authentication / accounts
- OCR of scanned documents
- Live patent / prior-art search
- Multi-user collaboration
- Cross-session version history
- Analytics / admin dashboards
- Automated infringement scoring or legal conclusions
- Notifications, roles, or enterprise settings

---

## Key Product Decisions

1. **Human-in-the-loop, never auto-edit** — Legal documents require explicit analyst approval for every change.
2. **Evidence-first suggestions** — Proposals without citations are incomplete; trust requires visible sources.
3. **Separate Evidence Panel** — Keeps verification continuous without burying citations inside chat.
4. **Conversational refinement** — Matches how analysts already prompt AI, while keeping the chart as the source of truth.
5. **Mock-first prototype before live AI** — Validates the workflow and UX before investing in full model integration.

---

## Assumptions

- Analysts begin with an existing claim chart.
- Supporting technical documents are available.
- AI assists analysts but never replaces legal judgment.
- Analysts explicitly approve every accepted change.

---

## Acceptance Criteria

- Analyst can upload a claim chart and supporting documents and enter the workspace
- Analyst can select a claim element and request refinements via chat
- AI returns suggestions with proposed text, rationale, and evidence citations
- Analyst can Accept, Reject, or Refine Further each suggestion
- Accept updates the claim chart; Reject leaves it unchanged
- Export produces a Word document reflecting only the accepted chart state
- Only analyst-approved refinements are included in the exported Word document

---

## Success Metrics

| Metric | Intent |
| --- | --- |
| Suggestion Acceptance Rate | Quality and usefulness of AI proposals |
| Average Refinement Iterations per Claim Element | Efficiency of the review loop |
| Average Time to Export-ready Claim Chart | End-to-end productivity |
| Export Completion Rate | Workflow completion |
| Analyst Satisfaction (CSAT) | Trust and willingness to adopt |

---

*This PRD defines the MVP scope for the iLumos AI-powered claim chart refinement experience and serves as the product specification for the working prototype.*
