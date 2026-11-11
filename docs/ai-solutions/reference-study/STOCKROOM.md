# Stockroom design study

Reference: https://simulations-6620.vercel.app/c/mktg-6620/stockroom

## Evidence and coverage status

**Live UI review: November 10, 2026**, using an isolated authenticated browser tab. The original tab-creation problem was resolved. This pass inspected all three stages, the case modal, all seven concept sections and their math disclosures, all seven business acts, and all seven inline-check explanations, all nine challenge explanations plus the ending. At least **105 successful control activations** were exercised, conservatively counted as clicks and individual keyboard changes; repeated ArrowRight input is included. Reading/screenshot calls and one failed attempt to activate a replay button during animation are excluded.

The finite section and control-type coverage is broad. It is not every random seed, tuning combination, selected part, learner answer, threshold, or mathematical implementation. In particular, two of twelve tuning cells, two of four minimum-node choices, two of six vote exemplars, and two of twelve human-practice decisions were exercised. Ten practice decisions were intentionally left undecided to test skip/resume and fair-comparison behavior. Both business math disclosures are now covered: this reviewer opened the Act 7 chain explanation, and the root reviewer opened and read the Act 5 break-even explanation in the final follow-up. Thus seven learning disclosures plus two business disclosures were inspected. The root reviewer also verified the zero-judgment skip branch described below.

The [earlier analysis](../reference-analysis.md) supplied orientation. The live observations below supersede the preliminary blocked-audit status. No hidden application state, reference source, full dataset, or question bank is retained. The implementation architecture below is original proposed work, not a claim about the reference's code.

## Observed page architecture

The persistent shell matches Campaign: activity title/context, return link, case modal, three freely selectable stages, and stated in-page progress retention. Learn contains seven ordered sections with concept jump buttons. Each combines a contextual explanation, definition, an experiment, interpretation, optional math, and a four-choice check. All jump targets were inventoried. A representative jump to the last concept was activated and verified after smooth scrolling settled with its heading near the viewport top. Stage changes and control-focused navigation brought other relevant content into view; not every individual jump target was separately tested.

The case modal explains the business problem, a downstream supply-chain effect, dataset provenance, feature definitions with units, illustrative cost assumptions with external-source links, and the operating decision. It explicitly distinguishes the supplied historical data from simulation-chosen costs. The cited cost benchmarks were read as reference content, not independently verified or recommended for future projects. Open/close worked; modal keyboard trapping was not tested.

## Learn: complete finite section inventory

| Section | Observed representation and progression | Actions, outcomes, and limits |
|---|---|---|
| 1. Known outcomes, known risk, unknown probabilities | Three jars distinguish information states. The unknown jar has one-draw and ten-draw controls; draw history, estimated positive share, uncertainty band, costs, winnings, and profit update together. A reveal adds the hidden composition and true-rate line. | Exercised one draw, ten draws, reveal, and new-jar reset. The ten-draw action visibly accumulated outcomes rather than instantly replacing the total. An intermediate snapshot caught six draws; the settled count was eleven. Reveal did not reset history. New jar reset count, profit, estimate, and reveal state. |
| 2. Grow a small tree | A labeled tree diagram links to five terminology cards. A small table and numbered outcome dots support trying two candidate first splits. Dots move to child groups sequentially; weighted impurity bars fill after the partition completes. Trying both unlocks the second split; the final diagram shows leaf predictions and group counts. | Clicked diagram root, internal node, leaf, branch, and depth controls, then the leaf term card. The term card highlighted all corresponding leaves and dimmed other structures with a textual explanation. Tried both first splits, grew the second level, inspected the completed tree, and reset. Reset cleared the split-comparison history/tree while the check's committed feedback remained. |
| 3. Instability of a single tree | One fresh-sample button changes a fitted tree on a fresh training subset while retaining the test population. A top-level tree diagram, structural metrics, training/test accuracy, changed-prediction percentage, and history table provide several views of variance. | Refit once. The root cutoff, depth, leaf count, and test accuracy changed; history retained both samples and reported 23% of test predictions changed. This is an observed illustration, not an independent algorithm audit. |
| 4. Bootstrap and random predictor subsets | Numbered population tokens acquire duplicate-count badges and omitted-token dimming as a same-size replacement sample is drawn. A running average compares omitted counts with the theoretical expectation. A separate two-option feature experiment shows root-variable frequency bars, diversity, disagreement, and ensemble AUC. | Drew two bootstrap samples; the second used Skip to end. One settled sample had 20 distinct items from 30 draws, 10 omitted, and seven repeated-item identities. Switched from all predictors to a random subset: roots spread from one variable to eight, while the test comparison stayed fixed. A loading message appeared during computation. |
| 5. Aggregate votes | Six record-selector cards supply concise real-unit contexts. Votes can accumulate ten at a time or all at once. Completion exposes vote share, binary verdict, actual outcome, then a regrow action. Reseeding adds a history of ensemble shares and compares one tree's change with the aggregate. | Counted ten then all for one exemplar, selected a second exemplar, counted all, and regrew once. Second exemplar's share shifted from about 0.41 to 0.46; verdict and first-tree answer remained unchanged for that sampled reseed. Four exemplars and other seeds remain untested. |
| 6. Model settings and evaluation | A 3-by-4 tuning grid asks the learner to compute cells; each gets a three-fold mean AUC, with best-so-far coloring and counts. A separate four-choice minimum-node panel shows depth, leaves, own-row and test AUC, plus comparison history. | Scored two cells: a low-complexity corner and the displayed lecture setting. Best-so-far and scored count updated. Tested smallest/largest minimum-node choices; average depth moved from 16.1 to 5.0 and test AUC from 0.879 to 0.849 in the observed runs. Ten grid cells/two node settings were not tested. |
| 7. Imbalanced classes | A training-class composition bar changes with the ratio input, while four evaluation metrics, an outcome matrix, and a history plot always refer to the same test population. The text separates training rebalancing from evaluation prevalence. | Keyboard End/Home produced raw and balanced training mixes. Raw mix showed sensitivity 42.4% and specificity 95.8%; balanced showed 85.9% and 78.6%. The matrix and training-row totals changed accordingly. While a new model was computing, old metric tiles briefly remained beside a loading label; settled results were inspected separately. |

