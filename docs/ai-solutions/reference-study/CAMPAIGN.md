# Campaign design study

Reference: https://simulations-6620.vercel.app/c/mktg-6620/campaign

## Evidence and coverage status

**Live UI review: November 10, 2026.** The reviewer used an isolated authenticated browser tab supplied by the root reviewer. Initial tab-creation problems were resolved before inspection. This document records the visible reference at the URL above, with a build recipe written independently in our own words. The earlier [reference analysis](../reference-analysis.md) supplied orientation, but the section inventory and tests below were inspected again in this pass.

Observed coverage: all three stages, the case modal, all eight concept sections, all seven optional mathematical disclosures, the three-act business path and result, all eight inline-check explanations, all seven challenge explanations and the completion message. At least **55 successful control activations** were exercised (a conservative tally of clicks and individual keyboard changes, excluding reading/screenshot calls). Every distinct observed control family was exercised. This is finite UI coverage, **not** exhaustive validation of every numerical setting, random draw, distractor, animation frame, or mathematical claim.

No proprietary source, hidden state, complete dataset, lesson copy, or question bank is preserved here. Numbers below are sparse diagnostic observations that identify behavior. The component/state proposals later in this file are original recommendations, not descriptions of the reference's implementation internals.

## Observed page structure

The page has a return link, a small course label, a large activity title, a short business-context subtitle, and a persistent case-file button. A horizontal three-stage navigation separates learning, applied business decisions, and checks. The stages are freely selectable; the UI states that progress lasts while the page stays open. Revisiting Learn after the business and challenge stages retained the changed sliders, opened explanations, and locked quiz feedback. Reload persistence was not tested.

Learn is a long, ordered document with eight concept jump buttons and generous separators. Each concept uses a recurring rhythm: short explanation → definition or callout → manipulation/figure → explanation of what to notice → optional mathematics → four-choice check. There is an explicit next-stage button at the end. All jump targets were inventoried; one representative jump was activated and verified after its smooth scroll settled with the target heading near the viewport top. Other individual jump targets were not separately tested.

The case modal is a compact business brief: setting, commercial reason for the task, acquisition expense, competitor context, available variables, decision, and a synthetic-data disclosure. It has a named dialog and a close button that receives focus on opening. Both open and close were exercised. Focus trapping and Escape behavior were not tested.

## Learn: complete finite section inventory

| Section | Representation and instructional role | Live actions and observed outcome |
|---|---|---|
| 1. Binary outcome versus straight-line prediction | A scatter/line plot places historical outcomes on two levels. Shaded out-of-range bands make impossible probability predictions visible. A second curve is introduced only on demand. | Revealed the bounded curve; the button became a hide action and explanatory prose appeared. Chose an incorrect check answer: all options locked, wrong selection and correct alternative were explicitly named, and a mechanism explanation appeared. |
| 2. Probability, odds, log-odds | A single probability control updates three adjacent numerical tiles, preserving one situation across three scales. | Keyboard End and Home produced 99% and 1%; corresponding odds/log-odds changed to about 99/+4.60 and 0.01/−4.60. The endpoints avoid undefined infinite values. A correct check produced positive feedback plus reasoning. |
| 3. Intercept and slope | Two controls affect a fitted curve, an odds-multiplier tile, and a probability at a named input. The text introduces fitting after interpretation. | Moved both controls to their minima. The displayed multiplier fell below one and the example probability approached zero; the negative-slope case is allowed. Zero-slope and all intermediate configurations were not separately tested. |
| 4. Reading an odds multiplier | Four tiles compare current odds, fixed multiplier, next odds, and the probability-point difference. This distinguishes constant multiplicative odds change from a variable probability change. | Moved spending to the upper endpoint. The odds multiplier stayed fixed while the probability gain became about three points. The controls in this example are independent of the adjustable coefficient example above. |
| 5. Threshold and errors | A small ranked set is readable row by row. Outcome bar fill and action row shading are distinct. A threshold line separates acted-on and skipped rows. A four-cell outcome matrix repeats record names. A second plot scales the idea to the large population. | Raised the threshold to its maximum: all small-example rows became skipped, matrix cells changed to zero selected actions, and the same cutoff changed the rate and ROC sections below. Lowering it to the minimum selected the whole small example. No row/cell click affordance was established; linked recalculation was observed, not selectable cross-highlighting. |
| 6. Precision and recall | Separate groups of initial-marked people make the two denominators visible. Formulas are adjacent to plain-language questions. | Same shared threshold. At no actions, precision became an em dash with an explicit zero-denominator explanation; recall became zero. At all actions, precision was about 42% and recall 100%. |
| 7. ROC and AUC | Threshold position moves a highlighted operating marker; a diagonal baseline anchors interpretation. A reveal adds area shading. A random positive/negative pair gives a second explanation of ranking performance. | Revealed area; drew three pairs in the main pass and one in the follow-up, watched cumulative successes/attempts update, and verified that Reset removed the pair and running tally. All four sampled comparisons happened to be correctly ranked, so an incorrect sampled pair was not observed. |
| 8. Overfitting and generalization | Fitted curve, training observations, optional unseen observations, and optional underlying pattern share one plot. A second error-versus-complexity plot ties the local example to a general pattern. | Opened unseen-data and truth layers, set complexity to 12, and sampled again. Training/test errors were 1.6/40.2 before and 2.8/43.7 after that sample; the high-flexibility fit visibly moved. These are observed examples, not an independent refit or proof of monotonic error behavior. |

