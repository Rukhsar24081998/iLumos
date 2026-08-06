# User Flow — Claim Chart Refinement MVP

## 1. Overview

This document describes the end-to-end workflow for a patent analyst refining an AI-generated claim chart inside a conversational workspace.

The analyst starts by uploading a claim chart and supporting materials, then works element by element: requesting improvements in natural language, reviewing evidence-backed suggestions, and deciding whether to accept, reject, or refine each proposal. Only accepted changes become part of the claim chart. When refinement is complete, the analyst exports the finalized chart as a Microsoft Word document.

Throughout the flow, the AI acts as a collaborative assistant. The analyst remains the final decision-maker for every change.

---

## 2. Happy Path

The primary journey from session start to export:

```
Start session
↓
Upload claim chart
↓
Upload supporting documents
↓
Begin refinement
↓
Review claim chart elements
↓
Select a claim element that needs improvement
↓
Request refinement via chat
↓
Review AI suggestion (proposed change + evidence + rationale)
↓
Accept suggestion
↓
Repeat for additional claim elements as needed
↓
Confirm claim chart is ready
↓
Export refined claim chart to Word
↓
End session
```

### Step-by-step

1. **Start session**  
   The analyst opens the product to begin a new refinement session.

2. **Upload claim chart**  
   The analyst provides the existing (AI-generated or draft) claim chart to be refined.

3. **Upload supporting documents**  
   The analyst adds product manuals, technical documentation, or other source materials the AI may use as evidence.

4. **Begin refinement**  
   Once the claim chart is available, the analyst starts the refinement session and enters the workspace.

5. **Review claim chart elements**  
   The analyst reviews each claim element’s current mapping, evidence, and reasoning to identify weaknesses.

6. **Select a claim element**  
   The analyst focuses on one element that needs stronger evidence, clearer reasoning, or a better product-feature mapping.

7. **Request refinement**  
   The analyst asks, in natural language, for a targeted improvement (for example: strengthen evidence, deepen technical reasoning, or clarify the product feature).

8. **Review suggestion**  
   The analyst examines the proposed change, supporting evidence citations, and rationale before any update is applied.

9. **Accept suggestion**  
   If the proposal is accurate and useful, the analyst accepts it. The claim chart updates to reflect only that approved change.

10. **Iterate across elements**  
    The analyst continues selecting other elements and repeating the refinement cycle until satisfied.

11. **Export**  
    The analyst exports the finalized claim chart as a Word document and ends the session.

---

## 3. System Responses

How the system responds after each major user action:

| User Action | System Response |
| --- | --- |
| Starts a new session | Presents setup for uploading a claim chart and supporting documents |
| Uploads claim chart | Confirms the chart is loaded and makes claim elements available for review |
| Uploads supporting documents | Confirms documents are available as evidence sources for the session |
| Attempts to begin without a claim chart | Blocks progression and asks for a claim chart |
| Begins refinement | Opens the refinement workspace with the loaded claim chart and documents |
| Selects a claim element | Scopes subsequent chat and suggestions to that element; highlights the selection |
| Sends a refinement request | Acknowledges the request and analyzes the selected element against available documents |
| AI finds usable evidence | Returns a pending suggestion with proposed content, citations, and rationale — does **not** auto-apply |
| AI cannot find usable evidence | Communicates uncertainty and asks for additional documentation or a product URL |
| Reviews a pending suggestion | Shows before/after comparison so the analyst can see exactly what would change |
| Accepts a suggestion | Applies the change to the claim chart; marks the suggestion as accepted; records the decision in the session activity |
| Rejects a suggestion | Discards the proposal; leaves the claim chart unchanged; clears the pending suggestion |
| Asks to refine further | Keeps current context and generates a revised suggestion based on the new guidance |
| Undoes a previous acceptance | Restores the claim element to its prior content and notes that the change was undone |
| Requests export | Generates a Word document reflecting the current accepted claim chart state |

---

## 4. Conversational Refinement Flow

This is the core human-in-the-loop loop for a single claim element.

```
User selects a claim element
↓
User requests refinement in chat
↓
System analyzes the request using the selected element + supporting documents
↓
System generates an evidence-backed suggestion
↓
User reviews the suggestion (proposed change, evidence, rationale)
↓
User chooses one path:
   ├─ Accept  → claim chart updates; suggestion closed
   ├─ Reject  → claim chart unchanged; suggestion discarded
   └─ Refine  → user provides more guidance → loop returns to analysis
```

### Detailed stages

#### 4.1 User requests refinement

The analyst selects a claim element and sends a natural-language request, such as:

- “Strengthen the evidence for this element.”
- “Make the reasoning more technical.”
- “The product feature mapping is incomplete — improve it.”

#### 4.2 AI analyzes request

The system interprets the request in context of:

- The selected claim element’s current content
- Uploaded supporting documents
- The specific improvement the analyst asked for

#### 4.3 AI generates suggestion

The system produces a **pending** suggestion that includes:

- What would change (feature mapping, evidence, and/or reasoning)
- Supporting evidence citations drawn from the uploaded documents
- A short rationale explaining why the change is proposed

The claim chart itself is not modified at this stage.

#### 4.4 User reviews suggestion

The analyst compares current content with the proposal and verifies that:

- Evidence is relevant and accurate
- Reasoning is legally/technically sound enough to continue
- The change addresses the original request

#### 4.5 User accepts, rejects, or refines further

