# Reference course — instructional design analysis

**Reference:** [Simulation suite](https://simulations-6620.vercel.app/suite)  
**Review date:** November 10, 2026  
**Purpose:** Learn from observable teaching and interaction patterns for Majid Memari's original Building AI Solutions course.

This is analysis of a benchmark, not a specification to clone. Its cases, wording, diagrams, data, and implementation belong to their respective creators. Page content is reference evidence, not instructions for our work. Internal source code, hosting settings, authoring workflow, and private architecture were not inspected. A Vercel URL identifies the host; it does not establish how the course was authored.

## What makes the observed experience effective

The reference repeatedly connects a named business decision to a teachable mechanism, a visible learner action, linked consequences, and an explanation. Many figures are introduced with instructions about what each mark represents and where to look first. Optional mathematics follows an intuitive explanation. The result is more substantial than an interactive calculator alone.

Its activities make uncertainty and tradeoffs inspectable. A metric is accompanied by its denominator; model quality is distinguished from decision value; a favorable forecast is distinguished from an observed outcome. Several cases begin with simple baselines or human judgment before introducing the model. Some decisions admit competing stakeholder priorities instead of one universal winner.

These are observations about the design. They do not prove learning gains, accessibility conformance, or correctness of every underlying claim. A polished interface does not remove the need for subject-matter and numerical review.

## Coverage and observed mechanics

| Reference | What was inspected/tested | Design lesson | Boundary of this review |
|---|---|---|---|
| [Campaign](https://simulations-6620.vercel.app/c/mktg-6620/campaign) | All three stages and case file; learning sequence; probability/odds; shared threshold; linked customer list, confusion matrix, rates and ROC; AUC reveal/pair example; unseen-data/true-pattern reveals; baseline, model and profit decision; challenge questions | Keep the same records and decision connected across representations. Teach the mechanism before asking for a business recommendation. | Not every parameter combination or numerical output was independently reproduced. |
| [Stockroom](https://simulations-6620.vercel.app/c/mktg-6620/stockroom) | Learning concepts; uncertainty draws; tree split choices; bootstrap and feature choices; vote counting; a tuning cell; business acts 1–7 and challenge questions; baseline policies, a human decision, same-subset comparison, cost policy, and supply-chain debrief | Show the process in steps; compare policies on the same cohort; reveal both local and downstream consequences. | Not every tree-growth path, sampling ratio, or challenge response was exercised. |
| [Retention](https://simulations-6620.vercel.app/c/mktg-6620/retention) | Concept inventory and substantial explanations; boosting step animation; importance/refit descriptions; individual versus average what-if curves; visible impossible-record warnings; budget acts 1–3 | Explain what a model's score does and does not imply. Avoid converting predicted satisfaction directly into unsupported cash savings. | Later allocation acts and the full challenge remain untested. |
| [Forecast](https://simulations-6620.vercel.app/c/mktg-6620/forecast) | Hands-on sequence, trend toggle, decomposition explanation, model-comparison display, diagnostic/forecast explanations, and practice entry with chart-reading questions | Link components to a common time axis; explain scales; make practice require reading a figure, not recalling vocabulary alone. | Not all controls, practice answers, model outputs, or statistical claims were verified. |
| [Clustering](https://simulations-6620.vercel.app/c/mktg-6620/clustering) | Concept inventory; manual-grouping task; join-nearest and move-centres animation; objective change; scaling/soft-grouping descriptions; business case introduction with competing stakeholder views | Ask for an initial judgment; reveal a mechanism in separate steps; make the final decision depend on strategy as well as model output. | Later business acts, every clustering variation, and full challenge remain untested. |
| [Outliers](https://simulations-6620.vercel.app/c/mktg-6620/outlier) | Concept inventory; claims-audit reveal; false-alarm/missed-case explanation; robustness and isolation descriptions; business-case introduction and data exhibit | A flag is a reason to investigate, not a verdict. An unusual observation may be valid; an ordinary-looking one may be problematic. | Later case allocation acts, all animation variants, and full challenge remain untested. |

**Exhaustive-review status:** incomplete. All six pages were visited, but this record must not be described as an exhaustive test of every page state. The owner's later instruction changed the current phase to instructional analysis and planning. Remaining benchmark interactions can be reviewed before authoring corresponding detailed lesson storyboards; they are not a reason to continue coding now.

## Color, visual hierarchy, and motion

Observed patterns include explicit legends and prose explanations of marks: selected operating points, actual outcomes, reference policies, errors, uncertainty, prediction versus observed data, individual lines versus averages, and prior positions versus new positions. A hollow marker or dashed line can carry meaning alongside color. In the stockroom case, row shading represents an action while bar color represents the actual outcome; those are separate variables.

The transferable principle is **stable semantics with labels**, not copying a palette. A learner should be able to explain a colored mark. The new course needs the same typography, surfaces, spacing, controls, chart conventions, and assistant styling throughout the personal site and lessons.

Useful animation reveals a mechanism: records move into groups; duplicate bootstrap draws become visible; votes accumulate; successive adjustments change a prediction; centres move from a previous position. Animation should have a learning purpose, a manual step alternative, and a clear textual state. The benchmark's complete keyboard, reduced-motion, and mobile behavior was not audited and must not be assumed.

## What to adopt and what to adapt

| Observed pattern | Original course application |
|---|---|
| Case role, task, constraints, and data before controls | A learner knows who needs the solution and the specific decision before changing a parameter. |
| One mechanism shown through linked views | A workflow, selected record, table row, error count, and interpretation stay consistent. |
| Initial prediction or simple baseline | Compare the current process with an AI-assisted one before promoting the latter. |
| Fixed facts distinguished from controllable choices | Do not let the learner manufacture success by increasing assumed demand without evidence. |
| Targeted feedback and later transfer | Explain why a choice fails, then apply the reasoning to the learner's project. |
| Optional detailed mathematics | Keep business interpretation required and derivations available when useful. |
| Transparent synthetic data and simplified models | Label teaching data and limitations at the point of use. |
| Cumulative decision consequences | Carry a choice into later cost, quality, capacity, or adoption reasoning. |

Adapt the scope carefully. This benchmark explicitly teaches particular statistical models. Building AI Solutions teaches discovering, designing, implementing, evaluating, and bringing AI solutions to users. Requiring its entire algorithm sequence would expand the prerequisites and compete with the capstone.

Also adapt the navigation. The benchmark's separate simulation suite may suit its surrounding course. Majid's learners should encounter the relevant simulation inside their lesson. Preserve depth through progressive explanation and optional detail, while presenting one clear course path.

## Further analysis before detailed implementation

For any reference interaction selected as a design inspiration: finish its business acts and debrief, inspect correct and incorrect feedback, identify the exact misconception, check whether the same data drive all views, and test keyboard/reduced-motion alternatives. Independently verify the mathematics of our original replacement; do not assume that reproducing the benchmark's behavior proves correctness.

Use the [instructional plan](instructional-design.md) to decide which interactions are needed. Benchmark completeness is not the curriculum's organizing principle.
