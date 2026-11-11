# Applying the simulation study to Building AI Solutions

This plan translates the [reference study](reference-study/README.md) into the current course. It uses original Cedar Desk cases and the existing visual theme. The course remains one twelve-unit capstone path with Learn → Try → Build → Finish; no separate simulation destination or student programming is added.

## Learning design

The existing figures already connect records, tables, numbers, and decisions. The next improvement is a more consequential learning loop: **predict → explore → commit → inspect a challenge → retain or revise → transfer to the capstone**. This happens inside the current practice stages. The learner can explore without earning a score or implying mastery.

1. Put the scenario, decision owner, and task before the interaction. Do not give away the challenge result in that introduction.
2. Preserve the first prediction and its reason when the learner explicitly moves into the evidence.
3. Let the learner inspect linked figures and tables, then explicitly record a recommendation and the settings used for it.
4. Reveal a clearly labeled worked challenge. Keep its base and changed case on the same scale, denominator, time period, and calculation basis. Distinguish this fixed teaching comparison from the learner's live exploratory settings.
5. Ask whether the recommendation should stand or change, and why. Preserve the initial choice so the debrief does not replace it with hindsight.
6. End with one useful addition to the capstone. A changed recommendation or unfavorable result can be good work when it follows the evidence.

The common transfer comes from the reference's committed business decisions, delayed evidence, linked representations, and explanatory feedback. Unit 4 also adapts the visible workflow pattern; Unit 7 uses the reference's insistence on explicit denominators. These are adaptations of instructional patterns, not copied activities, source code, or datasets.

## Five activity contracts

| Unit | Decision and misconception | Fixed evidence challenge | Capstone transfer |
|---|---|---|---|
| 2 · Discover the need | Choose a defensible discovery claim. A stable median does not imply that the whole service is unchanged. | Change only the longest of eight waits from 31 to 47 minutes: total 72 → 88, mean 9 → 11, median 6 → 6. Removing an inconvenient record does not establish that it was invalid. | Neutral question, baseline with denominator and period, contrary observation, remaining uncertainty. |
| 4 · Design the workflow | Decide whether a draft may be released, revised, or handed to an owner. A citation is not permission to promise an exception or claim an action happened. | Hold the same 8-hour emergency fixed and compare unchecked delivery with source/authority review: one unsupported commitment released → zero. S2 supplies no automatic refund under 24 hours; S6 keeps commitments with an authorized person. A prepared handoff is not a performed refund or received handoff. The ordinary 96-hour case remains a separate exploration example. | Source owner, reviewer, permitted action, exception route, stop condition, manual fallback. |
| 6 · Design a fair test | Choose a process against a declared quality and effort boundary. Fastest is not necessarily acceptable. | Same twelve cases: manual 96 minutes; reviewed 84 with zero supplied material errors. The classroom rule is zero material errors and at least 10% lower effort, so the limit is 86.4 minutes. Six added rework minutes gives 90 and only 6.25% reduction: the effort rule fails while quality counts stay fixed. | Common comparison, prespecified quality criterion, complete effort, continue/revise/stop rule, and new test cases. |
| 7 · Pilot and retest | Make an honest claim about completion. A larger percentage can come from a new denominator rather than better behavior. | Same people and 14-day observation window: 6/12 invitees = 50%; 6/9 starters ≈ 66.7%. No additional person completes a task. | Actual task observation, assistance, failures, revision and retest, count/denominator/window. |
| 8 · Evaluate impact and resources | Recommend a bounded next step under uncertain adoption. Time value is not avoided cash expense. | At 1,200 eligible replies/month, one minute released per assisted reply, and $24/hour: 50% use gives 600 replies, 10 hours, $240 capacity value, $0 net capacity value; 30% gives 360 replies, 6 hours, $144 value, −$96 net. Both incur $240 recurring expense and −$240 cash change with unchanged payroll. | Base and downside scenarios, correct financial label, operational use for capacity, and evidence needed to justify adoption. |

## Six compact figure contracts

These original figures support the same path; they do not add six labs or additional submissions. The [real-world AI redesign](real-world-ai-redesign.md) makes capability-to-task fit and implementation explicit while keeping commercialization optional.