All seven optional math disclosures were opened: expected value and uncertainty band; weighted Gini; instability; bootstrap omission probability/correlated averages; vote averaging; cross-validation; class-specific rates and prevalence. Their main design role is to put formal explanations next to a manipulation that has made the question concrete.

The uncertainty panel's math clarifies that the displayed band uses the maximum Bernoulli standard-error bound, approximately ±1/√n, rather than plugging the current estimated share directly into a confidence interval. It is a learning approximation, not a guarantee about a business's unknown probability. The caption's simple wording should not be transferred without the qualification.

## Business stage: all seven acts observed

| Act | What the learner does | What becomes available and why it matters |
|---|---|---|
| 1. Costed baseline | Compare protecting every record with protecting none. Both buttons were exercised. | Both cost summaries stay visible; the better naive policy and perfect-foresight lower bound establish the room for improvement. The model must beat a credible baseline. |
| 2. Human judgments | Review contextualized records one at a time, choose protect/leave, see immediate outcome/cost feedback, then continue. | A twelve-position progress diagram, running bill, outcome history, and summary persist. Two decisions were made: one leave and one protect. Skip marked the other ten undecided, excluded them from every comparison, and disclosed that this deliberately selected set is not representative. Resume reopened the third decision; skipping again preserved the first two. In a separate root-reviewed fresh run, skipping before any judgment left 0/12 judged, omitted the human-bill comparison, and offered a return to judge all twelve. |
| 3. One tree | Inspect a single-tree policy and sample again. | Structural metrics, selected count, missed outcomes, and money show how variance changes a practical policy. One fresh-sample action was exercised here, separate from the Learn example. |
| 4. Raw forest at default cutoff | Compare the fitted ensemble with the baseline and the learner's same records. | Class-specific rates, money-labeled outcome matrix, and twelve-record human/forest/actual comparison are shown. The prose explicitly limits the human cost comparison to the two judged records; unjudged rows remain identified. A seemingly good accuracy still loses to protecting everything under the supplied costs. |
| 5. Two policy controls | Change a cutoff and/or activate a rebalanced-training model. | Count/rate/cost tiles, the matrix, a ranked window around the cutoff, and both cost curves update. The window shows ten nearby records on either side plus counts omitted above/below, keeping a large population readable. Raw and rebalanced models share the same evaluation records. |
| 6. Result | Commit to a policy to open the debrief. Earlier controls remain live. | Compare chosen cost with best available and protect-all cost, covered/missed outcomes, and improvement or loss. A deliberately poor 100% policy produced a loss; changing the earlier control to the displayed good setting updated the debrief to savings with no extra submit action. |
| 7. Wider operating consequences | Run the chosen policy through an illustrative multi-tier demand/order sequence; switch among chosen/all/none policies; replay or skip animation. | Four line series, current-quarter indicator, evolving peak/amplification tiles, and a complete three-policy comparison table show consequences beyond the local bill. The full table remains available while the chart animates. A visible caveat explains the simplified dynamics and omitted real-world mechanisms. |

