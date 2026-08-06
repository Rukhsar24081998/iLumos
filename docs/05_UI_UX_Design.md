# UI/UX Design Blueprint — Claim Chart Refinement MVP

## 1. Design Goals

This product exists to help patent analysts refine AI-generated claim charts without leaving a single workspace. The interface must make refinement faster, clearer, and safer than the current multi-tool workflow.

### Primary UX goals

1. **Minimize context switching**  
   Claim chart, conversation, and evidence live in one continuous workspace. Analysts should not need separate AI tools, document viewers, and Word files during refinement.

2. **Keep the claim chart visible throughout the workflow**  
   The claim chart is the source of truth. It remains on screen while the analyst chats, reviews suggestions, and decides what to apply.

3. **Make AI suggestions transparent and explainable**  
   Every proposal shows original content, suggested content, evidence citations, confidence, and a short AI summary — before anything changes.

4. **Keep the patent analyst in complete control**  
   AI never silently edits the claim chart. Accept, Reject, Refine, and Undo are always explicit analyst actions.

5. **Make conversational refinement intuitive and efficient**  
   Natural-language requests, suggested prompts, and clear review cards reduce friction for common refinement tasks.

6. **Support a trustworthy demo path**  
   The interface must fully support the four assignment refinement scenarios and three edge cases using the US123456 / Acme Corp Thermostat mock dataset.

---

## 2. Design Principles

| Principle | Meaning in the product |
| --- | --- |
| **Human-in-the-loop** | No claim chart change is final until the analyst accepts it. |
| **AI as assistant, not decision maker** | AI proposes; the analyst decides. Language and UI hierarchy should reinforce that relationship. |
| **Evidence-first workflow** | Suggestions without citations are incomplete. Evidence is always visible beside or within the proposal. |
| **Progressive disclosure** | Show full claim chart overview first; deepen into selected element, suggestion detail, and evidence snippets as needed. |
| **Minimal cognitive load** | Three-panel workspace, clear status badges, one active suggestion at a time when possible. |
| **Clear feedback for every action** | Upload, select, send, accept, reject, refine, undo, and export each produce an immediate, understandable response. |
| **Honesty over completion** | When evidence is missing or wrong, the UI surfaces uncertainty instead of fabricating confidence. |
| **Desktop-first focus** | Optimize for a laptop demo. Do not add enterprise navigation, settings hubs, or secondary dashboards. |

---

## 3. Application Structure

The MVP has exactly three screens. Navigation is linear and task-driven.

```
Screen 1 — Setup
↓
Screen 2 — AI Workspace
↓
Screen 3 — Export
```

### Navigation rules

| From | To | How |
| --- | --- | --- |
| Setup → Workspace | Analyst uploads a claim chart (required) and optionally supporting documents, then selects **Start Analysis** |
| Workspace → Export | Analyst selects **Export** / **Ready to Export** from the workspace header when refinement is complete |
| Export → Workspace | Analyst may return via **Back to Workspace** if they want to continue refining |
| Export → Setup | Optional **Start new session** resets the prototype to the beginning |

### What is not in navigation

No login, settings, analytics, notifications, user profiles, project lists, or collaboration screens.

### Persistent session context

Once analysis starts, the matter title remains visible in the workspace and export screens:

**US123456 vs. Acme Corp Thermostat**

---

## 4. Screen 1 — Setup

### Purpose

Introduce the product and let the analyst start a refinement session by uploading the claim chart and supporting materials.

### Layout intent

A focused, single-column setup experience. Calm and clear. Not a dashboard. The brand/product name and purpose should be immediately readable.

### Components

1. **Product title**  
   e.g., **iLumos** or **Claim Chart Refinement Workspace**

2. **Short description**  
   One or two sentences, such as:  
   *Refine AI-generated claim charts through conversation. Review every suggestion before it becomes part of the final chart.*

