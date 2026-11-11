# Clustering simulation — design and interaction study

Reference: [Western Food](https://simulations-6620.vercel.app/c/mktg-6620/clustering), within the [reference suite](https://simulations-6620.vercel.app/suite). Fresh browser inspection: 2026-11-10. These are original notes about teaching design and observable behavior, not copied lesson prose, data, questions, source, or a course mirror.

## Evidence boundary

Observed all nine Learn concepts, all five optional math disclosures, four business acts and the final strategic debrief, and all 21 Challenge items with feedback. Exercised each distinct interaction family: direct placement, direct drag, sliders, categorical toggles, axis selection, stepwise iteration, automatic completion, reset/reseed, point selection, naming, objective/target commitment, stage navigation, and correct/incorrect feedback.

This is not an exhaustive test of every coordinate, starting configuration, group count, answer alternative, or mathematical claim. Only rendered interface evidence was used. Statements about R and validation are the page's claims, not an independent review of its computation. No hidden application state or implementation source was inspected.

A browser-surface issue after leaving and re-entering the page produced a zero-width screenshot and ineffective interactions. A new dedicated tab restored normal operation. This is an audit-tool limitation, not evidence of an application defect or of reload persistence. The naming-retry problem below was observed separately, before that issue.

## The learning arc

The three top-level stages are Learn, Western Food, and Challenge. They share typography and a plum accent. Current/visited states use both text and marks. Stage buttons allow a fresh learner to enter the case directly; a stage checkmark does not establish mastery. Tested business choices remained when returning from Challenge.

The sequence begins with human grouping, turns that intuition into an alternating procedure, asks what distance means, demonstrates why scale changes the answer, and then introduces diagnostics and exceptions. It ends by separating a useful description from a profitable or strategically appropriate action. This is stronger than a gallery of isolated controls: each interaction supplies a reason for the next one.

No inline multiple-choice check groups appeared in the nine Learn concepts. Instead, Learn uses commitment, manipulation, context-sensitive explanations, and optional mathematics. The formal 21-item practice appears in Challenge, organized into nine topic groups. Four challenge items require reading a supplied chart or table.

## Complete Learn inventory

| Concept | Mechanism and representations | What was actually tested |
|---|---|---|
| 1. Manual grouping | A simple two-axis shopper scatter accepts up to four centre markers. Points join the nearest marker, with connecting lines and group counts. Locking an attempt appends an attempt summary and clears the working markers. | Placed three centres near visible clumps, observed three assigned groups, and locked the attempt. The retained summary records group count and sizes; the interpretation connects this manual operation to half of k-means. The separate Clear control was observed, but not exercised before locking. |
| 2. Multiple plausible groupings | Two/three-group buttons recolor the same records and report sizes. Definitions of point, distance, group, and centre follow the example. | Switched from three to two. One visible clump merged with another; the explanation stressed that the requested group count constrains the answer. |
| 3. Assignment/movement loop | Distinct assign and move buttons, connecting lines, centre motion, objective bar/number, automatic run, reseed, contextual completion explanation. | Assignment then movement changed the objective from roughly 19.0 million to 11.3 million. Automatic run settled after three rounds around 2.12 million; controls that cannot change the answer disabled. Reseeding reset the current loop while retaining the previous completed-score comparison. This is an objective trace, not a business-profit score. |
| 4. Distance geometry | Two draggable circles; straight and stepped paths; Euclidean/Manhattan/Minkowski tiles; p range. | Changed p from two to one. Dragged one circle to align the two records on an axis; both distances became equal and the explanation changed to describe that boundary case. The geometry and numeric formula are linked. |
| 5. Feature scaling | Department-share bars, raw/scaled toggle, independent horizontal/vertical department selectors, recolored four-dimensional grouping projected onto two axes. | Switched to scaled data and changed axes to the lower-dollar departments. Shares became equal, group count changed, and a previously obscured segment became interpretable. The note explains that projection can hide a group even when it exists in the full feature space. |
| 6. Group-count evaluation | Selected-shopper range; within/nearest-other distance tiles; arithmetic; per-shopper silhouette bars grouped by segment; overall average; k range; comparative scaled/raw lines. | Selected the last shopper and moved group count to the maximum displayed value; enabled the raw-dollar comparison. A near-zero individual score received an uncertainty interpretation, while the summary line showed the deterioration from excessive groups. The two preprocessing choices favored different counts. |
| 7. Mean versus real representative | Small group, draggable outlier, labeled mean ring and medoid square, coordinate tiles, context-sensitive separation explanation, method-score comparison. | Dragged the outlier toward a far corner. The mean moved; the selected real representative stayed in the crowd. Shapes and labels supplement color. The lesson compares the two methods on its larger case rather than claiming the robust choice always wins. |
| 8. Nonlinear shape | Same nested-ring points, plain/kernel toggle, recoloring, counts matched to the constructed groups. | Switched to the kernel result; the visible grouping separated the rings far more closely. The explanation distinguishes an unsuitable shape assumption from a poor start. Mathematical and algorithmic claims were read, not independently validated. |
| 9. Soft membership | Three information states for book prices; overlapping density curves; linked membership scatter; two-step share/move loop; run-to-end/reset; selectable record and worked explanation; uncertainty counts. | Viewed known averages and unlabeled prices, stepped each phase, automatically converged, selected a different book, and reset. The selected book changed both highlighted curve positions and numerical explanation. Completion retained ambiguous books instead of pretending all labels were certain. The larger business case receives a second-method comparison and an uncertainty list. |

All five math panels were opened: squared-distance objective, Euclidean/Manhattan/generalized distance, silhouette arithmetic, kernel-distance explanation, and weighted soft-membership updates. Their role is to connect visible operations to notation after intuition. A no-code business course can preserve the layering while keeping specialized derivations optional.

## Business case: four acts and a strategic debrief

1. **A decision with a deadline and disagreement.** A named manager must choose one campaign for one segment. Two stakeholders offer different reasonable objectives: strengthen an existing market position or change customer behavior. Limited funds and timing make the choice concrete. This establishes disagreement before the model supplies evidence.
2. **Choose a representation and group count.** A silhouette figure changes under raw/scaled data. Buttons ask the learner for a count. A deliberately smaller choice produced a tradeoff explanation, but the subsequent case explicitly continues with four groups. It is a reflective choice, not a fully branching simulation. One observed mismatch deserves review: after selecting two while raw dollars were displayed, the feedback compared a scaled-data score with the scaled four-group score; the scope was not explicit in that sentence. Avoid comparing scores from different representations without labeling them.
3. **Interpret and name the groups.** A table combines membership counts, dollars, and high/medium/low descriptors across four departments. The learner assigns one business description to each group. Successful naming converts anonymous clusters into profiles that can support an offer. A wrong swapped permutation was also tested and yielded a targeted hint about reading a department-relative difference, rather than simply returning a score.
4. **State an objective before choosing a target.** The learner selects either reputation development or current-year money, then one segment. A simulated commit action reveals the aftermath. Both a current-year objective with one segment and a reputation objective with another were tested. Once the aftermath was revealed, changing the choices updated its personalized text and row highlight immediately; a second click on the commit button was not required to see the revised identity.

The final table compares all four candidates on two outcome columns rather than declaring one universal winner. One segment maximizes profit, another maximizes strategic sales growth. The explanation identifies the assumed substitution between product categories. It then gives an alternative assumption under which the ranking changes, and proposes testing the missing behavior instead of doing more clustering. It contrasts a safe short-run return with a longer-run strategic choice and asks what the learner would measure next.

That final move is the main transferable lesson: a segmentation describes customers; estimated response and commercial objectives determine action. A complete business course should carry the student from model output into an experiment, partner decision, deployment plan, or sales test.

## End-of-page color semantics

The final comparison was inspected visually and through rendered element styles:

- The selected segment's entire row is pale plum (`#f3eaf1`) and explicitly labeled as the learner's choice. Plum therefore signals selection, not correctness.
- Green (`#2f7d2b`) highlights the best number **within each outcome column**. Two different rows receive it, exposing the tradeoff. It is not simply the color for every positive profit; other positive profits stay in normal dark text. The negative result was also ordinary dark text, with its minus sign carrying meaning.
- Amber-tinted callouts discuss tradeoffs and an unsettled assumption. Their icon/title and prose remain necessary to interpret them.
- The final challenge's profile table uses amber for a department-high value and grey for a low value; its caption defines this relative-to-department comparison. These colors do not mean profit or loss.
- The scaling challenge uses plum raw-data bars versus amber scaled bars, with an amber dashed equal-share reference. Its silhouette challenge uses a solid plum scaled line versus a dashed amber raw line. The local legend is essential because colors serve different roles across figures.

The surrounding system uses a warm off-white canvas, a constrained reading column, dark sans-serif text, rounded white panels, restrained borders/shadows, generous vertical gaps, numbered substeps, and small uppercase section labels. Buttons use filled plum for selected/primary states and pale/muted treatment when disabled. Figures have visible axis units and prose reading guides immediately before them.

In the soft-membership panel, blue/brown distinguish two groups; a dashed vertical selected-price line links density and membership views, and the selected point is larger. The worked explanation sits in a pale-plum panel; completed convergence uses a green callout. These are teaching cues, not decoration.

## Challenge inventory and feedback

All 21 questions were answered once and all 21 explanations inspected, including deliberately incorrect responses. Preserve the assessment coverage, not the wording:

| Topic group | Items | Diagnostic target |
|---|---:|---|
| Nature of grouping | 2 | Unlabeled structure; within/between similarity rather than equal sizes |
| Alternating loop | 3 | Assignment/movement; stopping condition; dependence on initial centres |
| Distance | 2 | Multivariable distance; effect of a large difference |
| Scaling | 3 | Read unequal influence; standardization; consequences for a hidden segment |
| Choosing group count | 3 | Individual silhouette; comparing curves; interpreting a moderate score |
| Robust representative | 2 | Mean versus real member; practical significance of near-tied scores |
| Nonlinear grouping | 2 | Read a failed boundary; distinguish representation from initialization |
| Soft groups | 2 | Membership uncertainty; agreement between methods as support, not proof |
| Business use | 2 | Read segment size/profile; distinguish description from response/profit |

Four items embed a chart or table immediately above the question: department influence bars, silhouette curves, a wrongly partitioned ring scatter, and a segment-profile table. Each figure explains its marks before asking the learner to interpret them.

After commitment, all four choices lock. The selected incorrect choice and correct choice receive symbols and explanatory text. Both correct and incorrect paths reveal a substantial rationale, often explaining why attractive distractors fail. There is no visible aggregate score or grade. The narrative sometimes states conclusions too categorically; these are not automatically validated statistical truths. For an original course, avoid treating a silhouette threshold as universal proof of genuine groups, equal method scores as proof of no outliers, or scaling as universally correct regardless of business meaning.

## Observed retry problem to avoid

In the first case run, two profile names were swapped while the other two were correct. After all names were used, the page asked the learner to try again. However, every alternative name was disabled because another group already owned it; only each current choice remained enabled. Clicking a current choice did not clear it. No visible swap, clear, or reset control appeared. This left the naming exercise without an observable correction path. A new dedicated tab was used to inspect the successful branch.

An original matching task must allow replacing a used label by swapping assignments, clearing one assignment, or resetting the attempt. Test a complete wrong permutation, not just an unfinished or correct attempt. The issue should be independently reproduced before calling it a universal defect; no source inspection was used here.

## Original implementation recipe

This is an original component/state proposal, not extracted implementation:

```text
state = {
  stage, manualCentres, manualAttempts,
  selectedFeatures, scalingChoice,
  centres, assignmentsByRecordId, iteration, nextOperation, objectiveHistory,
  selectedRecordId, softMemberships, selectedGroupCount,
  labelsByGroupId, businessObjective, targetGroupId, outcomeRevealed,
  answeredChecks
}

ASSIGN:
  keep centre positions fixed
  assign each record to nearest centre
  draw membership links; compute objective
  enable MOVE

MOVE:
  keep assignments fixed
  preserve previous centre positions as ghost marks
  move each centre to its assigned records' mean
  compute objective; detect convergence; enable ASSIGN or finish

RESEED:
  archive completed objective, if any
  reset current iteration and assignments

RENAME(group, label):
  if another group owns label, offer swap or clear
  never lock a complete wrong permutation without recovery

DECIDE(objective, target):
  compare all options on separately labeled outcome measures
  show assumption provenance and unmeasured response behavior
```

Build original records with stable IDs and separate group identities from cosmetic colors. Define what changes when scaling changes and how selected IDs persist. Render chart, table, caption, and explanation from the same derived values. The animated step must have a static final state, a manually controllable alternative, and a clear next enabled action. Preserve axes between steps unless a scale change is itself the lesson.

For a soft-group activity, separately store assignment weights and updated group parameters so the two operations remain inspectable. Do not imply a certainty level is a calibrated real-world probability unless the teaching model supports that interpretation. For a kernel demonstration, use a validated mathematical implementation or explicit precomputed teaching results; the reference's short formula is not sufficient as a production specification.

For Majid's no-code capstone, use an original customer-needs or workflow portfolio. Let learners define similarity from business evidence, inspect how scale and selected variables change apparent opportunities, name actionable needs, choose an objective, and design a pilot. A customer interview or response experiment should test the assumption missing from historical records. Finance, marketing, MIS, operations, and MBA students can all perform this reasoning without coding an algorithm.

## Accessibility and validation limits

Labeled range controls worked through keyboard Home/End. Selected buttons exposed pressed state, disabled controls were evident, chart images had descriptive names, and numerical summaries often offered alternatives to reading the graphics. The observed draggable/selectable SVGs did not expose focusable child controls in the inspected rendered DOM; no complete keyboard alternative was verified for manual marker placement, draggable distance/outlier points, or book-point selection. Those deserve explicit keyboard controls and text/table equivalents in the original course.

Not tested here: screen-reader usability, full tab order, focus management after appended acts, contrast ratios, reduced motion, mobile/zoom, print, all marker limits, clearing an uncommitted manual attempt, all initializations, every slider value/feature pair, every naming permutation, every objective-target combination, or every distractor. The parent audit may supplement responsive observations.

Important acceptance tests: alternating operations truly remain distinct; objective and figure agree; a wrong complete naming attempt can recover; projections never silently discard dimensions used for grouping; scenario assumptions are separate from observed records; a green winner is defined by its column; competing objectives do not collapse into one score; and every committed decision leads to a comprehensible next action.
