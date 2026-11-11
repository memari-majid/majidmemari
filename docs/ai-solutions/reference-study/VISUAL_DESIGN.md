# Visual design and interaction grammar

Observed through the reference learner UI, November 10, 2026. Exact measurements below are a sample from the Forecast route at a desktop viewport, not a claim about every page or breakpoint. Proposed adaptations are marked separately.

## Observed hierarchy

The suite is an index, not a dashboard: one title, a short author line, and six large clickable rows. Each row combines a case name, method, time range and plain-language learning promise. There are no competing navigation panels. Inside a simulation, a compact stage strip sits above a single reading column. The substantive learning occurs in vertically ordered concept sections and case acts.

The observed Forecast column was at most 780 px wide, including 24 px horizontal padding. Its top/bottom padding was 48/96 px. The title was 26 px, weight 700, with 32.5 px line height. Body paragraphs sampled at 15 px and 24.3 px line height. The font stack was the operating system's sans serif. These are reference measurements, not requirements for the user's site; a slightly larger body size can improve comfortable reading.

Visual containment has levels:

1. Page canvas: warm near-white, sampled `rgb(247,247,245)`.
2. Concept sections: plain flow separated by whitespace and thin rules, not nested large cards.
3. Definitions: subdued neutral backgrounds and a small accent rule.
4. Figures: white surfaces with rounded corners, sampled at 16 px.
5. Interpretation: adjacent neutral callouts, with a warmer tinted takeaway callout.
6. Optional math: a bordered disclosure, with formulas contained inside it.

This is a useful answer to the user's concern about a busy course: reserve boxes for distinct learning functions, not every paragraph. Use one main action per local activity. Keep optional material collapsed until needed.

## Color means something locally

The reference uses a limited but not universally identical palette across its figures. In sampled Forecast charts, computed styles included blue `rgb(41,90,148)`, coral `rgb(184,67,43)`, neutral grids and muted text. Some captions call a current mark gold even where the sampled current styles are coral; do not reproduce that label/style mismatch. Define semantic roles once and derive both legends and captions from them.

| Meaning | Observed visual device | Reusable rule |
|---|---|---|
| Existing observations or baseline | Muted/blue/slate marks | Keep a stable neutral or primary tone |
| Current parameter, selected lag or changed model | Accent mark, thicker stroke, highlighted value | Add a label or outline; do not rely on hue |
| True class versus action taken | Class-colored mark plus a separate row shade/cutoff | Encode truth and policy on different channels |
| Outlier/exception | Contrasting mark, often red, with legend | Add shape and text; unusual does not automatically mean harmful |
| Group identity | Distinct group colors and labels | Keep identity stable across chart/table/debrief |
| Previous position | Outline/ghost mark and connector | Preserve the before-state during a transformation |
| Uncertainty | Nested translucent bands, labeled level | Distinguish ranges from the point estimate |
| Correct/incorrect choice | Check/cross, textual labels, color | Meaning survives grayscale and screen reading |
| Inactive/unselected context | Faded marks | Explain why context is faded; retain enough contrast |

Some business debriefs reuse earlier encodings so the learner can follow a segment or outcome from analysis to consequence; others, such as the Outliers epilogue, use a plain numerical comparison table. The value is continuity of identity and meaning, not universal color use or a particular university palette.

## Anatomy of a good figure

```text
Question or prediction
What one mark represents + how to read axes
Control with current value and units
Figure with stable axes, legend and selected-state cue
Exact numeric readout / accessible table
Explanation of this state
Business implication / next action
Optional formula and limitations
```

Keep the control near the figure it changes. A linked multi-panel activity can share one control, but each panel needs its own title and scale. Put units beside values rather than in a distant introduction. When a chart uses a changed scale, the explanation should explicitly direct attention to that fact.

The reference's small examples make mechanics visible: individual rows become colored cells, points move to centers, a cut on a scatterplot corresponds to a numbered tree node, and a selected month becomes values in an additive identity. Preserve IDs and colors through every representation so learners can track the same object.

## Feedback and pacing

The UI often changes the local instruction after an action: an invitation to try becomes an observation prompt or completion statement. This avoids leaving the original instruction on screen after it has already been satisfied.

The case acts progressively reveal new evidence. The learner first predicts or allocates, then sees an outcome, then confronts an interpretation or measurement problem. A later complication changes the decision rather than merely adding another chart. This produces a reason to continue.

There is no need to imitate the reference's longest pages exactly. For Building AI Solutions, keep the existing unit route, a compact visible progress indicator, a clear finish criterion, and one next action. Put the mechanism inside the lesson. A completed simulation should produce a sentence, table or policy for the capstone.

## Proposed theme contract for Majid Memari

Use the current shared cream/navy/teal tokens as the source of truth. Introduce an amber selection token and a coral exception token only where their meaning is explicit. Theme the course TA with the same typography, surface, spacing, focus and button components as the lesson. The website chatbot may serve a different purpose without changing the visual language.

Recommended functional tokens:

```text
canvas, surface, surfaceSubtle, text, textMuted, border,
primary, primaryText, selected, exception, success,
focusRing, chartGrid, uncertaintyInner, uncertaintyOuter
```

Do not assign a random brand color to every business discipline. Finance, Marketing, MBA, MIS and Operations use the same experience. Case names and content communicate context; consistent semantic color communicates evidence.

## Accessibility and responsive requirements for a new build

These are proposed acceptance requirements, not a claim that the reference passed an accessibility audit:

- Sliders work with keyboard and have named labels, units and visible values.
- Every interactive point has a keyboard/table alternative.
- The chart has a title/summary and an equivalent table or structured numerical explanation.
- Current state and feedback are exposed to assistive technology without reading the entire page after every change.
- Focus remains sensible after reveals, resets and stage changes.
- Animations can be stepped, paused, finished and reduced.
- At narrow widths, cards stack and controls wrap. Tables may scroll in a labeled region; the whole page should not require horizontal scrolling.
- Text remains readable at zoom; essential interpretation is not embedded only in an image.
- Color roles are redundant with labels/shapes; selected marks do not become illegible in light/dark surfaces.
- Print/export includes the learner's decision, settings, result and assumptions, not a screenshot alone.

The presence of accessible names in the reference is useful evidence, but it does not establish full keyboard, screen-reader or mobile accessibility. The study index records what was actually checked.

### Observed narrow-screen behavior

The suite and all six initial learning pages fit a measured 390 px document width at a 390 × 844 viewport. Cards/headings wrapped; wide tables and tree/grid figures retained internal overflow arrangements. A sampled Outliers figure scaled to 296 px wide and had SVG text bounding boxes as short as 6.5 px. Preserve the reference's restrained layout, but improve responsive chart labeling instead of shrinking all geometry and text together. See [coverage](COVERAGE.md) for the limits of this spot check.
