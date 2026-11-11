# Inspection coverage and remaining limits

Inspection date: **November 10, 2026**. Source: the authenticated [six-simulation suite](https://simulations-6620.vercel.app/suite). Reviewers inspected the rendered learner interface, interacted with visible controls, and read the resulting explanations. No hidden application state, repository source, network payloads or deployment configuration was inspected.

## Finite learning structure

| Case | Top-level parts/stages visited | Concept sections inspected | Learning math/method disclosures opened | Business acts completed | Final challenge/practice explanations read |
|---|---:|---:|---:|---:|---:|
| Campaign | 3/3 | 8/8 | 7/7 | 3/3 + result | 7/7 |
| Stockroom | 3/3 | 7/7 | 7/7 | 7/7 | 9/9 |
| Retention | 3/3 | 7/7 | 7/7 | 6/6 | 9/9 |
| Forecast | 2/2 | 8/8 | 5/5 | No separate business-act stage | 23/23 |
| Clustering | 3/3 | 9/9 | 5/5 | 4/4 + debrief | 21/21 |
| Outliers | 3/3 | 11/11 | 7/7 | 4/4 + epilogue | 26/26 |
| **Total** | **17/17** | **50/50** | **38/38** | **24/24** | **95/95** |

The challenge total counts one response and the resulting explanation per final card. It does **not** count every distractor as a separate tested branch, and it does not reproduce the question bank. Correct and incorrect paths were sampled. All 30 inline learning checks were also read: Campaign 8, Stockroom 7, Retention 9, Forecast 6. Clustering and Outliers instead embed other prediction/selection tasks in learning. Business-stage disclosures and evidence checks are described in the individual studies rather than included in the learning-disclosure total.

## What the interaction audit establishes

- The major control families were exercised: range controls, choice toggles, record/point selection, step/run/reset animations, reveals, model/cost comparisons, capacity-limited allocation, recommendation revisions and stage navigation.
- Linked outputs were checked in representative states. Examples include an empty selected set, changed denominators, an impossible/no-model state, exact budget refusal, covariance sign changes, corruption thresholds, and a manual decision compared on the same subset.
- Business paths were followed through their consequences and debriefs. End-of-page color semantics were inspected, including the distinction between a selected row, a per-column best value, correctness feedback, and a completion recap.
- The study records both attractive patterns and problems to avoid: a wrong-label recovery dead end in Clustering; ambiguous unscored wording where correct-answer counters appear; completion recaps that do not establish mastery; and subject-matter claims that require correction or independent verification.
- Stage revisits retained state in observed sessions. A page's statement about persistence or recording is not proof of backend behavior. Reload, cross-device and durable-account persistence were not systematically audited.

## Evidence ledgers

The [study manifest](study-manifest.json) provides a single machine-readable entry point and artifact integrity record.

- [Campaign and Stockroom ledger](campaign-stockroom-coverage.json)
- [Forecast ledger](FORECAST_COVERAGE.json)
- [Outliers ledger](OUTLIERS_COVERAGE.json)
- [Retention and Clustering ledger](coverage-retention-clustering.json)

The ledgers and case studies deliberately retain specific gaps instead of turning broad coverage into a claim of exhaustive numerical testing. If a general statement conflicts with a case's narrower evidence, use the narrower evidence and reconcile the record before claiming more.

## Narrow-screen spot check

At a verified **390 × 844** viewport, the suite and the initial learning view of all six routes had a document width of 390 px: no whole-page horizontal overflow was measured. Wide tables/grids and some tree figures retained larger internal widths, so fitting the page does not prove that all their contents are convenient to use. Suite cards and headings wrapped; the time badges became tall when their text wrapped.

A screenshot of an Outliers concept showed readable prose but very small plot labels. Sampled SVG text bounding boxes were only **6.5 px high** after the figure scaled to a 296 px width. This is a concrete reason to provide adaptive chart typography and accessible numerical alternatives in a new course. It is not a complete contrast, keyboard, touch or screen-reader audit. The temporary viewport override was reset after inspection.

Some background research tabs temporarily reported a zero-width viewport and ignored actions. Fresh tabs/active surfaces resolved that tooling issue. Those failed actions were not counted as observed application behavior or an application defect.

## Explicit exclusions

This study does not establish:

- Every slider value, all parameter combinations, every allocation, every tree path, all random seeds, every distractor, or every intermediate animation frame.
- Independent reproduction of the source datasets, statistical fits, optimizers, package comparisons or all displayed arithmetic.
- Complete keyboard-only access, screen-reader behavior, contrast compliance, zoom/reflow, reduced-motion behavior, every breakpoint, every device or every browser.
- Learning gains, accurate time-on-task estimates, motivation, retention or capstone transfer in real learners.
- The source application's framework, authoring process, model-serving strategy, data storage, authentication, Vercel settings, build pipeline or costs.
- A preserved copy of the source lessons, data, question bank, application or private infrastructure.

## Interpreting “exhaustive” responsibly

The initial study only visited all six pages and sampled their activities. This follow-up substantially closes that gap: it maps the complete accessible finite concept/stage structure, reads all final feedback cards, and samples each major interaction family. It remains a **comprehensive design study with explicit test limits**, not a proof of every possible application state.

The durable result is enough to design original courses with similar instructional mechanisms after source access ends. It is not enough to reproduce the reference's exact numerical behavior or private implementation—and that is not the purpose of this package.