Sparse arithmetic checks from settled states:

- Protect-all baseline: 500 actions × $45 = $22,500. Protect-none: 99 adverse outcomes × $450 = $44,550.
- Default raw-model policy: 59 protections and 57 missed adverse outcomes → 59 × $45 + 57 × $450 = $28,305, which reconciles with the displayed cost.
- Rebalanced policy at the displayed 25% cutoff: 236 protections and seven misses → $13,770, saving $8,730 versus protect-all. These are teaching-case results, not deployable thresholds.
- At policy cutoff 0%, all 500 records were protected; at 100% in the selected rebalanced model, none were protected. The rate/matrix totals reconciled with those extreme decisions. The criterion is “at least”; a future dataset containing a score of exactly one must not assume the upper endpoint always means no actions.

Act 7's switching automatically starts the quarter animation. During playback the replay action is replaced with a skip action. One attempted replay click immediately after switching had no matching button because playback was underway; a fresh snapshot resolved the state. Replay and skip were subsequently tested successfully. Number tiles visibly interpolate, so immediately captured text can be between final values even when a quarter label has changed. Review calculations from settled states or the complete comparison table, not from a transient animation frame. At the first flat-demand quarters, amplification uses an em dash plus a zero-spread explanation rather than an invalid numeric ratio.

The root reviewer additionally opened Act 5's break-even disclosure: it compares a certain protective cost with the expected loss of leaving a case uncovered, derives the probability-based cost ratio, and explicitly distinguishes a real probability from the ensemble's score. The raw-model vote is described as an approximate proxy; rebalanced-model votes can overstate the natural probability. This directly supports the calibration caution in our implementation recipe.

The chain's optional math disclosure was opened. It exposes a simplified deterministic cascade rather than a detailed inventory simulator. The final caveat identifies omitted lead times, buffering inventory, and minimum orders. This honesty about model scope is transferable. The particular chain equation, input demand sequence, and cost data should not be copied into our independent case.

## Challenge and completion behavior

All seven concept checks and their explanations were inspected across the main and follow-up passes, including one incorrect weighted-group calculation and correct responses to the remaining concepts. The incorrect feedback explained the specific denominator/weighting misconception, not just that the choice was wrong.

The final stage contains nine four-choice checks, all answered and all explanations inspected; one answer was deliberately wrong. Topic coverage: split quality, replacement sampling, predictor-subset diversity, score versus exact probability, majority-class accuracy, rebalancing effects, natural evaluation mix, cost-derived action boundary, and downstream amplification. This inventory intentionally omits verbatim prompts/options and an answer key.

Answer commitment disables all alternatives, labels correctness in text and symbols, and exposes a status-region explanation. Answered/correct totals appear, although the introduction describes the work as ungraded/unscored. Completing the stage reveals a synthesis of what the learner can now do and an economics-before-model-score principle. No challenge retry/reset control was visible. A later return to Learn retained prior grid scores, histories, slider settings, and quiz feedback in the current page session.

## Visual grammar and accessibility evidence

The overall palette/layout matches Campaign's quiet light page, centered column, rounded white experiment cards, crimson primary controls, and small uppercase labels. It uses color by role, with explicit local legends:

- Jar outcomes are blue/red and are accompanied by outcome and payout labels; draw order is exposed as a named group.
- Small tree-training dots are dark filled versus hollow for the two actual classes, and retain record numbers. Child groups retain those identities through motion. Complete leaves predicting the adverse class are shaded.
- Anatomy selection uses heavier crimson outlines and stronger text on relevant nodes/cards; unrelated elements fade. A prose selection description remains available.
- Bootstrap omissions dim, repeated identities highlight and receive multiplication/count badges. Counts distinguish total draws from unique observations.
- Best-scored tuning cell is green **and** its value/settings are repeated in a best-so-far tile.
- In the operational ranked list, red bars mean the actual adverse outcome, gray bars its absence, and row shading means protective action. The bar width is the score; the boundary is the policy. These are four different meanings, not one red/green judgment.
- On the cost chart, a hollow marker shows the current choice, green the lowest observed cost, gold the economic break-even, and a faint dashed curve the alternative training mix. Labels explain each.
- The supply-chain legend distinguishes gray customer demand, crimson manufacturer orders, gold supplier orders, and an orange-red upstream series. The baseline comparison is also a table; the lesson does not require reading line colors alone.