3. **Matter preview**  
   Soft label once files are loaded:  
   `US123456 vs. Acme Corp Thermostat`

4. **Upload Claim Chart** *(required)*  
   - Upload area for the claim chart file  
   - Demo helper: **Load sample claim chart** (loads CE-1, CE-2, CE-3 from mock data)  
   - After upload/load: show file name `Claim_Chart_US123456_Acme.docx` and “3 claim elements ready”

5. **Upload Supporting Documents** *(optional but recommended)*  
   - Multi-file upload area  
   - Demo helper: **Load sample documents**  
   - Expected sample files:
     - Engineering_Manual.pdf  
     - Technical_Specification.pdf  
     - Product_Brochure.pdf  
     - Patent_US123456.pdf  
   - Show uploaded file chips/list with remove action

6. **Optional AI Instructions**  
   - Short text area  
   - Placeholder example: “Prefer engineering manuals over marketing language when citing evidence.”  
   - Not required to continue

7. **Start Analysis** button  
   - Primary CTA  
   - Disabled until a claim chart is present

### Expected user actions

1. Open the product  
2. Upload or load the sample claim chart  
3. Upload or load supporting documents  
4. Optionally add AI instructions  
5. Select **Start Analysis**

### System responses

| User action | System response |
| --- | --- |
| Lands on Setup | Shows title, description, empty upload areas, disabled Start Analysis |
| Loads sample claim chart | Confirms chart loaded; enables Start Analysis; shows 3 elements |
| Uploads supporting docs | Lists documents; no blocking if none uploaded |
| Removes a document | Document disappears from list |
| Clicks Start Analysis without chart | Button remains disabled or shows inline message: “Upload a claim chart to continue” |
| Clicks Start Analysis with chart | Enters processing state, then navigates to AI Workspace |

### Loading and processing states

**Processing sequence after Start Analysis:**

1. Brief full-screen or inline processing state  
2. Message sequence (2–4 seconds total for prototype feel):
   - “Reading claim chart…”  
   - “Indexing supporting documents…”  
   - “Preparing refinement workspace…”  
3. Transition into Screen 2 with CE-1, CE-2, CE-3 visible and documents listed in the Evidence Panel

Do not invent a long onboarding wizard.

---

## 5. Screen 2 — AI Workspace

### Purpose

The primary working screen. This is where almost all demo time is spent.

### Overall layout

**Three-column desktop layout:**

```
┌────────────────┬─────────────────────┬────────────────┐
│ LEFT PANEL     │ CENTER PANEL        │ RIGHT PANEL    │
│ Claim Chart    │ Conversational AI   │ Evidence       │
│ Viewer         │ Chat                │ Panel          │
└────────────────┴─────────────────────┴────────────────┘
```

### Workspace header

Always visible above the three panels:

- Matter title: **US123456 vs. Acme Corp Thermostat**
- Document count: e.g., `4 documents`
- Claim element count: e.g., `3 elements` → updates to `4` if CE-4 is accepted
- Actions:
  - **Undo** (enabled when an accepted change can be undone)
  - **Export** (primary exit to Screen 3)

---

### LEFT PANEL — Claim Chart Viewer

The living claim chart. Always visible during refinement.

#### Contents for each claim element row/card

- Claim Element ID (CE-1, CE-2, CE-3, later CE-4)
- Patent Claim Element
- Accused Product Feature
- Current Reasoning
- Evidence source (short label)
- Status badge
- Reasoning quality cue (especially **Weak** on CE-3 initially)

#### Status badges

| Badge | When shown |
| --- | --- |
| **Needs Review** | Initial uploaded state |
| **Pending Suggestion** | AI has an open suggestion for this element |
| **Updated** | Analyst accepted a change on this element |
| **Proposed** | Used for CE-4 before acceptance (shown in suggestion, not yet in chart body as final) |

#### Interaction behavior

