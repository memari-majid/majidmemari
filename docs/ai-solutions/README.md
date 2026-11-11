# Building AI Solutions

> Documentation mirror in the personal-site hosting repository, refreshed from canonical commit `84d7ee2`. Canonical source: `/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/`. Edit canonical curriculum and documentation first; then refresh these copies. Source paths below refer to that checkout unless identified as hosting paths. See [source-agent guidance](source-agent-guidance.md) and the [Canvas artifact handoff](canvas/README.md).

**Practical AI problem-solving for everyone.** An independent course owned and taught by **Majid Memari**, open to students from any discipline with **no prerequisites**. Learners follow **12 units, one capstone, and five milestones**, using **Learn → Try → Build → Finish**. They discover a need, build a usable AI-assisted solution, test and revise it, develop an offer or adoption case, bring it to users, and hand it over. No programming, prior AI or business knowledge, specific-tool experience, or paid AI access is required.

**Live course:** [www.majidmemari.com/teaching/ai-solutions/](https://www.majidmemari.com/teaching/ai-solutions/)

The directory name is historical. It does not identify the public course, impose an institution, or select an offering. Students across campus use the same path and can apply it to a problem in their field, community, organization, or an emerging business. A partner can supply the problem; Cedar Desk provides the complete classroom fallback. Business cases, economics, and adoption remain practical examples, with the necessary concepts explained in the course.

## Start here

| Your task | Read first | Then inspect |
|---|---|---|
| Review the course and recommend improvements | [AI review brief](review-brief.md) | Live learning path, all 12 units, five milestones, and the actual interactions |
| Understand the educational design | [Instructional design plan](instructional-design.md) | Outcomes, capstone evidence, sequence, feedback, and workload assumptions |
| Find the owning files or connect local and online content | [Repository map](source-map.md) | Source ownership, routes, hosting handoff, and review boundaries |
| Edit, build, or validate course content | [Site maintenance guide](site-maintenance.md) | Current Python sources, seven assets, and workbook, practice, figure and delivery tests |
| Check what was actually tested and released | [Development and validation](development-and-validation.md) | Dated evidence, exact release commits, and remaining learner validation |
| Review readings or design influences | [Current textbook recommendation](textbook-recommendation.md), [earlier textbook research](textbook-selection.md), [reference analysis](reference-analysis.md) | Original core reading remains available in Canvas; optional sources and book selections require access/fit checks |
| Build interactive lessons after reference-course access ends | [Reference study and build handbook](reference-study/README.md) | Six case studies, visual/animation rules, original worked example, review prompt and exact inspection coverage |
| See how the reference patterns are applied to this course | [Simulation application plan](simulation-application-plan.md) | Five embedded decision challenges, authored explanations, state boundaries, and capstone transfer |
| Deliver the course asynchronously through Canvas | [Canvas integration guide](canvas-integration.md), [asynchronous design](canvas-async-design.md) | Native reading alternatives, quizzes/project updates, exchanges, milestones/exam, editable templates, and the separate [installation record](canvas-live-integration.md) |

For an independent review, inspect the live learner experience before reading earlier judgments or test results. Source code, a preview, production, and a learner study establish different things.

## Current source and release

`site/course_content.py` owns lesson text, outcomes, cases, readings, milestone criteria, and rubrics. `site/build_core.py` renders the course; `site/visual_lessons.py` supplies the six inline figure explanations. Current interaction and styling files are in `site/assets/`. [The maintenance guide](site-maintenance.md) lists every active file and command.

`site/dist/` is generated and ignored in this source repository. The separate personal website repository intentionally versions its public course snapshot, release manifest, and generated TA corpus. Do not edit those snapshots to change the course. The [repository map](source-map.md) shows the complete handoff.

Website releases and Canvas installations are verified separately; [the validation record](development-and-validation.md) identifies exact releases and what each check established. The current asynchronous Canvas package has twelve native quizzes, each containing three choice questions and a zero-point project update, in a zero-weight formative group. These replace the earlier standalone check-ins. Three project exchanges precede the corresponding quizzes in Units 3, 7, and 12; a separate optional help forum remains available.

The five milestone groups retain 15/20/25/15/25% weights. Milestone 5 contains a 60-point shared demonstration/handoff and a separate 40-point individual case exam in the same group. Native original readings, six editable templates, a complete classroom case, and an explicit start/feedback/completion guide support the asynchronous route. The Canvas theme and embedded display profile share a native white background with the course's navy, teal, typography, and meaningful figure colors; standalone website presentation remains separately controlled. Source tests and package checks do not establish receiving-instance behavior, learner timing, or learning effectiveness; consult the installation record for actual live observations and limits.

The optional course TA is embedded in lessons and uses public course evidence. It is distinct from the website chatbot and the workshop assistant. The portable lessons work without the TA; assistant use and external readings require internet access.

## Keep these areas separate

- **Current review inputs:** this README, the review brief, repository map, instructional plan, validation record, current source/assets/tests, generated public course, and relevant research notes.
- **Historical planning:** [archive/planning](source-map.md#review-boundaries-and-evidence-order). The old root planning filenames are compatibility pointers, not competing current plans.
- **Retired implementation:** [site/archive](source-map.md#review-boundaries-and-evidence-order). It contains old studios, pathways, and standalone deployment packaging; none is in the active build.
- **Offering operations:** `offerings/`. Dates, enrollment, Canvas identifiers, grades, old assessments, and research configurations do not define this independent course. Do not scan or run those scripts for a general course review.
- **Legacy technical examples:** `domain-examples/`. Optional historical reference, not required student work.
- **Public visual evidence:** [docs/evidence](evidence/README.md).
- **Private operations and instructor assessment material:** ignored `private/`. Account screenshots, configuration records, and the instructor-only exam marking guide are not reviewer inputs, student-cartridge resources, public mirrors, or TA evidence.

The surrounding repository contains other courses and pre-existing work. A clean course review does not require resetting, deleting, staging, or publishing that material. This repository currently has local Git history and no configured remote; the personal website has its own Git and deployment workflow.

## Hosting repository handoff

The hosting repository owns [course synchronization](../../scripts/sync-ai-course.mjs), the [generated public snapshot](../../public/teaching/ai-solutions/), its [release manifest](../../content/ai-solutions-release.json), and the [TA maintenance guide](../../lib/course-kb/README.md). These documentation and Canvas artifact mirrors are not TA corpus inputs or runtime assets. The instructor-only exam marking guide is excluded.
