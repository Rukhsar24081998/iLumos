# Mock Data Specification — Claim Chart Refinement MVP

## 1. Overview

This document defines the complete mock dataset for the Lumenci claim chart refinement prototype.

The dataset seeds the end-to-end conversational refinement workflow: uploading a claim chart, reviewing claim elements, requesting AI improvements, reviewing evidence-backed suggestions, handling edge cases, and exporting the finalized chart.

All mock content is built around a single consistent matter:

- **Patent:** US123456
- **Accused Product:** Acme Corp Smart Thermostat
- **Session Title:** US123456 vs. Acme Corp Thermostat

The initial claim chart below is the **canonical uploaded state**. Refinement scenarios, suggestion cards, edge cases, and the final refined chart must all remain consistent with these three original claim elements.

---

## 2. Base Claim Chart

This is the claim chart exactly as it appears when the analyst uploads it at the start of the session.

**Matter:** US123456 vs. Acme Corp Thermostat  
**Document Name:** Claim_Chart_US123456_Acme.docx  
**Initial Element Count:** 3

---

### Claim Element 1

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-1 |
| **Patent Claim Element** | A temperature control device with a wireless communication module |
| **Accused Product Feature** | Acme Thermostat product page states: "WiFi-enabled smart thermostat connects to your home network." |
| **Existing AI Reasoning** | The Acme device has WiFi capability which satisfies the wireless communication module requirement. |
| **Evidence Source** | Product_Brochure.pdf — product page / marketing description of WiFi connectivity |
| **Reasoning Quality** | Adequate |
| **Status** | Needs Review |

---

### Claim Element 2

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-2 |
| **Patent Claim Element** | A motion sensor for detecting occupancy |
| **Accused Product Feature** | Acme technical specifications document shows: "Built-in motion sensor detects when people are home." |
| **Existing AI Reasoning** | Motion sensor explicitly mentioned in specifications directly maps to the claim element for occupancy detection. |
| **Evidence Source** | Technical_Specification.pdf — motion sensor / occupancy detection statement |
| **Reasoning Quality** | Adequate (evidence can be strengthened) |
| **Status** | Needs Review |

---

### Claim Element 3

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-3 |
| **Patent Claim Element** | Machine learning algorithm that learns user temperature preferences over time |
| **Accused Product Feature** | Acme marketing materials claim: "Auto-Schedule learns your preferred temperatures." |
| **Existing AI Reasoning** | The learning behavior described suggests a machine learning algorithm, though technical implementation details are not disclosed. May need stronger technical evidence. |
| **Evidence Source** | Product_Brochure.pdf — Auto-Schedule marketing claim |
| **Reasoning Quality** | Weak |
| **Status** | Needs Review |

**Demo note:** CE-3 is intentionally weak and is the primary refinement target in the happy-path demo.

---

## 3. Supporting Documents

The analyst uploads the following documents with the claim chart. These materials are the only evidence sources the AI may cite unless the analyst later adds more (see Edge Case 3).

---

### Document 1 — Engineering_Manual.pdf

| Field | Value |
| --- | --- |
| **Purpose** | Provide engineering-level detail on sensors, learning behavior, and onboard control logic |
| **Summary** | Describes the Acme Smart Thermostat hardware and firmware behavior, including occupancy sensing, temperature sensing, wireless connectivity modules, and Auto-Schedule preference learning based on historical setpoint adjustments |
| **Supports Claim Elements** | CE-2 (motion / occupancy sensing); CE-3 (preference learning over time); supports temperature sensing detail used in Scenario 3 |

**Key excerpts available to AI:**

- Motion / occupancy: built-in passive infrared motion sensor used to determine whether the premises are occupied and to adjust HVAC runtime accordingly
- Auto-Schedule: system records user setpoint changes over multiple days and updates recommended schedules based on observed preference patterns
- Temperature sensing: multi-point temperature sensor array used for ambient room temperature measurement

---

### Document 2 — Technical_Specification.pdf

| Field | Value |
| --- | --- |
| **Purpose** | Provide formal product specifications for feature mapping |
| **Summary** | Lists technical specifications for connectivity, sensors, and scheduling features of the Acme Corp Smart Thermostat |
| **Supports Claim Elements** | CE-1 (wireless / WiFi module); CE-2 (motion sensor); Scenario 3 (temperature sensor array) |

**Key excerpts available to AI:**

