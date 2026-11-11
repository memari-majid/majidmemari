# An original six-record vertical slice

This example is for course authors and developers, not a student coding assignment. It is newly authored for this handbook. It uses no reference-course records or code and is not part of the current public course build.

## Decision and data

A fictional service team is testing which **low-stakes draft replies** should proceed without an additional review. The target is a reply that already meets the stated quality criteria; scores are fictional estimates of that target. The learner selects a threshold. A record is selected when its score is at least the threshold.

| Record | Score | Draft actually meets criteria |
|---|---:|---|
| A | 0.95 | Yes |
| B | 0.82 | No |
| C | 0.70 | Yes |
| D | 0.55 | No |
| E | 0.40 | Yes |
| F | 0.10 | No |

Assume the baseline is 4 minutes of human work per draft. A selected draft takes 1 minute to process. An unselected draft uses the 4-minute baseline. A selected draft that fails the criteria adds 8 minutes of repair. These are teaching assumptions, not measured productivity or evidence that unattended replies are appropriate.

## One calculation feeds every representation

At threshold 0.70, selected IDs are A/B/C. The outcome table is TP=2, FP=1, FN=1, TN=2. Precision and recall both equal 2/3, but have different denominators. Total effort is `3 × 1 + 3 × 4 + 1 × 8 = 23` minutes against 24 baseline minutes. That is one minute less effort, with one unacceptable draft allowed through.

At threshold 0.40, selected IDs are A/B/C/D/E. The outcome table becomes TP=3, FP=2, FN=0, TN=1. Effort is `5 × 1 + 1 × 4 + 2 × 8 = 25` minutes: wider coverage creates more total work. At threshold 1, no draft is selected, effort returns to 24 minutes, and precision is undefined.

The learner should see:

- The **same six rows** in a ranked table, with fill/shape for actual quality and an outline or shaded action column for selection.
- A four-cell outcome table containing the matching record IDs.
- A stacked effort bar split into processing, human review and repair.
- A live sentence: “Three of six drafts proceed; one fails the criteria. Total effort is 23 minutes versus 24 for the baseline.”
- A decision prompt asking whether that policy meets the service's quality requirement, not just whether the bar is shorter.

After the learner commits, reveal that a time reduction alone cannot settle the policy. The next capstone artifact is an explicit quality gate, a repair/escalation rule and a plan to evaluate a new sample. These six records cannot establish deployment readiness or an optimal future threshold.

## Deterministic calculation sketch

```javascript
function evaluate(rows, threshold, costs) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1)
    throw new Error('Threshold must be between 0 and 1');
  const cells = { tp: [], fp: [], fn: [], tn: [] };
  for (const row of rows) {
    const selected = row.score >= threshold;
    const key = selected
      ? (row.acceptable ? 'tp' : 'fp')
      : (row.acceptable ? 'fn' : 'tn');
    cells[key].push(row.id);
  }
  const tp = cells.tp.length, fp = cells.fp.length;
  const fn = cells.fn.length, tn = cells.tn.length;
  const selected = tp + fp;
  const baseline = rows.length * costs.review;
  const processing = selected * costs.process;
  const review = (fn + tn) * costs.review;
  const repair = fp * costs.repair;
  const total = processing + review + repair;
  return {
    cells, selected, n: rows.length,
    precision: selected ? tp / selected : null,
    recall: tp + fn ? tp / (tp + fn) : null,
    effort: { baseline, processing, review, repair, total },
    reduction: baseline ? (baseline - total) / baseline : null
  };
}
```

Validate records and cost inputs at the data boundary in a production implementation. Keep `null` as “not defined”; do not format it as zero. The calculation returns record IDs so the visual views cannot disagree about membership. Format percentages at render time; calculate from unrounded values.

## Checks and feedback rules

| Check | Expected result |
|---|---|
| 0.70 with process/review/repair = 1/4/8 | 2/1/1/2 cells; selected 3; effort 23; reduction 1/24 |
| 0.40 | 3/2/0/1 cells; selected 5; effort 25; reduction −1/24 |
| 0.90 | 1/0/2/3 cells; selected 1; effort 21 |
| 1.00 | 0/0/3/3 cells; selected 0; precision null; effort 24 |
| 0.00 | 3/3/0/0 cells; selected 6; effort 30 |
| Every setting | All cell counts sum to six; table, chart and caption use the same returned object |

Proposed feedback ordering: first state whether unacceptable drafts proceed, then whether effort improves, then what evidence is missing. A safe-looking result on one small sample is not a guarantee. Do not have an LLM invent these totals; generate them deterministically and let a grounded assistant explain their meaning.

This sketch is intentionally small enough to verify by hand. A production activity would add accessible controls, state persistence, a baseline-preserving reset, a commitment/revision flow and independent held-out evaluation. The [build handbook](BUILD_HANDBOOK.md) specifies those layers.