Seven math disclosures were opened and read: limitations of linear probability prediction; logit conversion; likelihood estimation; odds multiplier derivation; conditional-rate denominators and majority-class accuracy; construction of ROC and pairwise AUC; bias/variance and holdout evaluation. Their role is progressive disclosure: the main path remains explanatory and visual, and notation is available at the point it answers a question.

Observed slider attributes (read from the rendered controls): probability 0.01–0.99 by 0.01; intercept −6–2 by 0.05; slope −0.5–1.6 by 0.01; spending 50–1,100 by 10; three synchronized learning thresholds 0.03–0.95 by 0.01; complexity 1–12 by 1. These ranges describe this reference only; they are not defaults to copy into our course.

## Applied business stage: observed progression

1. **Establish the naive baseline.** The brief exposes population, contact cost, and sale revenue. One action reveals mailing the entire population, its costs/revenue, its loss, and a plain-language expected-value explanation. Revealing a bad baseline creates the reason for the model.
2. **Fit and interpret a useful score.** Three predictor toggles change a compact results table (coefficient, odds multiplier, test statistic/significance) plus ranking/fit tiles and a prose interpretation. All three toggles were turned off: the output changed to an explicit no-model state and continuation disappeared. One predictor was restored and continuation returned. Three-variable and one-variable outputs were inspected; other nonempty combinations were not independently compared.
3. **Choose an operating policy.** A threshold controls a money-annotated error matrix, action volume, precision/recall, profit, a profit-versus-cutoff curve, and a separate ROC. The profit figure uses a hollow current marker and a green optimum marker. The optimum is visible geometrically before the numeric reveal, so the activity is guided exploration rather than an unaided search.
4. **Reveal and interpret the result.** A reveal compares the learner cutoff, empirical best cutoff, gap, and economic break-even. It explains why a conventional 50% classification cutoff need not maximize business value. Earlier controls remain available for trying a different predictor set and cutoff. The path ends in a challenge continuation button.

Sparse reconciliation observations: the full-population baseline displayed $140,700 revenue and $200,000 outreach expense, a $59,300 loss. With one predictor and a 1% cutoff, the policy reproduced that baseline. At a 90% cutoff it selected nine observed buyers, yielding $2,340 net under the supplied assumptions. These reconcile arithmetically; the fitted probabilities and optimizer were not independently reproduced. The example's empirical best cutoff was near, but not identical to, its analytical break-even. Do not describe finite-sample realized maxima as a guaranteed future economic optimum.

## Checks, feedback, and ending

The learning path contains eight four-choice checks (one per concept); all eight explanations were revealed and inspected across the main and follow-up passes. Correct and incorrect selection styles were both tested; every possible distractor was not tested. The challenge stage contains seven four-choice checks. All seven were answered and their explanations inspected; one was deliberately incorrect. Their topics are coefficient interpretation, cost changes, misleading accuracy, precision/recall tradeoff, ranking versus profit, odds versus probability, and an integrated recommendation. This topic inventory intentionally does not preserve the question bank or answer key.