| Decision | Outcome |
| --- | --- |
| **Accept** | Proposed content becomes part of the claim chart. Session notes that the change was approved. |
| **Reject** | Proposal is discarded. Claim chart stays as it was. Analyst may select another element or make a new request. |
| **Refine** | Analyst continues the conversation with corrective or clarifying guidance. System generates a new suggestion for review. |

No suggestion becomes final without an explicit Accept.

---

## 5. Iteration Loop

Claim chart refinement is rarely a one-and-done action. Analysts typically improve multiple elements over a session.

```
Review claim chart
↓
Identify next weak or incomplete element
↓
Select element
↓
Run conversational refinement flow (request → suggestion → review → decide)
↓
Element improved? ──No──→ Refine again on same element
↓ Yes
More elements need work? ──Yes──→ Select next element
↓ No
Proceed to export
```

### How iteration works in practice

1. The analyst scans the claim chart and finds elements with weak evidence, shallow reasoning, or missing product features.
2. For each element, the analyst runs one or more conversational refinement cycles until that element is acceptable.
3. After accepting a change, the analyst moves to another element and repeats.
4. The analyst may return to a previously refined element if later review reveals remaining gaps.
5. The loop ends when the analyst judges the overall claim chart ready for export.

The product supports this pattern by keeping the claim chart, chat context, and suggestion review in one continuous workflow — so the analyst does not switch tools between iterations.

---

## 6. Edge Cases

### 6.1 AI provides incorrect evidence

```
User requests refinement
↓
System returns a suggestion with evidence
↓
User determines the evidence is wrong or irrelevant
↓
User either:
   ├─ Rejects the suggestion
   │     ↓
   │  Claim chart unchanged; pending suggestion cleared
   │
   └─ Refines with corrective guidance
         (“This evidence is wrong; use the section about [X] instead.”)
         ↓
      System regenerates a new suggestion using the corrected direction
         ↓
      User reviews again (Accept / Reject / Refine)
```

**Product principle:** Incorrect AI output must never silently enter the claim chart. Rejection or corrective refinement keeps the analyst in control.

---

### 6.2 User undoes a previous refinement

```
User previously accepted a suggestion
↓
Claim chart was updated
↓
User decides the accepted change should not stand
↓
User undoes the previous refinement
↓
System restores the claim element to its prior content
↓
System records that the change was undone
↓
User continues refining (same or different element)
```

**Product principle:** Acceptance is deliberate but reversible within the session, so analysts can correct mistakes without restarting the workflow.

---

### 6.3 AI cannot find sufficient evidence

```
User requests refinement
↓
System analyzes selected element against available documents
↓
System cannot find sufficient supporting evidence
↓
System does not invent citations
↓
System informs the user that evidence is insufficient
↓
System asks the user to provide:
   ├─ Additional documentation, and/or
   └─ A product URL
↓
User supplies additional material (or adjusts the request)
↓
System re-analyzes with the expanded context
↓
Returns a suggestion if evidence is now available
   — or —
Reports again if evidence is still insufficient
```

**Product principle:** When evidence is missing, the system should be transparent and request what it needs — not fabricate support. The analyst can then add documents or a product URL and continue the same refinement thread.

---

## 7. Export Flow

When the analyst is satisfied with the refined claim chart:

```
User completes refinement iterations
↓
User reviews final claim chart state
↓
User requests export
↓
System compiles only the current accepted claim chart content
↓
System generates a Microsoft Word document
↓
User downloads / receives the Word file
↓
Session complete (for MVP purposes)
```

### Export rules

- The exported document reflects the **current accepted state** of the claim chart.
- Pending suggestions that were never accepted are **not** included.
- Rejected suggestions are **not** included.
- Undone changes are **not** included; prior restored content is what exports.

The export step closes the MVP workflow: the analyst leaves with a Word claim chart ready for further legal review outside the product.

---

## End-to-End Flow Summary (for Figma)

High-level diagram structure suitable for a User Flow Diagram:

```
[Start]
   ↓
[Upload claim chart + supporting docs]
   ↓
[Enter refinement workspace]
   ↓
[Select claim element] ←──────────────────────────────┐
   ↓                                                   │
[Request refinement via chat]                          │
   ↓                                                   │
[AI analyzes]                                          │
   ↓                                                   │
          ┌──── insufficient evidence ────┐            │
          ↓                               │            │
[Ask for more docs / product URL]         │            │
          ↓                               │            │
[User adds material] ─────────────────────┘            │
   ↓                                                   │
[AI returns suggestion]                                │
   ↓                                                   │
[User reviews suggestion]                              │
   ↓                                                   │
   ├─ Accept → [Update claim chart]                    │
   ├─ Reject → [Discard suggestion]                    │
   └─ Refine → [Provide guidance] ──→ [AI analyzes]    │
   ↓                                                   │
[More elements to refine?] ──Yes───────────────────────┘
   ↓ No
[Optional: Undo last accepted change] ──→ [Restore prior content]
   ↓
[Export to Word]
   ↓
[End]
```

---

## Workflow Principles (MVP)

1. **Human-in-the-loop** — Every change requires explicit analyst approval.
2. **Evidence transparency** — Suggestions include citations and rationale; no silent edits.
3. **Conversational iteration** — Analysts improve quality through continued dialogue, not one-shot generation.
4. **Safe failure modes** — Wrong evidence, undo, and missing evidence are first-class paths, not afterthoughts.
5. **Single workflow** — Upload, refine, review, and export happen in one continuous product experience.