- Connectivity: IEEE 802.11 b/g/n WiFi module for home network communication
- Occupancy: “Built-in motion sensor detects when people are home.”
- Sensing: temperature sensor array with multiple thermistors for ambient measurement

---

### Document 3 — Product_Brochure.pdf

| Field | Value |
| --- | --- |
| **Purpose** | Provide marketing and product-page language currently cited in the draft claim chart |
| **Summary** | Consumer-facing brochure and product page copy for the Acme Smart Thermostat, including WiFi messaging and Auto-Schedule claims |
| **Supports Claim Elements** | CE-1 (WiFi-enabled messaging); CE-3 (Auto-Schedule marketing claim); weaker support only |

**Key excerpts available to AI:**

- “WiFi-enabled smart thermostat connects to your home network.”
- “Auto-Schedule learns your preferred temperatures.”

---

### Document 4 — Patent_US123456.pdf

| Field | Value |
| --- | --- |
| **Purpose** | Provide the asserted patent claim language for reference during refinement and claim construction discussion |
| **Summary** | Contains independent claim language corresponding to the three mapped elements: wireless communication module, motion sensor for occupancy detection, and machine learning of user temperature preferences over time |
| **Supports Claim Elements** | CE-1, CE-2, CE-3 (claim language reference; not accused-product evidence) |

---

## 4. Refinement Scenarios

All scenarios operate on the base claim chart above. Confidence scores are mock values for the prototype suggestion cards.

---

### Scenario 1 — Strengthen Evidence

**Target:** CE-2  
**User Prompt:**  
“Add technical documentation for the motion sensor claim.”

#### AI Response

I found stronger technical support for Claim Element 2 in Engineering_Manual.pdf and Technical_Specification.pdf. The current chart relies mainly on a high-level specification statement. I recommend adding engineering detail that expressly ties the built-in motion sensor to occupancy detection and HVAC control behavior.

#### Stronger Evidence

From Engineering_Manual.pdf:  
The Acme Smart Thermostat includes a built-in passive infrared motion sensor that detects occupant presence and uses occupancy state to adjust HVAC operation when people are home.

From Technical_Specification.pdf:  
“Built-in motion sensor detects when people are home.”

#### Updated Reasoning

The accused Acme Corp Smart Thermostat includes a built-in motion sensor that detects occupant presence. Technical_Specification.pdf expressly states that the motion sensor detects when people are home, and Engineering_Manual.pdf further explains that the sensor’s occupancy state is used to adjust HVAC operation. This evidence maps directly to the claimed “motion sensor for detecting occupancy.”

#### Confidence Score

**0.91**

#### Expected Analyst Action (Demo)

Accept — updates CE-2 evidence and reasoning.

---

### Scenario 2 — Fix Weak Reasoning *(Primary Demo Scenario)*

**Target:** CE-3  
**User Prompt:**  
“The AI reasoning for element 3 is vague. Add more specific technical analysis.”

#### AI Response

Agreed — the current reasoning for Claim Element 3 is speculative and relies on marketing language alone. Engineering_Manual.pdf describes how Auto-Schedule records historical setpoint changes and updates recommended schedules based on observed preference patterns. I recommend replacing the vague “suggests a machine learning algorithm” language with a more specific technical analysis grounded in that documentation.

#### Improved Reasoning

Acme’s Auto-Schedule feature learns user temperature preferences over time by recording historical setpoint adjustments and updating recommended schedules based on observed preference patterns, as described in Engineering_Manual.pdf. This adaptive scheduling behavior corresponds to the claimed machine learning algorithm that learns user temperature preferences over time. While the brochure uses consumer-facing “learns your preferred temperatures” language, the engineering manual supplies the operational detail needed to support the claim mapping.

#### Technical Evidence

From Engineering_Manual.pdf:  
Auto-Schedule records user setpoint changes over multiple days and updates recommended schedules based on observed preference patterns.

From Product_Brochure.pdf (supporting, secondary):  
“Auto-Schedule learns your preferred temperatures.”

#### Confidence Score

**0.88**

#### Expected Analyst Action (Demo)

Accept — replaces weak CE-3 reasoning and strengthens evidence. This is the primary happy-path demonstration.

---

### Scenario 3 — Add Missing Feature

**Target:** New proposed row (CE-4)  
**User Prompt:**  
“AI missed that Acme also has a temperature sensor array.”

#### AI Explanation

