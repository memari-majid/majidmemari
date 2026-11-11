# Retention simulation — design and interaction study

Reference: [The Retention Budget](https://simulations-6620.vercel.app/c/mktg-6620/retention), within the [reference suite](https://simulations-6620.vercel.app/suite). Fresh UI inspection: 2026-11-10. This is original analysis of teaching and interaction mechanisms, not a copy of the lesson, dataset, questions, source, or answers.

## Evidence boundary

Observed all seven Learn concepts, seven optional math panels, all six Budget acts (including all four sequential evidence checks), and all nine final Challenge items with feedback. The parent audit additionally opened all nine inline Learn-check explanations in a separate fresh tab on the same date, with mixed correct/incorrect choices; each four-choice set locked after commitment. Tested representative correct/incorrect responses, boundary settings, animated sequences, resets, allocation rejection, recommendation revision, and stage revisit. The coverage JSON records exact limits. No hidden application state, network responses, or source was inspected. References to R and model training describe what the interface says, not independently verified implementation details.

This is a finite interface audit, not exhaustive validation of every allocation, random sample, numerical parameter, or mathematical claim. Prior notes in `REFERENCE_COURSE_ANALYSIS.md` supplied context; the observations below were independently repeated.

## Instructional architecture

Three persistent stages separate Learn, Budget, and Challenge. Navigation labels identify current and visited stages, and a learner can revisit. Tested boosting state remained after completing later stages and returning to Learn. A visited-stage checkmark is not proof of mastery: Learn was marked done without every inline question answered.

Learn is a numbered long page with a seven-item jump menu. Its recurring grammar is: business question → intuitive explanation → nearby definitions → guide to reading marks → manipulation → linked numbers → interpretation → optional math → misconception check. Budget progressively appends acts, preserving earlier evidence above. Challenge is an ungraded list; it does not present a competitive aggregate score.

The central teaching mechanism is delayed evidence. Learners first make a plausible spending plan, then audit the evidence it rests on, revise their recommendation, and only then see how the teaching scores were generated. The final reveal explains why reproducing a dataset accurately is different from making a defensible intervention.

## Complete Learn inventory

| Concept | Representations and controls | Freshly tested behavior and purpose |
|---|---|---|
| 1. Regression split | Scatter, vertical cut, group-mean lines, residual toggle, group size/error tiles, cumulative cut-score chart, labeled range, automatic scan, worked math, check | Home created a one-record extreme group. Automatic search visibly scanned candidate cuts and marked the best. Both plots and arithmetic stayed linked. A deliberately wrong median-based answer revealed the correct alternative and why balanced groups are not the objective; choices locked afterward. Residual toggle and math panel were opened. |
| 2. Depth and pruning | Depth range, step prediction, tree diagram, fresh sample, minimum-size toggle, training/new-sample curves on log scale, pruning-charge range, ghost original tree, neighboring-subtree table, fold animation | Maximum depth, new sample, removal of minimum-size protection, and maximum pruning charge were exercised. At the largest charge, only the root remained. Cross-validation completed and exposed an apply-best button. Tree diagrams cap displayed levels and explain that limitation. The neighboring-row table makes the complexity tradeoff auditable. |
| 3. Boosting | Two learning rates; add one/add ten/reset; prediction and residual plots; previous prediction; latest cut; contribution tiles; fixed residual-scale option | One-tree and ten-tree updates visibly progressed. Reset returned to zero; changing rate changed the magnitude of the first correction. The lower plot shows what the latest tree was fitted to, not just the final answer. Holding the scale preserves magnitude comparison; automatic zoom reveals small residual detail. |
| 4. Hyperparameters | Rate/depth choices, explicit training action, progress batches, training/test curves, tree-count range, close-up toggle, grey prior-run curves, comparison table, discovery checklist | Two depths at the same rate were trained. Prior curves remained as references. The zero-tree endpoint and close-up were tested; the narrative explicitly warned when values lay outside the close-up. A table compares explored settings at the same tree count. Checklist items change when the relevant comparison has been explored. |
| 5. Grid search | Four matrices; cell-to-fold animation; reveal-all; best tag; near-tie discussion; five workload sliders; math/checks | One cell cycled five held-out folds, then reveal-all populated the grid. Increasing the candidate count of an additional parameter doubled combinations and fits. The page labels reference scores as precomputed and explains that small score gaps may not be decisive. Training-fold selection is distinguished from final test evaluation. |
| 6. Importance | Gain/count toggle, reordered rank bars, individual/batch refits, zero-centered signed changes, baseline error/explained-variation tiles | Switching importance measure moved the middle ranks. Batch refitting completed all five rows. Red rightward bars mean worse error without a predictor; green leftward bars mean better. Feedback explains compensation by remaining predictors and warns against overreading small differences. Importance is not direction or causality. |
| 7. Individual/average responses | Predictor choices, thin individual curves, thick average, selected gold curve/dot, distribution rug, subgroup toggle, invalid-region overlay, previous/next, redraw, linked record table | Switched predictor; enabled subgroup and impossible-region overlays; changed selected record; redrew the sample; previous wrapped first to last. Red curve stretches identify impossible field combinations. The selected record's text says which rule fails. Average and individual are explicitly distinguished. Extrapolation and predicted values beyond the nominal outcome scale are discussed. |

All seven optional math panels were opened. They connect current figures to split-error arithmetic, pruning penalties, additive residual updates, regularized leaf values, validation averages/workload, importance/refit calculations, and individual-response averages. In a general business course, these belong in optional depth rather than the required path.

## Six-act business case

1. **Brief and stakes.** A limited population, budget, and intervention prices establish the decision. A persistent case-file dialog distinguishes teaching data, sourced cost proxies, and a chosen budget. Sources include dates. It explicitly avoids converting predicted satisfaction points into turnover dollars without evidence. Historical chronology is not presented as causal proof. Escape closed the dialog from its focused close control.
2. **Predict and set policy.** A threshold changes eligibility and confusion-matrix counts while predictions remain fixed. The scatter includes an equality diagonal, a vertical eligibility band, and an observed-outcome horizontal boundary. At the tested upper threshold, the whole-number observed-score definition also changed; the explanatory text called this out. This is a policy change, not retraining.
3. **Guess before reveal.** The learner predicts which field matters most. The revealed importance bars outline that guess in gold and compare it with the model. The explanation separates dependence, direction, and intervention effectiveness.
4. **Allocate a limited budget.** Each eligible record has intervention buttons showing price, predicted outcome, difference, and whether it crosses the line. Batch allocation uses the current list order; ordering choices reflect current prediction, modeled lift, or record number. A ledger tracks money, coverage, total predicted lift, and lift per currency unit. A second matrix compares funded records with observed need. A tested bulk plan funded 17 records for $14,858 against a $15,000 cap. An attempted individual upgrade was refused with the precise incremental cost and $142 remaining; nothing changed. Sorting, clear-plan, and reallocation worked.
5. **Audit before action.** Four panels open sequentially. First, an intervention strip plot shows the distribution behind its mean, filling marks for funded records. Second, a consistency table marks impossible values and an equality-diagonal scatter shades the impossible region. Third, paired distributions with middle-half boxes and medians compare records that pass/fail the rules. Fourth, a switch changes an additional field to reveal the limitations of a one-column what-if. Three recommendations remain revisable; consequences of all alternatives are explained. Both spending as planned and holding for data repair were tested.
6. **Reveal provenance and limits.** The page then explains the synthetic score construction, shows a component-contribution table, explains inconsistent records, and compares model response with the constructed relationship. The concluding personalized paragraph repeats the learner's threshold, plan, evidence problem, and latest recommendation, before offering Challenge. This closes the loop between learner action and final explanation.

### Meaningful colors near the ending

The final model-versus-constructed-relationship charts use a solid line with dots for model responses, a dashed line for the known teaching relationship, gold shading for their disagreement, and an upright gold mark at the widest gap. Captions connect the worst gaps with sparse/absent training evidence. In the preceding audit, red values plus explicit text identify invalid records; a shaded impossible wedge explains the inequality; gold boxes summarize the middle half and median; filled versus hollow marks distinguish funded people. The final recommendation highlight identifies the learner's latest choice, while the explanation exposes costs of both acting and waiting.

## Challenge and feedback inventory

Nine inline Learn checks cover split selection, pruning, weak learners, residual-based diversity, hyperparameters, search combinations, validation, black-box interpretation, and partial-dependence limits. All nine explanations were inspected across this child audit and the parent audit. Nine final items cover split selection, complexity control, weak-model sequencing, tiny step sizes, search combinations, validation-based selection, importance interpretation, partial-dependence limits, and data plausibility despite held-out accuracy. All nine were answered once and their explanations inspected; incorrect responses were deliberately included.

Feedback labels the chosen wrong answer and the correct alternative, uses text and symbols, locks the choices, and supplies reasoning on both correct and incorrect paths. Explanations compare plausible misconceptions and reconnect to the activity. There is no visible aggregate grade. This pattern is reusable; the question bank is not preserved here.

## Visual and interaction design

Desktop observation showed an off-white canvas, a restrained reading-width column, dark text, thin neutral borders, rounded white chart panels, generous vertical spacing, compact statistic tiles, and small uppercase hierarchy labels. Definitions often have a colored left rule. Teal is the lesson accent. Grey points/curves supply background records or prior runs. Gold identifies a current cutoff, selected record, mean, guess, or discrepancy according to the local legend. Green rings or bars mark a best objective or favorable change. Red denotes new-sample error in one plot, invalid records in another, and deterioration in a refit chart. These local meanings require explicit legends.

Dash patterns, hollow/filled markers, signs, text, labels, and positions reinforce several color distinctions. This is not a contrast or screen-reader certification. For the original course, keep a smaller stable semantic vocabulary where practical.

Animation is tied to a mechanism: scan cuts, add models, rotate folds, draw training curves, move rank rows. Manual boosting steps support deliberate comparison. Some counters tween, so a screenshot during a transition can contain temporarily unreconciled figures; verify a stable caption and final numbers. Smooth scrolling explains why the first screenshot after a jump can show an intermediate position. Not all automatic sequences exposed pause controls.

## Original implementation recipe

This is a proposed design, not the reference's source architecture:

```text
state = {
  stage, visitedStages, conceptSettings, demonstrationStep, priorRuns,
  threshold, sortOrder, planByRecordId, openedEvidenceChecks,
  selectedRecommendation, selectedRecordId, answeredChecks
}

on chooseIntervention(recordId, action):
  proposal = replace this record's existing action
  if cost(proposal) > budget:
    retain old plan; explain extra cost and available balance
  else:
    accept proposal

on changeThreshold(value):
  update eligibility and every dependent chart/table from one rule
  explicitly reconcile any planned record no longer eligible

on revealEvidence(nextCheck):
  derive its figure, numbers, and narrative from current plan and threshold

on recommend(choice):
  retain latest choice; compare all consequences
  preserve the earlier experimental plan for reflection
```

Use immutable supplied records and stable record IDs. Separate observed outcomes, predictions, hypothetical modified-record predictions, and established intervention effects. Share derived results across figures, tables, tiles, and prose. Document deterministic batch ordering and affordability rules. Label precomputed, recomputed, illustrative, and uncertain values honestly.

Useful original components are a case brief, stage progress, concept section, figure-reading guide, linked chart/table, step controller, budget ledger, evidence reveal, choice-with-explanation, decision comparison, and personalized debrief. A capstone version could allocate limited human review across AI-generated work, choose an AI workflow pilot, or compare customer-demand evidence. Required learning should concern value, evidence, quality, capacity, and action. Model-training mathematics can be optional.

## Accessibility and remaining checks

Native labeled sliders worked with keyboard Home/End/Arrow input. Many visual toggles are buttons with pressed state. Figures expose descriptive names, and numerous views include equivalent numerical text/tables. Previous/next provides an alternative to selecting a curve by pointer. The dialog had an effective Escape path from a focused control.

Untested: all direct curve/cut dragging, every feature and rate/depth combination, every allocation and random sample, every individual refit button, four of the five workload-slider variables, applying the automatically chosen pruning value, full keyboard order/focus restoration, screen readers, contrast ratios, mobile, reduced motion, zoom, printing, and settled reload persistence. Browser width failure later in the audit is documented separately from app behavior.

An original implementation should verify money reconciliation, stable IDs after sorting, synchronized representations, explicit invalid-record text, causal/predictive separation, meaningful endpoints, stable animation completion, and a clear recovery or continuation after every wrong answer.