- Clicking a claim element **selects** it
- Selected element is visually highlighted
- Selection scopes chat context (“Refining CE-3”)
- When a suggestion is pending for an element, that row shows **Pending Suggestion**
- When accepted, the row briefly highlights as **Updated**, then settles with updated content
- CE-3 should be visually easy to spot as weak at session start (badge or quality label)

#### Highlight updated rows

After Accept:

- Background emphasis or left accent on the changed row
- Optional subtle “Updated just now” label that fades after a few seconds
- Reasoning text refreshes in place
- Evidence label updates when evidence changed (Scenarios 1 and 2)

---

### CENTER PANEL — Conversational AI Chat

The conversation and suggestion review surface.

#### Contents

1. **Context bar**  
   Shows selected element, e.g.:  
   `Selected: CE-3 — Machine learning algorithm that learns user temperature preferences over time`

2. **Conversation history**  
   Chronological analyst messages, AI replies, and system activity notes  
   Examples of activity notes:
   - “Accepted evidence update for CE-2”
   - “Rejected suggestion for CE-3”
   - “Undid accepted refinement for CE-2”

3. **Suggested prompts**  
   Shown when chat is empty or when an element is selected. Use assignment prompts:

   - “Add technical documentation for the motion sensor claim.”
   - “The AI reasoning for element 3 is vague. Add more specific technical analysis.”
   - “AI missed that Acme also has a temperature sensor array.”
   - “Rewrite the reasoning to address potential claim construction arguments.”

   Clicking a prompt fills or sends the chat input.

4. **Chat input**  
   Multi-line text field + Send  
   Placeholder: “Ask to strengthen evidence, improve reasoning, or clarify claim language…”

5. **AI responses**  
   Short conversational reply first, then a structured **Suggestion Card** when a change is proposed

6. **Suggestion cards**  
   Embedded in the chat timeline (see Section 6)  
   Only one active pending card should be actionable at a time for clarity

#### Empty / helper states

- No element selected: “Select a claim element to begin a targeted refinement.”
- Element selected, no messages yet: show suggested prompts
- AI thinking: show processing indicator in chat (“Analyzing CE-3 against uploaded documents…”)

---

### RIGHT PANEL — Evidence Panel

Grounds every suggestion in source material.

#### Contents

1. **Uploaded documents list**
   - Engineering_Manual.pdf  
   - Technical_Specification.pdf  
   - Product_Brochure.pdf  
   - Patent_US123456.pdf  

2. **Evidence snippets**  
   When a suggestion is pending or an element is selected, show relevant excerpts  
   Example for CE-3 suggestion: Auto-Schedule excerpt from Engineering_Manual.pdf

3. **Source citations**  
   Document name + short locator/description  
   Clicking a citation focuses that document/snippet

4. **Confidence indicator**  
   Reflects the active suggestion’s confidence score (e.g., 0.88 → High / 88%)  
   If no active suggestion, hide or show neutral state

5. **Document preview (optional)**  
   Lightweight preview/snippet pane is enough for MVP  
   Full PDF reader is not required

#### Evidence panel states

| State | What user sees |
| --- | --- |
| Session start | All uploaded docs listed; no focused snippet |
| Element selected | Snippets related to that element, if available |
| Suggestion pending | Citations and excerpts for the active suggestion highlighted |
| No evidence found | Clear empty/uncertain message; prompts to upload doc or provide URL |

---

### How the three panels work together

```
Select CE-3 in Left Panel
↓
Center Panel scopes chat to CE-3
↓
Analyst sends refinement request
↓
AI analyzes using Right Panel documents
↓
Center Panel shows suggestion card
↓
Right Panel highlights cited evidence
↓
Left Panel marks CE-3 as Pending Suggestion
↓
Analyst Accepts / Rejects / Refines in Center Panel
↓
Left Panel updates only on Accept
```

The analyst’s eye path should feel natural: **Chart → Chat → Evidence → Decision → Chart**.