Observed accessibility support includes named stage navigation and dialogs, labeled range input with working Home/End/ArrowRight changes, semantic buttons for graphical tree targets and equivalent term cards, accessible names for chart images, textual record labels, pressed states for options, question groups, and feedback status regions. Keyboard focus was automatically placed on the next decision button after a practice choice. Full keyboard traversal, contrast, chart announcements, modal trapping, screen-reader operation, mobile, zoom, and reduced motion were not tested. The small legend text and dense nine-feature practice cards should be tested explicitly in our build.

## What to preserve, and what to improve

**Preserve:** a short role-based brief; bounded interactions; record identity through representations; baseline before model; human choice before automation; same-subset comparisons; independent training/evaluation populations; rates with denominators; one policy updating all subsequent consequences; business-language debrief; explicit simulation limitations.

**Improve in our independent course:**

- Keep the required path focused on building and evaluating an AI solution. Move full tree-fitting machinery to optional depth when the partner problem does not require it.
- Provide visible loading placeholders instead of showing old metrics alongside newly selected parameters; apply one completed-result version to all views atomically.
- Use manual stepping or a reduced-motion alternative; observed replay/skip is useful but full motion accessibility was not verified.
- Do not select a production policy by repeatedly optimizing on a final test set. The reference permits such exploration for teaching; our capstone should use validation for policy selection and reserve a final evaluation set.
- Treat a vote share as a ranking/score until calibration is evaluated. Rebalancing can shift score levels; an economic probability threshold is not automatically the same as a model-score threshold.
- Distinguish the observed sensitivity/specificity tradeoff on this dataset from a universal guarantee that rebalancing always leaves AUC unchanged.
- Track missing-data handling explicitly. The case says a numeric sentinel represents absent supplier records; our business workflow must document treatment and audit whether absence itself produces unintended signals.
- Distinguish constant predicted labels from constant scores. A threshold can label every record negative even while its varying scores rank records usefully; only a constant score necessarily has no ranking discrimination.
- The UI's ungraded promise can coexist with self-check counts, but wording should make the distinction clear. Offer a deliberate retry with new reasoning rather than requiring a page reset.

## Transferable interaction patterns

### Make uncertainty visible before introducing aggregation

Repeated draws can show why one observation is not a stable estimate. A learner should know whether a draw changes a sample, simulates an outcome, or merely illustrates an uncertainty distribution. Keep those operations separately named. A visible “new sample” action should not silently replace the evaluation population used for comparing policies.

A useful build begins with a small, legible population. A draw highlights the selected record and adds it to a sample tray. Duplicates remain visible when sampling with replacement. A counter or table explains how many draws have occurred. The durable lesson is that a bootstrap sample can contain repeated observations and omit others; it is not simply a smaller randomly shuffled original dataset.

### Break a complex mechanism into consequential steps

A tree-splitting lesson can ask the learner to choose a variable and a split, inspect which records go to each child, and compare the resulting group composition. A branching diagram alone is insufficient: the learner needs a visible connection between the records, the rule, and the consequence.

An original, more detailed feature-choice step can explain why multiple trees are not identical. Show the allowed candidate features at that split, then distinguish the chosen split from the candidate set. If the interface hides the difference, learners may mistake randomness for an arbitrary final decision.

### Show the ensemble as accumulated evidence

Individual votes can be revealed sequentially, followed by an aggregate. Retain the vote denominator and distinguish a vote share from a calibrated probability unless the lesson explicitly justifies the latter. A unanimous or split vote should be interpretable without relying on animation timing.

An optional enhancement in an original implementation can let the learner select a tree, inspect its path for the current record, and return to the full vote summary. Individual tree-path selection was not observed in the reference vote panel. The same record identity should persist. This teaches why aggregated decisions can differ from any single tree without requiring source code or hundreds of tree diagrams.

### Separate model tuning from the final operating policy

A tuning grid can summarize several model settings. Selecting a cell should update the displayed setting, evaluation score, and explanation. The held-out population must stay fixed for a meaningful comparison. The best model under a predictive metric may still need a different action threshold under business costs and capacity.

Do not make an apparently optimal cell the lesson’s final answer. Bring the learner back to the operational objective, costs of different errors, and feasibility. The reference’s cost-policy and supply-chain debrief are useful because they widen the lens after a local numerical result.

### Preserve the human baseline

