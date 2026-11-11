# Reference study: interactive business simulations

> Documentation mirror in the personal-site repository. The canonical study is maintained at `/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/docs/reference-study/`. Relative links are adapted for this checkout; edit the canonical files first. See the [course ownership guide](../README.md). The manifest below hashes this mirror's bytes, not the canonical files.

**Start here when access to the reference has ended.** This folder preserves original analysis, observed interaction behavior, and practical construction guidance. It is designed to be useful to a future instructor, designer, developer, or AI without the original website.

Reference: [Simulations for MKTG 6620: AI for Business Decisions](https://simulations-6620.vercel.app/suite), credited in its interface to Prof. Himanshu Mishra. Detailed follow-up inspection: **November 10, 2026**. The source was accessed through the authorized learner interface. These notes do not imply affiliation, ownership of the reference, or access to its internal implementation.

## Reading order

| Need | Open |
|---|---|
| Understand the design quickly | This index, then [visual design](VISUAL_DESIGN.md) |
| Build a new original course or activity | [Build handbook](BUILD_HANDBOOK.md) |
| See a complete small example | [Six-record worked example](WORKED_EXAMPLE.md): inputs, calculation, figure/caption, feedback and checks |
| Reconstruct a particular interaction pattern | The six case studies below |
| Know exactly what was inspected and what was not | [Coverage record](COVERAGE.md) and the accompanying JSON ledgers |
| Ask another AI to review the course | [Review instructions](REVIEW_PROMPT.md), then the current [course review brief](../review-brief.md) |
| Understand the current course's actual files and hosting | [Repository map](../source-map.md), then [site maintenance](../site-maintenance.md) |

## Six case studies

| Study | What it teaches us about design |
|---|---|
| [Campaign](CAMPAIGN.md) | Link ranked records, errors, rates, operating points and business value; compare a policy against a baseline |
| [Stockroom](STOCKROOM.md) | Reveal a model in steps, make asymmetric error costs visible, and carry consequences through a supply chain |
| [Retention](RETENTION.md) | Interrupt attractive optimization with data-validity and causal checks before committing resources |
| [Forecast](FORECAST.md) | Build chart interpretation from linked observations, transformations, diagnostics and uncertainty |
| [Clustering](CLUSTERING.md) | Turn grouping into a visible iterative process, then require a strategic choice that the algorithm cannot settle |
| [Outliers](OUTLIERS.md) | Contrast definitions of unusual, show masking and robustness, then distinguish a flag from a judgment |

The common teaching structure is **business need → visible mechanism → learner action → linked evidence → committed decision → consequence → explanation and limits**. The reference varies that structure to suit each topic. The Forecast route has two parts rather than the three stages used by the other five cases.

## How to use the evidence

The [machine-readable manifest](study-manifest.json) lists the reading order, coverage totals and SHA-256 hashes of the study artifacts. It is an integrity record for this research package, not the public course's release manifest.

**Observed** means a rendered section or a resulting UI state was inspected. **Previously observed** refers to the earlier pass documented in [the reference analysis](../reference-analysis.md). **Proposed** means an original implementation or adaptation recommended here. **Unverified** means the study does not establish it.

The goal is comprehensive coverage of the accessible finite learning structure and interaction families. That is different from testing every slider value, random seed, allocation, algorithm path, distractor, device or statistical claim. The [coverage record](COVERAGE.md) states the remaining limits. Do not upgrade a read explanation into an independently validated calculation or a tested learning outcome.

## What survives loss of access

These files retain the section maps, control/result contracts, state transitions, feedback strategies, chart conventions, meaningful color roles, business debrief patterns, original implementation recipes, quality criteria and adaptation guidance. They are plain Markdown/JSON inside the canonical local repository and can be read without an account or a network connection. External citations remain useful but are not needed to understand the build handbook.

This is not a mirror of the original course. It does not preserve its full lesson text, complete question bank, datasets, application source, private infrastructure or authentication. New lessons must use original or appropriately licensed cases, data and wording. The reference's instructional sophistication is an inspiration; its subject-matter claims still need review.

## Fit to Majid Memari's course

The current course is **Building AI Solutions**, owned and taught by **Majid Memari**. It serves business learners across disciplines without student programming. It has one twelve-unit capstone path with Learn → Try → Build → Finish. Simulations belong inside lessons. The course TA uses course evidence; the website chatbot serves the wider website. The shared visual theme remains consistent across both.

This study is a research artifact. It does not itself change the published course, claim a new deployment, add new requirements to the capstone, or make every statistical algorithm in the reference required content. Use the [instructional plan](../instructional-design.md) to select the next improvement.