| Unit | Learner action and numerical contract | Required interpretation |
|---|---|---|
| 3 · Complete effort | Reveal draft 2, checking 3, correction 2 and handoff 1 minute: 8 total. Change checking to 2: 7 total, 12.5% reduction versus 8. | Faster drafting alone is not complete-task improvement. The changed checking estimate must preserve acceptable quality. |
| 5 · Repair and retest | Repair missing timing and late exceptions: 1/3 → 2/3 → 3/3; reveal the exactly-24-hour boundary: 3/4; add the credit rule: 4/4. | A newly tested case changes the denominator; earlier passes do not establish universal reliability or replace an actual user attempt. |
| 9 · Prepare the solution for use | Allocate $180 resource value: $12 cash plus 4.5 hours at $24 = $108 valued time, leaving $60 unallocated. Add one revision hour: $132 time, $36 unallocated. Fifteen available support hours permit three complete releases at 4.5 hours or two at 5.5 hours. | The remainder is resource-value allowance, not a cash balance, price or profit. This narrow scenario excludes setup/recurring costs and establishes capacity, not successful use. |
| 10 · Bring the solution into use | Reveal the same unique-person cohort at day 30: 100 reached → 20 conversations → 5 pilot agreements → 3 observed successful first tasks. Compare all-reached and previous-stage denominators. $150 cash plus five hours at $24 = $270 resources; $270/3 = $90 per observed completion. If all five complete with the same resources, $54 each. | Agreement is not completed use. First use is not continued use or broad effectiveness. The five-completion comparison assumes unchanged support resources. All observations are supplied fictional facts until the learner collects actual evidence. |
| 11 · Review queue | Run five days of 30 arrivals and 24 reviews/day: 150 arrived, 120 reviewed, 30 waiting. Add review capacity or limit intake. | Arrivals = reviewed + waiting + deferred. Limiting intake cannot make unmet need disappear. Valued extra staff time is cash expense only if paid. |
| 12 · Honest chart | Change the origin from zero to 80 on the same 96/84-minute data. Actual reduction stays 12.5%; visible-length reduction becomes 75%. | The appearance cannot strengthen the evidence. Preserve the same 12 cases, quality counts and evidence limits. |

## Source and rendering responsibilities

- `site/course_content.py`: brief task text above each practice; complete `try_worked_html` explanations below it, including the fixed challenge, limitations, and transfer. All core reasoning remains ordinary HTML for the course TA, printing, and readers without JavaScript.
- `site/build_core.py`: render the inline practice before an optional **Worked explanation and evidence limits** disclosure. Keep the course's four lesson stages and next action unchanged.
- `site/assets/practice.js`: one calculation per family; original prediction, committed recommendation/settings, challenge reveal, revision, bounded restore, and readable export. Existing saved notes must be retained without inventing a past commitment.
- `site/assets/practice.css`: reuse the current theme and semantic figure colors. Do not rely on color alone; label the baseline, changed case, decision boundary, and current selection.
- `site/check_site.py` and `site/test_practice.cjs`: check placement, authored calculation availability, state transitions, numerical consequences, and restored state.
- `site/visual_lessons.py`: complete authored explanations and accessible tables for the six compact figures. These supply public TA evidence without executing the enhancement.
- `site/assets/lesson-figures.js` and `site/test_lesson_figures.cjs`: matching resource, adoption, effort, repair, queue and chart models; state changes; explicit denominators; accessible HTML. Compact figures do not store progress or grades.

The worked explanation is intentionally available as an optional review aid, including before a learner finishes practice. This is a learning activity, not a secure exam. The normal reading order gives the learner a chance to decide before seeing it.

## Acceptance and evidence limits

Verify each activity from its unit's Try step: preserve the first commitment; reveal the matched comparison; retain or revise; export the explanation; reload without losing prior notes. Test incorrect choices, blank or partial records, changed assumptions, keyboard controls, reduced motion, narrow screens, static reading, and print. The course TA must cite the authored explanation and must not claim access to a learner's private activity state.

The calculations above are fictional supplied data and hypothetical changes. They are not partner observations, real customer evidence, causal estimates, validated adoption forecasts, or proof that a solution is safe. Technical checks establish behavior; a learner pilot is still needed to evaluate clarity, time, and learning effectiveness. Release-specific results belong in [the validation record](development-and-validation.md).