Feedback is immediate after commitment. All alternatives become disabled; the chosen wrong answer receives a cross and a textual incorrect label, while the correct answer gets a check and textual label. Explanations live in a status region. A small progress summary appears after answering and counts both answered and correct responses, despite the introductory wording calling the work ungraded/unscored. Completing all seven reveals an outcome recap and the main decision principle. No quiz retry/reset control was visible. Leaving and returning to the stage preserves answers in the current page session.

## Visual and accessibility observations

Observed styling is restrained: a centered reading column; warm light-gray page; white rounded experiment cards; thin borders/shadows; black/charcoal text; muted secondary copy; small uppercase category labels; crimson primary controls and accent rules. Figures use labeled axes and relatively quiet gridlines. Small definition panels, numbered steps, and icons break a long page into interpretable blocks.

Semantic color is local and explained. In the ranked customer display, green bars encode actual positive outcomes and gray bars negative outcomes; shaded rows encode contact action. In the business matrix, pale green is used for the two correct decision/outcome combinations and pale rose for the two errors, alongside labels, counts, and money. The selected ROC point is gold. In the overfitting plot, training points are dark filled circles, unseen points are gold outlined circles, the fit is crimson, and revealed truth is dashed gray. Color alone is not asked to carry the entire distinction.

Observed accessibility support: named sliders, keyboard Home/End changed real rendered outputs; named stage navigation; accessible chart images with axis descriptions; answer groups named by question; textual correctness labels; feedback status regions; modal accessible name. This is not a full accessibility pass: tab order, focus visibility throughout, contrast ratios, screen-reader announcements of dynamic figures, modal trap, zoom, mobile, and reduced motion remain untested. Small chart texts and multiple adjacent tiles deserve explicit verification in the new build.

## Scientific and instructional cautions when transferring

These are reviewer inferences from visible explanations, not claims about unseen code:

- A predicted purchasing probability does not establish which person is persuadable. Some prose moves from association with spending to marketing influence. Our course must distinguish propensity from causal treatment uplift, and ask for an experiment before claiming incremental sales.
- A classifier's money display assumes the outcome and payoff model supplied by the lesson. In a real project, use incremental contribution, delivery costs, constraints, and baseline behavior rather than revenue alone.
- Changing a threshold makes false positives nonincreasing and false negatives nondecreasing on a fixed scored sample; either may remain unchanged between adjacent score values. Avoid promising a strict change at every movement.
- Precision itself need not rise monotonically with a higher threshold in a finite sample: removing a true positive can lower it. Use the actual counts rather than a universal direction-of-change slogan.
- AUC summarizes ranking, not calibration or value at a specific policy. Tied positive/negative scores require half-credit in its pairwise interpretation; a strict greater-than formulation alone omits that case. Include these limitations explicitly.
- Optional formal claims and data-fitting statements were read, not audited against external software. Treat claims of solver equivalence as the reference author's assertions.

## Transferable interaction patterns

### One control with several consistent consequences

A threshold input should be presented beside the decision it controls. On every update, derive the selected records, correct and incorrect decisions, rates, cost, and operating-point marker from one validated calculation. The table and figures should never calculate their own versions independently.

An optional enhancement for our original build is to let a learner select a person in the table or a cell in the error matrix. That affordance was not established in the reference audit. That selection should identify the same records in the other view. Keep a visible selected-state outline and a text description. A colored dot can indicate observed outcome while a separate border or region indicates the decision. Those two meanings must not be conflated.

### Probability, decision, and value remain different

An estimated probability is not a decision. A threshold transforms the estimate into an action. A consequence model then values that action. Teaching them in this order makes it possible to ask why two businesses with identical model scores could choose different policies.

The business figure should retain a simple policy such as contact nobody, contact everybody, or a documented rule. Model performance without a baseline can make a weak intervention look impressive. Use the same eligible population and cost assumptions for every policy comparison.

### Reveal after commitment

Ask for an initial recommendation before displaying the complete financial consequence. Keep the prediction visible after the reveal. Feedback should explain the reasoning error, such as prioritizing classification accuracy when an error type has a much larger business cost. Allow revision without erasing the original reasoning.

### A final debrief narrows the claim