Ask learners to make a small initial allocation themselves. When the model result is revealed, compare the same records rather than granting the model an easier population. Keep the original human choices visible. Feedback can then identify where the model improved the decision and where additional information might still matter.

A baseline should include a credible simple rule, not only a deliberately weak straw man. This gives students a practical standard for whether the added complexity earns its operational cost.

## Original implementation recipe

Create a fresh business setting and data. For Building AI Solutions, a support or order-processing queue can teach the same decision ideas without reusing the reference’s manufacturing case.

Suggested component structure:

```text
BusinessBrief
UncertaintyDemonstration
RecordPopulation
BootstrapTray
SplitExplorer
  CandidateFeatures
  SplitControl
  ParentAndChildGroups
  SplitExplanation
EnsembleExplorer
  TreeSelector
  CurrentRecordPath
  VoteAccumulator
TuningComparison
BusinessActs
  HumanBaseline
  SimpleRuleBaseline
  SamePopulationModelComparison
  CostAndCapacityPolicy
  ConsequenceTable
OperationalDebrief
ProjectTransfer
```

Suggested state:

```text
caseVersion
stageAndAct
selectedRecordId
sampleSeed
bootstrapDraws
candidateFeatureSet
splitChoice
treeIndex
votesRevealed
selectedTuningCell
humanActions
operatingThreshold
costScenario
capacityLimit
recommendationAndReason
```

Use explicit event types so a learner can predict what a control changes:

```text
DRAW_BOOTSTRAP_RECORD
CHOOSE_SPLIT
SHOW_NEXT_TREE_VOTE
SELECT_MODEL_SETTING
COMMIT_HUMAN_POLICY
SET_OPERATING_THRESHOLD
CHANGE_COST_ASSUMPTION
REVEAL_OPERATIONAL_CONSEQUENCE
```

A deterministic seed is useful for reproducible teaching examples. Label fresh sampling as a new simulation rather than an observed business event. Keep the selected record and evaluation population immutable during a policy comparison.

```text
on policy change:
  validate threshold, costs, and capacity
  derive actions on the unchanged evaluation set
  enforce the declared capacity rule
  calculate outcome counts and total business consequence
  compare with the saved human and simple-rule baselines
  update row-action shading and outcome marks independently
  explain the tradeoff and evidence limit
```

Keep every computation separate from presentation. An independent model function should produce the counts, costs, eligible set, and decisions. The table, diagram, bar chart, and debrief should all consume that result. This makes mismatches testable and prevents one display from silently using a different sample.

## Visual semantics and motion

The observed row/action versus bar/outcome distinction should become an explicit legend. Use a separate selection outline for the current record. Color should not simultaneously mean model confidence, business action, and correctness.

Useful motion includes a record moving from a population into a sample tray, following a split into a child group, or contributing a visible vote. Keep previous and next states understandable. Manual Next, Previous, Replay, and a direct final-summary control let learners choose their pace. New work should provide reduced-motion handling even where the benchmark’s behavior has not been verified.

A tuning matrix needs row and column labels, a named metric, its direction of improvement, and the held-out sample context. Do not use a heat map alone: include the numerical cell values and selection feedback. A risk or probability bar should have an explicit legend for its outcome encoding.

## Acceptance checks for an original build

1. Bootstrap draws match the visible sample tray, including duplicates.
2. Each split partitions the parent records without losing or duplicating them.
3. Candidate features and the final chosen split are visibly different concepts.
4. Tree-path explanations refer to the selected record and selected tree.
5. Vote totals equal votes revealed; ties and zero-vote states are explicit.
6. Tuning comparisons preserve the held-out dataset and clearly label their metric.
7. Human, simple-rule, and model policies use the same evaluation records.
8. Business totals reconcile with the action policy and asymmetric error costs.
9. Capacity limits are applied explicitly and unmet work does not disappear.
10. Action shading, actual-outcome marks, and current selection remain distinct.
11. All controls work by keyboard; a text/table equivalent exposes the complete state.
12. The final debrief identifies downstream or omitted effects and a realistic next test.

## Application to Building AI Solutions

A shortened adaptation could teach how to allocate limited human review across AI-generated work. Learners first choose cases manually, compare a simple rule with model-assisted prioritization, inspect errors on the same records, and decide a policy under review capacity. The capstone transfer is a review-allocation rule with cost assumptions, a stop condition, and a plan to evaluate it.

Keep detailed random-forest mechanics optional unless they directly support the intended business outcome. The required sequence should teach evidence, aggregation limits, fair comparison, and operational consequences. An animation library or full algorithm course should not become a parallel path beside the capstone.