You are correct. The current claim chart does not include a row for Acme’s temperature sensor array. Technical_Specification.pdf and Engineering_Manual.pdf both describe a multi-point temperature sensor array used for ambient room temperature measurement. I can propose a new claim chart row for analyst review. Nothing will be added until you accept the suggestion.

#### Suggested New Claim Chart Row

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-4 *(proposed)* |
| **Patent Claim Element** | *(Analyst-supplied / AI-proposed mapping)* Temperature sensing capability associated with the temperature control device |
| **Accused Product Feature** | Acme Technical_Specification.pdf and Engineering_Manual.pdf describe a temperature sensor array with multiple thermistors for ambient room temperature measurement |
| **Proposed AI Reasoning** | The accused product includes a temperature sensor array that measures ambient room temperature as part of the thermostat’s temperature control function. This feature was omitted from the initial chart and should be considered for inclusion as supporting product evidence related to the temperature control device. |
| **Evidence Source** | Technical_Specification.pdf; Engineering_Manual.pdf |
| **Status** | Pending Review (not yet in chart) |

#### Supporting Evidence

From Technical_Specification.pdf:  
Temperature sensor array with multiple thermistors for ambient measurement.

From Engineering_Manual.pdf:  
Multi-point temperature sensor array used for ambient room temperature measurement.

#### Confidence Score

**0.84**

#### Expected Analyst Action (Demo)

Accept — adds CE-4 as a new row in the claim chart after review.

**Product rule:** The new row remains a suggestion until Accept. Reject leaves the chart at three elements.

---

### Scenario 4 — Clarify Legal Language

**Target:** CE-1  
**User Prompt:**  
“Rewrite the reasoning to address potential claim construction arguments.”

#### AI Response

I revised the reasoning for Claim Element 1 to better address claim construction risk around “wireless communication module.” The evidence citation remains unchanged. The update clarifies that WiFi network connectivity is a form of wireless communication and maps the accused product’s WiFi module to the claim term without overstating equivalence beyond the available evidence.

#### Updated Legal Reasoning

Under a plain meaning construction, a “wireless communication module” includes a module that enables communication without a wired connection. The Acme Corp Smart Thermostat is described as a WiFi-enabled device that connects to the home network. WiFi is a wireless networking technology; accordingly, the accused product’s WiFi capability satisfies this claim element as currently evidenced by the product page statement that the thermostat “connects to your home network.”

#### Evidence Change

**None.** Evidence remains Product_Brochure.pdf:  
“WiFi-enabled smart thermostat connects to your home network.”

#### Improved Legal Wording

- Addresses plain-meaning construction of “wireless communication module”
- Ties WiFi expressly to wireless communication
- Avoids unsupported technical overclaim

#### Confidence Score

**0.86**

#### Expected Analyst Action (Demo)

Accept — updates CE-1 reasoning only; evidence unchanged.

---

## 5. AI Suggestion Cards

Each refinement scenario produces one reviewable suggestion card. Status values used in the prototype: **Pending**, **Accepted**, **Rejected**.

---

### Suggestion Card S1 — Strengthen Evidence (CE-2)

| Field | Value |
| --- | --- |
| **Suggestion ID** | S1 |
| **Scenario** | Scenario 1 — Strengthen Evidence |
| **Target Claim Element** | CE-2 |
| **Original Reasoning** | Motion sensor explicitly mentioned in specifications directly maps to the claim element for occupancy detection. |
| **Updated Reasoning** | The accused Acme Corp Smart Thermostat includes a built-in motion sensor that detects occupant presence. Technical_Specification.pdf expressly states that the motion sensor detects when people are home, and Engineering_Manual.pdf further explains that the sensor’s occupancy state is used to adjust HVAC operation. This evidence maps directly to the claimed “motion sensor for detecting occupancy.” |
| **Evidence Citation** | Engineering_Manual.pdf — passive infrared motion sensor / occupancy-based HVAC adjustment; Technical_Specification.pdf — “Built-in motion sensor detects when people are home.” |
| **Confidence Score** | 0.91 |
| **Demo Status** | Accepted |

---

### Suggestion Card S2 — Fix Weak Reasoning (CE-3)