---

## 6. AI Suggestion Card

The most important UI component in the product. Every meaningful AI refinement surfaces here.

### Card contents

| Field | Description |
| --- | --- |
| **Target Claim Element** | e.g., CE-3 |
| **AI Summary** | Short conversational explanation of what is being proposed and why |
| **Original Reasoning** | Current reasoning from the claim chart (before change) |
| **Suggested Reasoning** | Proposed replacement/improved reasoning |
| **Evidence Citation** | Document name(s) + excerpt reference |
| **Confidence Score** | Numeric score from mock data (e.g., 0.88) with simple visual meter |
| **Status** | Pending / Accepted / Rejected |

For Scenario 3 (new row), also show:

- Proposed Patent Claim Element  
- Proposed Accused Product Feature  
- Label: **New row proposal — not yet added to chart**

### Visual structure (conceptual)

```
Suggestion for CE-3                    Confidence 0.88
─────────────────────────────────────────────────────
AI Summary
[short explanation]

Original Reasoning
[current text]

Suggested Reasoning
[proposed text]

Evidence
Engineering_Manual.pdf — Auto-Schedule...
Product_Brochure.pdf — “Auto-Schedule learns...”

[ Reject ]   [ Refine ]   [ Accept ]
```

### Actions and exact outcomes

#### Accept

1. Suggestion status becomes **Accepted**
2. Claim chart updates immediately:
   - Reasoning replaced/updated
   - Evidence updated if the scenario changes evidence
   - CE-4 inserted as a new row if Scenario 3
3. Left panel row shows **Updated**
4. Chat adds activity note: “Accepted update for CE-X”
5. Right panel citations remain available for reference
6. Accept/Reject/Refine controls disable on that card
7. Undo becomes available for this accepted change

#### Reject

1. Suggestion status becomes **Rejected**
2. Claim chart does **not** change
3. Pending badge clears from the target element
4. Chat adds activity note: “Rejected suggestion for CE-X”
5. Analyst may send a new request or select another element

#### Refine

1. Card remains contextual but actions pause while a follow-up is in progress
2. Chat input focuses for corrective guidance  
   Example: “This evidence is wrong. Use the Auto-Schedule section in the engineering manual instead.”
3. AI generates a **new** suggestion card based on the guidance
4. Previous pending suggestion is superseded (no longer actionable)
5. Claim chart remains unchanged until a later Accept

### Critical rule

The suggestion card is a proposal surface, never an auto-edit.  
If Accept is not clicked, the left-panel claim chart stays as-is.

---

## 7. User Interaction Flow

### End-to-end product flow

```
Upload claim chart + documents (Setup)
↓
Start Analysis
↓
Enter AI Workspace
↓
Review claim elements (Left)
↓
Select an element
↓
Send chat request or suggested prompt (Center)
↓
AI analyzes documents (Right)
↓
AI returns suggestion card (Center)
↓
Review original vs suggested + evidence
↓
Accept / Reject / Refine
↓
If Accept → Claim Chart updates (Left)
↓
Repeat for other elements
↓
Export
↓
Download Word file
```

### Micro-flow: selection and chat

```
User clicks CE-3
↓
CE-3 highlighted; context bar updates
↓
Suggested prompts appear for CE-3 / general refinement
↓
User sends prompt
↓
Chat shows user message + processing state
↓
AI reply + suggestion card appear
↓
Evidence Panel focuses cited sources
```

### Micro-flow: decision

```
User reviews suggestion card
↓
Accept → chart updates
Reject → chart unchanged
Refine → new guidance → new suggestion
```

---

## 8. Refinement Scenarios

UI behavior for the four assignment scenarios. Content must match `04_MockData.md`.

---

### Scenario 1 — Strengthen Evidence

**Target:** CE-2  
**User action:** Selects CE-2 (optional but preferred), then sends:  
“Add technical documentation for the motion sensor claim.”