The end should state what the supplied calculation supports, what was assumed, and what evidence could change the decision. A profitable teaching scenario does not establish causal lift, acquisition willingness, operational capacity, or future performance. The learner’s next artifact should be a bounded test proposal, not a claim that a business has already succeeded.

## Original implementation recipe

This recipe uses an independently authored business case and fresh data. It reproduces a teaching pattern rather than the reference’s wording, numbers, or interface implementation.

Suggested component structure:

```text
CaseBrief
PredictionCommitment
MechanismLesson
  ProbabilityExplanation
  OptionalOddsDetail
DecisionExperiment
  ThresholdControl
  RecordTable
  DecisionOutcomeMatrix
  ConditionalRateSummary
  OperatingPointPlot
BusinessComparison
  PolicySelector
  CostAssumptions
  ConsequenceTable
EvidenceReveal
DecisionDebrief
ProjectTransfer
```

Suggested state:

```text
caseVersion
stage
threshold
selectedRecordIds
selectedOutcomeCell
predictionAndReason
revealsOpened
businessPolicy
costScenario
recommendationAndReason
```

Keep supplied records immutable. Each record needs a stable identifier, a model estimate, an observed outcome for the evaluation example, and permitted decision-relevant fields. A selector should return derived results from the current threshold. A separate selector should calculate the value of a chosen policy. Do not store redundant totals that can drift out of sync.

```text
on threshold change:
  validate and clamp the input
  derive actions for the unchanged eligible records
  derive the outcome matrix and conditional rates
  derive the cost and benefit under labeled assumptions
  update the table, matrix, marker, metrics, and explanation
  announce the changed decision summary without moving focus
```

Use honest empty states. If no record is selected, a precision-like rate has no denominator; show “not defined” with an explanation instead of displaying zero as if it were observed performance. Handle all-selected and none-selected states explicitly. Boundary conditions are part of the lesson, not merely technical error cases.

The underlying assessment should test transfer. For example, change an error cost or capacity limit while retaining the score distribution, then ask whether the original policy remains sensible. Feedback should distinguish a numerical error, a wrong denominator, an unsupported causal claim, and a defensible preference under an explicitly different objective.

## Visual semantics to specify before coding

The live review confirms the local color meanings above. Exact color values and contrast compliance were not measured. An original implementation should use a documented semantic token set rather than guessing the reference’s palette:

- observed outcome: stable fill plus a shape or label;
- selected action: outline, row emphasis, or marked region;
- current threshold: a labeled line or handle;
- selected operating point: a distinct marker and coordinate text;
- error type: explicit name and icon as well as color;
- baseline: subdued but legible styling and a direct label;
- hypothetical scenario: a persistent assumption label.

Describe axes, denominators, and population beside the chart. Animation is useful when it makes a record’s change in classification visible. It should not move all records arbitrarily, change the axis silently, or delay access to the resulting table.

## Acceptance checks for an original build

1. Threshold changes preserve record identities and observed outcomes.
2. Matrix counts sum to the eligible sample; selected and unselected counts reconcile.
3. Every rate names its numerator and denominator; undefined rates are handled honestly.
4. The point on a threshold plot agrees with the displayed rates.
5. Business totals reconcile with the selected actions and declared costs.
6. The baseline and proposed policy use the same population and period.
7. A selected record is linked across table and figure using a noncolor cue.
8. Keyboard users can set the threshold and inspect the same evidence without dragging.
9. Reduced motion provides the complete result immediately or permits manual stepping.
10. Text and tables remain usable when animation, hover, or the optional TA is unavailable.
11. A changed assumption produces appropriate explanatory feedback, not just different numbers.
12. The debrief distinguishes sample performance, modeled value, and evidence still needed.

## Application to Building AI Solutions

Use this pattern for a business team deciding which AI-generated outputs need review, which customer requests deserve a human follow-up, or which pilot opportunities fit a capacity constraint. The required learning is setting a defensible decision rule and understanding error costs. Logistic regression implementation can remain optional; students need not program or train the model.

The strongest transfer is a single evidence-to-decision panel inside Try, followed by a Build task that specifies the project’s own quality boundary, review capacity, cost assumptions, and next test. It should replace overlapping practice rather than add a separate analytics course.