| Field | Value |
| --- | --- |
| **Suggestion ID** | S2 |
| **Scenario** | Scenario 2 — Fix Weak Reasoning *(Primary Demo)* |
| **Target Claim Element** | CE-3 |
| **Original Reasoning** | The learning behavior described suggests a machine learning algorithm, though technical implementation details are not disclosed. May need stronger technical evidence. |
| **Updated Reasoning** | Acme’s Auto-Schedule feature learns user temperature preferences over time by recording historical setpoint adjustments and updating recommended schedules based on observed preference patterns, as described in Engineering_Manual.pdf. This adaptive scheduling behavior corresponds to the claimed machine learning algorithm that learns user temperature preferences over time. While the brochure uses consumer-facing “learns your preferred temperatures” language, the engineering manual supplies the operational detail needed to support the claim mapping. |
| **Evidence Citation** | Engineering_Manual.pdf — Auto-Schedule records setpoint changes and updates schedules from observed preference patterns; Product_Brochure.pdf — “Auto-Schedule learns your preferred temperatures.” |
| **Confidence Score** | 0.88 |
| **Demo Status** | Accepted |

---

### Suggestion Card S3 — Add Missing Feature (CE-4 Proposed)

| Field | Value |
| --- | --- |
| **Suggestion ID** | S3 |
| **Scenario** | Scenario 3 — Add Missing Feature |
| **Target Claim Element** | CE-4 *(new row proposal)* |
| **Original Reasoning** | *(None — feature missing from initial chart)* |
| **Updated Reasoning** | The accused product includes a temperature sensor array that measures ambient room temperature as part of the thermostat’s temperature control function. This feature was omitted from the initial chart and should be considered for inclusion as supporting product evidence related to the temperature control device. |
| **Evidence Citation** | Technical_Specification.pdf — temperature sensor array with multiple thermistors; Engineering_Manual.pdf — multi-point temperature sensor array for ambient measurement |
| **Confidence Score** | 0.84 |
| **Demo Status** | Accepted |

---

### Suggestion Card S4 — Clarify Legal Language (CE-1)

| Field | Value |
| --- | --- |
| **Suggestion ID** | S4 |
| **Scenario** | Scenario 4 — Clarify Legal Language |
| **Target Claim Element** | CE-1 |
| **Original Reasoning** | The Acme device has WiFi capability which satisfies the wireless communication module requirement. |
| **Updated Reasoning** | Under a plain meaning construction, a “wireless communication module” includes a module that enables communication without a wired connection. The Acme Corp Smart Thermostat is described as a WiFi-enabled device that connects to the home network. WiFi is a wireless networking technology; accordingly, the accused product’s WiFi capability satisfies this claim element as currently evidenced by the product page statement that the thermostat “connects to your home network.” |
| **Evidence Citation** | Product_Brochure.pdf — “WiFi-enabled smart thermostat connects to your home network.” *(unchanged)* |
| **Confidence Score** | 0.86 |
| **Demo Status** | Accepted |

---

## 6. Edge Case Data

---

### Edge Case 1 — AI Provides Incorrect Evidence

**Context:** Analyst is refining CE-3 and asks for stronger technical support.

#### Original AI Suggestion (Incorrect)

| Field | Value |
| --- | --- |
| **Suggestion ID** | S-EC1-A |
| **Target Claim Element** | CE-3 |
| **Proposed Evidence** | Product_Brochure.pdf — “WiFi-enabled smart thermostat connects to your home network.” |
| **Proposed Reasoning** | Because the device connects over WiFi, it can learn user preferences through network-connected services, which supports the machine learning claim element. |
| **Confidence Score** | 0.62 |
| **Status** | Pending → Rejected / Corrected via Refine |

**Why this is wrong:** WiFi connectivity evidence relates to CE-1 (wireless communication), not to machine learning of temperature preferences.

#### Analyst Correction

“This evidence is wrong. WiFi connectivity does not prove machine learning. Use the Auto-Schedule section in the engineering manual instead.”

#### Updated AI Suggestion (Corrected)

| Field | Value |
| --- | --- |
| **Suggestion ID** | S-EC1-B |
| **Target Claim Element** | CE-3 |
| **Proposed Evidence** | Engineering_Manual.pdf — Auto-Schedule records user setpoint changes over multiple days and updates recommended schedules based on observed preference patterns |
| **Proposed Reasoning** | Same improved technical reasoning as Scenario 2 / Suggestion Card S2 |
| **Confidence Score** | 0.88 |
| **Status** | Pending → Accepted *(if used in demo instead of Scenario 2 direct path)* |

**Demo outcome:** Incorrect suggestion is not applied. Corrected suggestion may be accepted after review.