**AI response (Center):**  
Conversational confirmation that stronger support was found in Engineering_Manual.pdf and Technical_Specification.pdf, followed by Suggestion Card S1.

**UI updates:**

- CE-2 badge → **Pending Suggestion**
- Suggestion card shows original vs updated reasoning
- Evidence Panel highlights motion/occupancy excerpts
- Confidence shows **0.91**

**Claim chart changes after Accept:**

- CE-2 reasoning replaced with strengthened technical reasoning
- Evidence source expands to Engineering_Manual.pdf + Technical_Specification.pdf
- CE-2 badge → **Updated**

---

### Scenario 2 — Fix Weak Reasoning *(Primary Demo)*

**Target:** CE-3  
**User action:** Selects CE-3, then sends:  
“The AI reasoning for element 3 is vague. Add more specific technical analysis.”

**AI response (Center):**  
Acknowledges that current reasoning is speculative/marketing-based and proposes a technical rewrite grounded in Engineering_Manual.pdf, via Suggestion Card S2.

**UI updates:**

- CE-3’s **Weak** quality cue remains visible until Accept
- Pending suggestion badge on CE-3
- Before/after reasoning comparison is the visual focus
- Evidence Panel shows Auto-Schedule engineering excerpt
- Confidence shows **0.88**

**Claim chart changes after Accept:**

- Weak reasoning replaced with specific technical analysis from mock data
- Evidence upgraded (Engineering_Manual.pdf primary)
- CE-3 badge → **Updated**
- Weak label removed or changed to Adequate/Strong

This should be the clearest “wow” moment in the demo.

---

### Scenario 3 — Add Missing Feature

**Target:** New row CE-4  
**User action:** Sends:  
“AI missed that Acme also has a temperature sensor array.”

**AI response (Center):**  
Explains the omission, cites Technical_Specification.pdf and Engineering_Manual.pdf, and presents Suggestion Card S3 as a **new row proposal**. Explicitly states nothing is added until Accept.

**UI updates:**

- Suggestion card labeled **New claim chart row**
- Shows proposed patent element, product feature, reasoning, evidence
- Left panel does **not** permanently add CE-4 yet
- Optional ghost/preview row may appear in Left Panel marked **Proposed**
- Confidence shows **0.84**

**Claim chart changes after Accept:**

- CE-4 appears as a real fourth row
- Header element count updates from 3 → 4
- CE-4 badge → **Updated** / **Accepted**

**If Rejected:**

- Chart remains at 3 elements
- No CE-4 row remains

---

### Scenario 4 — Clarify Legal Language

**Target:** CE-1  
**User action:** Selects CE-1, then sends:  
“Rewrite the reasoning to address potential claim construction arguments.”

**AI response (Center):**  
States that reasoning was revised for claim construction around “wireless communication module,” and that evidence is unchanged. Suggestion Card S4 appears.

**UI updates:**

- Suggestion card emphasizes **reasoning-only change**
- Evidence citation remains Product_Brochure.pdf WiFi quote
- Confidence shows **0.86**
- Right Panel can still show the same brochure excerpt

**Claim chart changes after Accept:**

- CE-1 reasoning updated to plain-meaning / claim-construction wording
- Accused product feature and evidence **unchanged**
- CE-1 badge → **Updated**

---

## 9. Edge Case UX

---

### Edge Case 1 — AI provides incorrect evidence

**Trigger example:** AI cites WiFi brochure language while refining CE-3 (machine learning).

#### What the user sees

- Suggestion card for CE-3 with incorrect evidence citation  
  (Product_Brochure.pdf WiFi quote)
- Proposed reasoning incorrectly linking WiFi to machine learning
- Lower confidence (0.62) is acceptable to signal weaker proposal

#### What the AI says (after analyst correction)

