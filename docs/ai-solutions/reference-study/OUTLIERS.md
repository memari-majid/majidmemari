# Outlier simulation design study

Reference: [Fine Destinations: Finding Outliers](https://simulations-6620.vercel.app/c/mktg-6620/outlier)
Observed: **2026-11-10**, authenticated browser UI, isolated study tab.
Purpose: preserve the learning and interaction design before access ends, so an original course can be built without reopening the reference.

## Scope and evidence standard

This is a systematic **finite-interface audit**, not a copy of the course or a claim that every possible numerical state was tested. All 11 concept families, all four business acts and the epilogue, all seven optional explanatory disclosures, and the complete 26-question challenge inventory were inspected. Representative correct, incorrect, boundary, reset, method-switching, and random-regeneration states were exercised. All 26 challenge responses were submitted, with a mixture of correct and deliberately incorrect choices, and all 26 visible feedback explanations were read. Alternative distractor branches were not enumerated. See [OUTLIERS_COVERAGE.json](OUTLIERS_COVERAGE.json) for the machine-readable record.

**Observed** means visible content or a verified UI change in this pass. **Reference claim** means the page said it; it was not independently validated. **Proposed implementation** means an original recipe, not knowledge of the reference's code. The previous repository review informed where to look, but the observations below were rechecked live. No source-code, hidden state, network payload, dataset export, or website mirror was inspected or saved. No reference prose, complete question bank, or dataset is reproduced here. Screenshots were used to inspect several visible details but no screenshot archive was created.

The initial attempt to create a child browser tab failed; the coordinating agent then provisioned a dedicated authenticated tab. This affected setup, not the completed content coverage.

## What makes the experience work

The lesson teaches one misconception at a time: unusual is not necessarily wrong; a value can distort its own measuring rule; individually ordinary values can form an unusual combination; a group can hide itself; a sparse but legitimate group is not necessarily anomalous; and a useful ranking still cannot choose a business action for you.

The order is **intuition → visible failure → mechanism → comparison → decision → missing context**. Each new method has a reason to exist because the learner has seen a limitation of the preceding one. Small diagrams are used to understand the mechanism; larger fixed datasets show the business consequence. A final decision makes the learner state an aim before revealing consequences that were absent from the numeric data.

This is the main pattern worth transferring. The exact hotel story, numerical examples, method sequence, and long mathematical scope are not necessary for Majid Memari's no-code course.

## Navigation and page architecture — observed

- One URL contains three selectable stages: conceptual learning, a business case, and practice. Each stage is a button in a named navigation region. The current stage has a filled purple number and tinted panel; previous stages can show a green check and a done label.
- The stages can be selected freely. Concept settings, case decisions, and answered challenge states survived moving between stages during this pass. The page says this preservation lasts while the page remains open; persistence after reload or across devices was not tested.
- The learning stage is a long vertical document: four part headings, eleven concept headings, numbered substeps, short explanatory paragraphs, interactive white cards, tables, formula disclosures, and a final capability recap plus forward action.
- The business stage progressively appends its next act, retaining previous acts for review. The decision sequence is visibly guided even though the top-level stages are open.
- Advancing from Learn marked it done; this was a navigation milestone, not evidence of concept mastery. Do not use the check icon as a grade in a new course.
- Practice is grouped by the same four conceptual parts, followed by two business-case transfer items. Its cards have four choices each. Two questions have a chart immediately above the card.
- Footer provenance is useful: the page distinguishes generated teaching data from lecture examples and states where computation occurs. Its claims of agreement with R were not independently verified here.

## Concept coverage and teaching purpose

| Concept family | Observed visual and control structure | Verified changed state | Transferable teaching move |
| --- | --- | --- | --- |
| 1. Meaning of an outlier | Selectable expense bars, legend, reveal and local restart | Selected one extreme and one ordinary claim; reveal distinguished checked/unseen items, legitimate unusual spending, and ordinary-looking misuse; restart restored the selection activity | Ask for an intuitive selection first, then distinguish screening from investigation |
| 2. Standard-deviation failure | One-dimensional dot plot, dashed interval, range slider, four live metric tiles, second response-curve chart, optional derivation | Keyboard endpoints changed the sixth observation and all rendered metrics; at the upper endpoint the band expanded and the extreme value remained unflagged | Let the learner try to defeat a rule and see why the rule cannot succeed in this setup |
| 3. Median and MAD | Sorted value chips with a median outline, corruption-count slider, mean/median log-scale chart, worked deviation table, robust/non-robust overlay, two explanatory disclosures across concepts 2–3 | The fifth corrupted value left the median unchanged; the sixth changed it sharply. Robust/non-robust comparison tested at low/high observation endpoints | Use a boundary crossing to show robustness; derive a formula from a small visible table |
| 4. Joint unusualness | Initial clickable person plot; choice reveals univariate strips, Euclidean circle, ranked table | A non-target initial choice was acknowledged without blocking; later person selection changed circle and distance explanation | Preserve the learner's intuition, then compare the evidence against it |
| 5. Covariance-aware distance | Covariance slider, equal-distance circle and tolerance ellipse, two fixed labeled points, live distances/count; selectable equal-distance ellipse for people, ranked table, optional worked calculation | Positive default and negative endpoint reversed which fixed point was unusual; selecting another person changed ellipse/explanation | Hold points' Euclidean distance fixed while changing the relationship that makes one combination unusual |
| 6. Masking | Growing office group, diamond identity, classical ellipse/centre, two flag counters | Group-size endpoint hid all office diamonds and also flagged an ordinary employee; contextual prompt changed with the state | Show both missed cases and newly created false alarms from the same flawed fit |
| 7. Robust covariance/MCD | Covariance presets and slider; ellipse/determinant; step/run/restart search; current subset vs next-fit ellipse; method toggles and group-size slider; correction disclosure and robust output table | All three covariance presets and an endpoint used; one search step, convergence, fresh random start, both flag modes, and zero/max office-group states observed | Separate mechanism, convergence, comparison, and real implementation caveats |
| 8. Local density/LOF | Four step buttons; clickable houses and grid locations; routes, neighborhood circles, incremental table columns, selected-house calculation, reset-location action; implementation disclosure | All four steps; moved focal house into the dense group, score changed toward parity; restored location; selected another house by keyboard | Keep identities stable while changing the neighborhood; reveal only the columns needed at each step |
| 9. Global/local comparison, K, LOOP | Same scatter under two methods, aggregate/subgroup flag counts; all six K presets plus median; score/probability mode; ring-size legend; formula disclosure | Global/local methods flagged different groups; all six K settings and median inspected; LOOP changed threshold language, ring meaning, and number flagged | A method disagreement can be a question about business context, not a contest with one universally correct model |
| 10. Random isolation mechanism | Manual cut and finish actions, numbered cut scatter, numbered tree, selectable employee path, growing forest table and average-path bars; reset/batch growth | One cut, finished tree, selected path, batch growth, reset, single whole-tree growth, and next-tree start exercised | Synchronize three representations of the same event: geometry, algorithm structure, and aggregate consequence |
| 11. Isolation at larger scale | Four forest-size presets, fresh-forest action, score-sized dots, focal identity marker, top-score labels, percentile-line metric, formula disclosure | One-tree default, 10/100/500 selections, regeneration at 100, changed scores and focal-ranking stability observed | Demonstrate instability before averaging, then show why repeated random evidence becomes steadier |

### Small statistical displays: design detail

**Observed:** The standard-deviation panel puts a moving observation on one plot and its standardized distance on a second plot. The second plot contains the threshold and a limiting-value annotation, so failure is explained as a whole relationship, not only one surprising number. The marker on the response curve follows the slider. The robust counterpart places both rule bands on the same axis, making moving and stable limits immediately comparable.

The median panel pairs three views: sorted values, summary numbers, and a response chart across possible corruption counts. Red value chips mean deliberately altered observations; the outlined middle chip indicates the median position. Those are different meanings and can coexist. The log scale is labeled; its purpose is to keep the enormous mean change and stable median visible together.

**Proposed adaptation:** Use this combination for an AI business estimate: individual observations, a summary metric, and a sensitivity chart. For example, show how one exceptional support case changes average effort while the median stays stable. Do not teach a summary statistic only as a formula or dashboard tile.

### Covariance and robust search: design detail

**Observed:** Equal-distance circle vs tilted ellipse makes the geometry visible. A centre cross, line style, labeled test points, and live numeric distances prevent the ellipse from being unexplained decoration. The masking exercise keeps a group visually identifiable with diamonds, even when its statistical flag disappears. The robust-method comparison overlays classical dashed and robust solid ellipses and switches flag semantics without hiding the other method's boundary.

The search uses Step, Run to the end, and New random start. The current subset, other records, office identity, and next subset's boundary are separately encoded. A round counter, determinant, and subgroup membership count accompany every step. At convergence, the narration explains that this start settled and that other starts can differ; it does not imply one animated run finds the unique global optimum.

**Proposed adaptation:** In a no-code business lesson, use the same current/next/best distinction for testing an AI workflow. A manual step could be one revision, a batch action could evaluate several independent cases, and the displayed metric should identify exactly which set it summarizes.

### Local-neighborhood mechanism: design detail and caveat

**Observed:** The four-step progression reveals neighbors, reachability, density, then the relative score. The plot, legend, table columns, and explanatory arithmetic all change with the current step. The focal house can be relocated by selecting empty grid positions; occupied positions select houses. A reset appears only after relocation. Selected-house calculations are personalized to that house, while the entire table remains available.

An expandable note explicitly distinguishes the simplified, grid-distance teaching construction from the R package's reachability definition and straight-line distance. The four-house arithmetic is therefore **not a general implementation specification for canonical LOF**. Preserve or improve this kind of disclosure in an original lesson. Validate the intended algorithm against authoritative definitions before implementing it; this audit did not do that validation.

The larger dataset preserves coordinates while the method changes. A global method marks a distant loose group; a local method can leave it unmarked because its members have similarly sparse neighbors. Subgroup counts and prose explain the consequence. The K panel deliberately exposes a borderline threshold case and demonstrates aggregation over nearby K settings. LOOP changes the legend and threshold units rather than merely relabeling a number.

### Isolation sequence: design detail

**Observed:** Each cut carries an order number that appears both on its scatter line and on its tree node. The current region is shaded, the selected variable's available range is shown as an axis band, and a compact explanation identifies the variable, its range, and the selected cut. A tree box means records are still together; a leaf means a record has been isolated. Clicking a record traces its path and connects to its aggregate bar.

No average is shown before a tree is complete. After many trees, the table keeps only recent rows and explicitly states how many older rows are omitted; the average still summarizes the whole forest. The scatter shows the most recently created tree, which is explicitly distinguished from the all-tree averages. This avoids an ambiguous mix of current and cumulative data.

At larger scale, the tree is replaced by score-sized dots and a few labeled extremes rather than attempting an unreadable full diagram. The percentile threshold is displayed separately from score computation. The lesson explicitly says a high score comes from a short average path.

**Animation evidence limit:** This pass observed discrete button-driven construction and changed geometry/state. It did not measure easing, frame timing, transition duration, animation implementation, or reduced-motion behavior. Treat timed-animation details as untested. Do not infer React, D3, SVG libraries, server rendering, or any specific component architecture from the visual result.

## Business case: all acts and debrief

### Act 1 — role, scarce capacity, competing aims

Observed opening: a named operational owner has a fixed number of personal responses and a larger weekly queue. The existing rule is stated. Two stakeholders emphasize different business outcomes. A short data dictionary and a few sample rows establish what is known and what is absent. One forward action reveals the next act. The learner has a concrete decision before encountering comparative methods.

### Act 2 — inspect the same records through progressively richer methods

Observed sequence: current-rule strip → univariate rule comparison → two-variable classical/robust comparison → four-variable comparison using two coordinated projections → choose a shortlist. Each comparison changes the legend, flag count and explanatory text. The pair of projections is explicitly described as the same records from different views.

Tested the existing baseline shortlist first: feedback explained the constituency it omitted and stated that the rest of the case would use the more inclusive list. Then selected the all-variable alternative and continued. A weaker choice did not dead-end the learner or silently alter the downstream teaching case. The two intermediate shortlist choice explanations were not independently opened; their method views were inspected.

### Act 3 — interpret groups before allocating action

Observed sequence: remove favorable unusual records from the complaints process, ask the learner to count visible complaint groups, reveal colored groups and a summary table, ask for labels that match each row. The distinction between favorable outlier and complaint directly reuses Concept 1.

Tested an incorrect five-group answer and then the intended three-group answer. Both opened explanatory evidence. Tested incorrect group labels and then corrected them. Wrong labels produced a corrective explanation tied to actual aggregate features, with permission to revise or continue using the explained labels. Correctness was not used as a navigation trap.

The group colors were **blue, purple, and green**, consistently repeated in plot legend, table row marker, and labeling block. These colors encode group identity; they do not mean good/bad or safe/unsafe. That distinction matters because green is used elsewhere for correct/completed states.

### Act 4 — allocate and state an aim

Observed allocation UI: three per-group counters, meaningful plus/minus button labels, total responses used, two live business totals, four selectable aims, a commit button, and a two-item completion checklist. Negative counts and exceeding global capacity are prevented with disabled controls. Every response belongs to a specific group; selection within a group follows a declared rule.

Tested commit with zero allocation/no aim: the stage did not advance and the unmet checklist remained visible. Allocated all capacity to one group, selected the matching aim, and committed. At total capacity, all increment buttons were disabled. On commit the counters became read-only, the selected aim became text, and the epilogue appeared. This pass tested the concentrated **20/0/0** allocation; the earlier repository review had tested a balanced **10/10/0** route. The decrement action and all other allocation combinations were not tested in this pass.

### Epilogue — numbers are necessary but incomplete

Observed debrief compares three plans: previous rule, learner allocation, and case protagonist's allocation. It shows different business totals instead of assigning a universal winning score. The prose restates the learner's chosen allocation and aim. Then later qualitative evidence reveals a common underlying policy issue, public-response behavior, and an important low-attention complaint. These facts were not available in the numeric features.

The final discussion asks whether the learner would revise the decision and what to add to the operational process. This is the course's most valuable business-design move: the model creates a list for investigation; content review, escalation rules, and authority to act complete the solution. For Majid's course, follow it with a concrete capstone artifact such as an exception policy, human-review queue, and escalation checklist.

## Challenge inventory and feedback

Observed **26 four-option cards**, divided as follows. The categories below describe coverage rather than reproduce prompts or answer keys.

| Coverage block | Count | Skills assessed |
| --- | ---: | --- |
| One-variable reasoning | 6 | Meaning of a flag, labeled-data suitability, self-inflating spread, median breakdown, MAD calculation, threshold interpretation |
| Joint-variable reasoning | 10 | Combinations vs individual features, units and relationships, ellipse interpretation, covariance adjustment, cutoff comparison, masking, determinant/compactness, robust subset logic, subset-size arithmetic, output-weight interpretation |
| Local methods | 5 | Local vs global patterns, score meaning, density arithmetic, sensitivity to neighborhood size, probability-oriented alternative |
| Isolation | 3 | What score summarizes, direction of score/path relationship, why average multiple random trees |
| Business transfer | 2 | Failure of a single-variable operational rule and explanation of masked complaints |

Submitted one answer to every card, including the two diagram items, arithmetic items, mechanisms, and business transfer. The final visible counters were 26 answered and 7 correct; deliberately incorrect choices were used to inspect correction behavior. All 26 explanations were read. The explanations span worked arithmetic, reasons a method does or does not apply, comparisons with alternatives, and explicit returns to earlier examples. They did not merely repeat the right choice. Each selected answer locked all four buttons for that card. Correct and incorrect labels were included in accessible button names, not conveyed by color alone. Wrong selections showed a cross/red treatment and separately marked the right option green with a check. Correct selections received confirmation and a reasoning paragraph. Explanations appeared in a status region and referred back to the lesson.

**Observed inconsistency to avoid:** the introduction says the practice is not scored, but after the first response it displays answered and correct counters. A new course should say “ungraded practice with a private self-check count,” or omit the correctness count. No external grade storage was inspected; “nothing is recorded” is a page claim, not a verified data-retention guarantee.

No per-card retry or overall challenge reset was observed after answering. Changing stages preserved the answer states. Do not imply immediate retries exist. All 26 feedback explanations were opened on one response path each. Alternative distractor branches and any post-reload retry behavior are untested.

**End-of-page completion color:** after the final unanswered card was answered, a pale-green capability recap with a graduation icon appeared below the last card. It summarized the acquired capabilities even though most submitted answers were intentionally wrong. Green here means the learning sequence has been completed, not a mastery threshold or a passing grade. Within the answer cards, pale green with a check denotes the correct option, pale red with a cross denotes the selected wrong option, and unused choices fade. The explanation itself has a neutral surface and a purple left rule. These are distinct semantic layers; reproduce their clarity, not the assumption that every green surface means the same thing.

## Visual grammar — observed, with limits

| Visual signal | Meaning observed | Implementation lesson |
| --- | --- | --- |
| Purple/indigo active controls and pale tinted prompt | Current stage, selected mode or instructional action | Reserve a consistent interactive accent; maintain contrast |
| Neutral gray marks | Ordinary/unselected/background observations | Keep reference observations visible while focusing attention |
| Amber focal point or diamond | Designated observation or focal entity | Identity is not equivalent to error status |
| Red/rust mark | Flagged observation or revealed adverse label, depending on local legend | Re-label legends when meaning changes; do not assume one global red meaning |
| Circle vs diamond | Ordinary employee vs named office cohort | Keep identity recognizable when flag color changes |
| Solid purple vs dashed gray boundary | Robust/active vs classical comparator in relevant plots | Line style supports color and lets both models coexist |
| Centre cross | Estimated center | Make fitted quantities visibly distinct from records |
| Dashed grid routes | Block-distance path to neighbors | Draw the calculation, not just its final number |
| Circle/ring size | Neighborhood extent, relative score, or anomaly score depending on panel | State units/meaning locally; never carry a size assumption between panels |
| Blue/purple/green group identity | Case complaint group | Repeat the same mapping in chart, table, labels and allocation |
| Green check/red cross in challenges | Correct/incorrect result | Pair color with icon and text |

The desktop reading column was centered with generous side margins, white rounded interaction cards, a very light background, thin borders, modest shadows, small uppercase labels, and restrained accent color. Paragraphs precede controls; charts have axes and units; legends sit close to charts. Metric tiles and short dynamic captions turn a changed picture into a stated result. Hover behavior was not systematically inspected.

A strong pattern is the **state-aware instruction strip**: it starts with an action, then changes to an observation or completion cue after the learner has changed the state. Some controls also appear only when useful: reset-location after moving the house, aggregate results after a complete tree, and forward action after sufficient participation.

## Accessibility observations and untested areas

Observed: named navigation; meaningful slider labels; keyboard Home/End/Arrow changes with rendered numerical updates; clickable chart marks exposed as buttons; keyboard Enter selected a house and updated its calculation; pressed/disabled states in the accessibility snapshot; chart image names describe axes or the tree state; tables expose header and cell structure; challenge feedback uses a status region and result text; line style/shape/labels supplement color in several diagrams.

Not assessed: full keyboard tab order, focus restoration after every reveal, a complete screen-reader journey, quantitative color-contrast compliance, zoom/reflow, touch targets, mobile layout, print mode, reduced-motion preferences, and high-contrast mode. The coordinating audit handles any separately documented responsive checks. Some plots expose summaries rather than every underlying observation, so do not claim equivalent nonvisual access to all data without an additional audit.

Tool caveat: range input value alone is not evidence of a working slider. This pass used keyboard actions and verified rendered captions/metrics, following the coordinating agent's warning about synthetic fill behavior.

## Design changes to make in an original no-code course

1. Keep the discovery-to-decision arc, but shorten the mathematical detour to the minimum needed for the business outcome. The reference's R snippets and matrix derivations are not appropriate default requirements for this audience.
2. Place one original simulation inside the existing Learn → Try → Build → Finish sequence. Preserve one learner path and one clear next action, rather than adding three parallel destinations.
3. Use business partner data only with agreed rights and privacy handling. For public demonstrations use original synthetic records and openly stated assumptions.
4. Keep model scores, uncertainty, observed outcomes, and actions as separate fields and separate visual signals. Never imply that a flag is a decision or that a model score is a calibrated probability of real wrongdoing.
5. Add a written decision artifact: objective, capacity, selection rule, exceptions, human review, deployment owner, monitoring signal, and a revision after the reveal.
6. Offer “why did this change?” through the embedded course TA, grounded in the same visible state and course explanation. The TA should not make up additional data or override the lesson's evidence limits.
7. Include replay and compare for alternative allocations in the new design. The reference showed a locked final choice; the audit did not find a post-commit edit control.
8. Validate statistical simplifications explicitly. The reference's own note separating the toy LOF mechanism from the package implementation is an important model for honest teaching.

## Original implementation approach

The following is a proposed way to build a new lesson with similar teaching depth. It is not a description of the reference's source code or hidden architecture.

Use an original business setting, such as a support team deciding which unusual requests need human review. Give each record a stable identifier and a small set of permitted, clearly labeled features. Keep the underlying observations fixed while the learner changes the screening method, threshold, or available review capacity. A record can be statistically unusual without being incorrect or harmful.

Separate four objects: observed data, derived screening outputs, the learner's allocation, and later qualitative evidence. Do not use the screening flag itself as ground truth. If the teaching case needs known outcome labels, disclose how those labels were created and whether they are synthetic. Keep unseen-context reveals in the instructional state, not mixed into the calculation before the learner is meant to know them.

A useful state shape is:

```text
LessonState
  phase: concepts | decision | transfer
  conceptStep: index
  method: supported method identifier
  parameters: threshold and selected features
  selectedRecord: stable identifier or none
  revealedContext: set of evidence identifiers
  allocation: record or group -> human-review slots
  decisionCommitted: boolean
  feedback: misconception identifier or none
```

Derive the chart, table, selected-record explanation, count of flags, and remaining capacity from that one state. A selected chart mark should select the same record in the table. A changed method should not silently select different data or change a denominator. Preserve the learner's prediction separately so the debrief can compare the initial reasoning with the final decision.

### Build the sequence around a misconception

1. Present a bounded decision, an owner, available information, and a scarce resource. Ask for an initial judgment before showing a model score.
2. Demonstrate one mechanism using a deliberately small, original dataset. Animate the computation only when the motion exposes a step the learner could otherwise miss.
3. Show a case where the simple rule is misleading. Ask the learner to identify the missing assumption before introducing a more suitable method.
4. Compare methods on the same observations and same decision budget. Display disagreements instead of declaring one method universally best.
5. Require a justified allocation. Show its opportunity cost and the people or cases left untreated.
6. Reveal additional context and ask whether the recommendation survives. A good debrief can revise a decision without pretending the earlier arithmetic was wrong.
7. Transfer to a new case with different costs or patterns. Require a short explanation, not just the remembered choice.

### Visual contracts

Use one stable mark per record. Explain what position, size, fill, outline, and connecting lines mean before expecting the learner to interpret them. Keep algorithm flags, selected cases, actual outcomes, and business actions visually distinct; they are different variables. Use shapes, labels, or patterns alongside color.

For changed geometry, show the old position briefly as an outline or ghost and the new position as the active mark. Explain whether points moved because the records changed or because the representation changed. If a threshold creates a region, label the rule and units directly. Avoid a chart that makes a mathematical boundary look like an ethical or operational permission boundary.

Provide the same record values and relevant score in a readable table. Let a keyboard user choose the method, advance steps, inspect a record, and make the allocation without dragging. Provide a manual step control and a static worked explanation for reduced-motion or no-animation use. These are requirements for the new implementation, not verified claims about the reference.

### Validation before reuse

Check that every record keeps its identifier across views; method changes preserve the input observations; displayed counts and denominators reconcile; allocations cannot exceed available capacity; and resetting an example restores only the reviewer's own test state. Independently verify the formulas on small known datasets and compare with a trusted implementation where appropriate. Test constant features, missing values, tied scores, boundary values, and zero available capacity.

A method's rank or score must not become a probability without a justified calibration step. A statistically extreme record must not automatically become a faulty record, fraud, or a customer deserving a consequential action. Distinguish the cost of a missed issue from the cost of an unnecessary review. State the scope of any simplified computation.

## Application to Building AI Solutions

The core transfer is a source-checking and exception-review lesson: AI can help rank or flag work, while a person supplies the context and authority to act. Useful applications include unusual support requests, inconsistent invoice fields, unexpectedly high delivery effort, or customer feedback that differs from the majority. Teach the full review process and its business consequences before introducing advanced outlier algorithms.

A single activity can belong inside Learn → Try → Build → Finish: explain the flag; inspect an original case; design the capstone's exception rule; then defend what the flag does and does not establish. Do not add a separate statistical-model curriculum unless a learning outcome requires it.