---

### Edge Case 2 — Undo Previous Refinement

**Context:** Analyst accepted Scenario 1 (CE-2 evidence strengthening), then decides the accepted update should not stand.

#### Accepted Refinement

| Field | Value |
| --- | --- |
| **Suggestion ID** | S1 |
| **Target Claim Element** | CE-2 |
| **Action** | Accept |
| **Claim Chart After Accept** | CE-2 displays strengthened evidence from Engineering_Manual.pdf and updated reasoning from Scenario 1 |

#### Undo Action

Analyst selects **Undo previous refinement**.

#### Restored Claim Chart (CE-2 only)

| Field | Restored Value |
| --- | --- |
| **Claim Element ID** | CE-2 |
| **Patent Claim Element** | A motion sensor for detecting occupancy |
| **Accused Product Feature** | Acme technical specifications document shows: "Built-in motion sensor detects when people are home." |
| **AI Reasoning** | Motion sensor explicitly mentioned in specifications directly maps to the claim element for occupancy detection. |
| **Evidence Source** | Technical_Specification.pdf — motion sensor / occupancy detection statement |
| **Status** | Needs Review |

**Session note:** “Undid accepted refinement for CE-2. Restored previous claim chart content.”

**Demo outcome:** CE-2 returns to the original uploaded state. Other accepted refinements remain unaffected.

---

### Edge Case 3 — AI Cannot Find Sufficient Evidence

**Context:** Analyst asks for technical proof of a feature not covered by the uploaded documents.

**Example User Prompt:**  
“Find evidence that the Acme thermostat uses reinforcement learning to optimize energy savings.”

#### Initial AI Response (No Fabrication)

I couldn't find sufficient technical evidence in the uploaded documents.

The current materials describe Auto-Schedule preference learning from historical setpoint changes, but they do not disclose reinforcement learning or energy-savings optimization based on that technique.

Please either:

1. **Upload another technical document**, or  
2. **Provide a product URL** for additional product information

#### Analyst Follow-up

Analyst provides a product URL:  
`https://www.acme-example.com/smart-thermostat/auto-schedule`

*(Mock URL for prototype purposes.)*

#### Follow-up AI Response (After Additional Information)

Thank you. Based on the additional product information, Auto-Schedule is described as adapting temperature schedules from prior user adjustments over time. I still do not see an express disclosure of reinforcement learning for energy optimization.

I can propose a narrower refinement limited to what the sources support: strengthening CE-3 around preference learning from historical setpoint behavior. I will not assert reinforcement learning without documentary support.

#### Resulting Suggestion Path

- System may offer a **limited CE-3 strengthening suggestion** aligned with Scenario 2, **or**
- System may leave CE-3 unchanged if the analyst declines

**Product rule:** Never invent citations. Uncertainty must remain visible until the analyst supplies usable evidence or accepts a narrower supported proposal.

---

## 7. Final Refined Claim Chart

Expected claim chart after all **accepted** happy-path refinements (Scenarios 1–4 accepted; Edge Case 2 undo **not** applied in the final export path).

**Matter:** US123456 vs. Acme Corp Thermostat  
**Final Element Count:** 4

---

### CE-1 — Wireless Communication Module

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-1 |
| **Patent Claim Element** | A temperature control device with a wireless communication module |
| **Accused Product Feature** | Acme Thermostat product page states: "WiFi-enabled smart thermostat connects to your home network." |
| **Updated Reasoning** | Under a plain meaning construction, a “wireless communication module” includes a module that enables communication without a wired connection. The Acme Corp Smart Thermostat is described as a WiFi-enabled device that connects to the home network. WiFi is a wireless networking technology; accordingly, the accused product’s WiFi capability satisfies this claim element as currently evidenced by the product page statement that the thermostat “connects to your home network.” |
| **Evidence Source** | Product_Brochure.pdf — “WiFi-enabled smart thermostat connects to your home network.” *(unchanged)* |
| **What Changed** | Reasoning clarified for claim construction; evidence unchanged |
| **Final Status** | Accepted |

---