Analyst Refine message:  
“This evidence is wrong. WiFi connectivity does not prove machine learning. Use the Auto-Schedule section in the engineering manual instead.”

AI then returns a corrected suggestion using Engineering_Manual.pdf Auto-Schedule evidence.

#### Actions available

- Reject incorrect suggestion
- Refine with corrective guidance
- Accept corrected suggestion later

#### How the workflow continues

Incorrect content never enters the claim chart. Corrected suggestion follows the normal Accept / Reject / Refine path. This demonstrates trust and control.

---

### Edge Case 2 — Undo previous refinement

**Trigger:** Analyst accepted Scenario 1 (CE-2 update), then chooses Undo.

#### What the user sees

- Header **Undo** control enabled
- After Undo:
  - CE-2 restores original uploaded reasoning and evidence
  - Updated highlight removed
  - Status returns to **Needs Review**
  - Chat activity note: “Undid accepted refinement for CE-2. Restored previous claim chart content.”

#### What the AI says

A short system/AI note confirming restoration. No new suggestion unless the analyst asks again.

#### Actions available

- Undo (when available)
- Continue refining same or different element
- Re-request the previous improvement if desired

#### How the workflow continues

Only the undone element reverts. Other accepted changes remain. Analyst proceeds normally.

---

### Edge Case 3 — AI cannot find supporting evidence

**Trigger example:**  
“Find evidence that the Acme thermostat uses reinforcement learning to optimize energy savings.”

#### What the user sees

- No fabricated suggestion card with fake citations
- Center Panel message:

  **“I couldn't find sufficient technical evidence in the uploaded documents.”**

- Clear next-step choices:
  1. Upload another technical document  
  2. Provide a product URL for additional product information

- Right Panel shows an explicit empty/uncertain evidence state

#### What the AI says

Explains that current materials describe Auto-Schedule preference learning, but do not disclose reinforcement learning for energy optimization. Asks for more material.

#### Actions available

- Upload additional document from Workspace (lightweight upload affordance)
- Paste/provide product URL in chat
- Broaden or change the request
- Cancel and select another element

#### How the workflow continues

After analyst provides a mock product URL (or extra document):

- AI acknowledges the new information
- States what is still unsupported (reinforcement learning)
- Offers a **narrower supported refinement** for CE-3 preference learning, if appropriate
- Analyst reviews that narrower suggestion through the normal card flow

Honesty and recovery matter more than forced completion.

---

## 10. Visual Feedback

### Success states

- Claim chart loaded on Setup
- Documents added
- Suggestion accepted
- Export file ready
- Use brief confirmation toasts or inline success banners; keep them quiet and professional

### Loading states

- Setup processing after Start Analysis
- Chat “Analyzing…” after send
- Evidence panel subtle loading when fetching snippets
- Export generation spinner

### Processing animation

- Simple indeterminate progress or pulsing status text is enough
- Prefer clarity over spectacle
- Example chat status: “Reviewing Engineering_Manual.pdf for CE-3…”

### Accepted suggestions

- Card status label: **Accepted**
- Action buttons disabled
- Soft success accent on card
- Corresponding claim row marked **Updated**

### Rejected suggestions

- Card status label: **Rejected**
- Card visually muted/collapsed
- Claim row unchanged
- No success accent

### Updated claim elements

- Temporary highlight on changed row
- Status badge transition: Pending Suggestion → Updated
- Updated reasoning text appears in place

### Empty states

| Location | Empty state message |
| --- | --- |
| Chat (no selection) | Select a claim element to begin a targeted refinement |
| Chat (selected, no messages) | Suggested prompts + “Ask how to improve this element” |
| Evidence (no focus) | Uploaded documents appear here. Select an element or review a suggestion to see citations |
| Evidence (no evidence found) | No sufficient technical evidence found in uploaded documents |
| Suggestion area | No pending suggestions |

### Error messages

Keep short and actionable:

- “Upload a claim chart to start analysis.”
- “Something went wrong generating a suggestion. Try again.”
- “I couldn't find sufficient technical evidence in the uploaded documents.”
- “Undo is unavailable because no accepted change exists yet.”

Avoid technical stack traces in the UI.

---

## 11. Export Experience

### Purpose

Close the workflow by delivering the finalized claim chart as a Word document.

### Entry

From Workspace header: **Export**  
Navigates to Screen 3, or opens an export confirmation step that leads to Screen 3.

### Screen 3 contents

1. **Summary of refined chart**
   - Matter title: US123456 vs. Acme Corp Thermostat
   - Final element count (3 or 4 depending on accepted CE-4)
   - Short list of what changed (e.g., CE-1 reasoning clarified, CE-2 evidence strengthened, CE-3 reasoning improved, CE-4 added)

2. **Export button**  
   Primary CTA: **Export to Word**

3. **Processing state**  
   “Preparing Word document…”

4. **Success message**  
   “Your refined claim chart is ready.”

5. **Download confirmation**  
   - File name example: `US123456_Acme_Claim_Chart_Refined.docx`
   - **Download** action
   - Confirmation text: “Download started” / “File ready”

6. **Secondary actions**
   - **Back to Workspace**
   - **Start new session** (returns to Setup)

### Export content rules (UX-facing)

- Only accepted claim chart content is included
- Pending or rejected suggestions are excluded
- Undone changes are excluded
- Analyst should feel the export reflects what they approved in the workspace

---

## 12. Accessibility & Usability

### Readable typography

- Clear hierarchy: matter title → panel titles → claim element IDs → body reasoning
- Comfortable body size for long reasoning text
- Avoid dense legal walls of text without spacing

### Keyboard-friendly navigation

- Tab through upload controls, claim elements, chat input, and suggestion actions
- Enter to send chat message
- Clear focus states on selected claim element and primary buttons

### Clear contrast

- Status badges must remain readable
- Pending / Updated / Weak states should not rely on color alone — include text labels
- Suggestion card original vs suggested text must be easy to distinguish

### Responsive desktop layout

- Optimize for laptop widths used in demos
- Three columns may collapse gracefully if needed, but desktop three-panel is the intended experience
- Do not prioritize mobile for MVP

### Consistent spacing

- Uniform gaps between claim element rows
- Consistent padding inside panels and suggestion cards
- Suggested prompts should be easy to scan, not crowded

### Easy-to-scan information hierarchy

1. Which claim element am I on?  
2. What is the AI proposing?  
3. What evidence supports it?  
4. What are my next actions?

If those four questions are answerable in under a few seconds, the design is working.

---

## Design Constraints (MVP)

Do **not** add:

- Authentication or accounts  
- Dashboards or analytics  
- User management  
- Collaboration / commenting systems  
- Notification centers  
- Complex settings  
- Multi-project switchers  

Do **ensure**:

- Setup → Workspace → Export is complete and demoable  
- All four refinement scenarios are supported in UI  
- All three edge cases are visible and recoverable  
- Mock data from `04_MockData.md` is used exactly for claim text and scenario content  
- Analyst remains visibly in control at every decision point  

---

## Designer / Builder Checklist

Before calling the prototype UI complete:

- [ ] Setup can load the sample US123456 claim chart and four documents  
- [ ] Workspace shows three panels working together  
- [ ] CE-3 appears weak at start  
- [ ] Suggested prompts match assignment scenarios  
- [ ] Suggestion cards include original, suggested, evidence, confidence, summary, and actions  
- [ ] Accept updates chart; Reject does not; Refine continues conversation  
- [ ] Incorrect evidence path supports Reject/Refine correction  
- [ ] Undo restores prior accepted content  
- [ ] No-evidence path asks for document upload or product URL  
- [ ] Export confirms and downloads the refined Word claim chart  
- [ ] No enterprise chrome distracts from the refinement workflow  