### CE-2 — Motion Sensor for Occupancy

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-2 |
| **Patent Claim Element** | A motion sensor for detecting occupancy |
| **Accused Product Feature** | Acme technical specifications document shows: "Built-in motion sensor detects when people are home." |
| **Updated Reasoning** | The accused Acme Corp Smart Thermostat includes a built-in motion sensor that detects occupant presence. Technical_Specification.pdf expressly states that the motion sensor detects when people are home, and Engineering_Manual.pdf further explains that the sensor’s occupancy state is used to adjust HVAC operation. This evidence maps directly to the claimed “motion sensor for detecting occupancy.” |
| **Improved Evidence** | Engineering_Manual.pdf + Technical_Specification.pdf |
| **What Changed** | Stronger technical evidence and updated reasoning |
| **Final Status** | Accepted |

---

### CE-3 — Machine Learning / Preference Learning

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-3 |
| **Patent Claim Element** | Machine learning algorithm that learns user temperature preferences over time |
| **Accused Product Feature** | Acme marketing materials claim: "Auto-Schedule learns your preferred temperatures." |
| **Updated Reasoning** | Acme’s Auto-Schedule feature learns user temperature preferences over time by recording historical setpoint adjustments and updating recommended schedules based on observed preference patterns, as described in Engineering_Manual.pdf. This adaptive scheduling behavior corresponds to the claimed machine learning algorithm that learns user temperature preferences over time. While the brochure uses consumer-facing “learns your preferred temperatures” language, the engineering manual supplies the operational detail needed to support the claim mapping. |
| **Improved Evidence** | Engineering_Manual.pdf (primary); Product_Brochure.pdf (secondary) |
| **What Changed** | Weak speculative reasoning replaced with specific technical analysis |
| **Final Status** | Accepted |

---

### CE-4 — Temperature Sensor Array *(Newly Added)*

| Field | Value |
| --- | --- |
| **Claim Element ID** | CE-4 |
| **Patent Claim Element** | Temperature sensing capability associated with the temperature control device |
| **Accused Product Feature** | Acme Technical_Specification.pdf and Engineering_Manual.pdf describe a temperature sensor array with multiple thermistors for ambient room temperature measurement |
| **Updated Reasoning** | The accused product includes a temperature sensor array that measures ambient room temperature as part of the thermostat’s temperature control function. This feature was omitted from the initial chart and should be considered for inclusion as supporting product evidence related to the temperature control device. |
| **Evidence Source** | Technical_Specification.pdf; Engineering_Manual.pdf |
| **What Changed** | Newly added claim chart row after analyst acceptance of Scenario 3 |
| **Final Status** | Accepted |

---

## 8. Demo Dataset Summary

| Item | Value |
| --- | --- |
| **Patent** | US123456 |
| **Accused Product** | Acme Corp Smart Thermostat |
| **Matter Title** | US123456 vs. Acme Corp Thermostat |
| **Initial Claim Elements** | 3 |
| **Final Claim Elements (after accepted additions)** | 4 |
| **Supporting Documents** | 4 |
| **AI Refinement Scenarios** | 4 |
| **Edge Cases** | 3 |
| **AI Suggestion Cards (happy path)** | 4 |
| **Additional Edge-Case Suggestion Cards** | 2 (incorrect suggestion + corrected suggestion) |

### Document Inventory

1. Engineering_Manual.pdf  
2. Technical_Specification.pdf  
3. Product_Brochure.pdf  
4. Patent_US123456.pdf  

### Scenario Inventory

1. Strengthen Evidence — CE-2  
2. Fix Weak Reasoning — CE-3 *(primary demo)*  
3. Add Missing Feature — CE-4 proposed  
4. Clarify Legal Language — CE-1  

### Edge Case Inventory

1. Incorrect evidence (WiFi cited for ML claim) → analyst correction → revised suggestion  
2. Undo accepted CE-2 refinement → restore original CE-2 content  
3. Insufficient evidence → request document upload or product URL → narrower follow-up response  

---

## Consistency Rules for Prototype Implementation

1. **Do not alter** the three original patent claim elements, accused product feature quotes, or initial AI reasoning strings in the base claim chart.
2. CE-3 initial reasoning must remain weak until Scenario 2 (or Edge Case 1 correction path) is accepted.
3. AI may cite only uploaded documents (plus analyst-provided URL content in Edge Case 3).
4. No suggestion updates the claim chart unless the analyst accepts it.
5. Scenario 4 changes reasoning only; CE-1 evidence stays the same.
6. Scenario 3 adds a row only after Accept; Reject keeps the chart at three elements.
7. Undo restores only the last accepted change’s target element to its prior content.
8. Export uses the final accepted claim chart state only.
