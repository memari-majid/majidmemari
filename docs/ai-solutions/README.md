# Building AI Solutions

> Documentation mirror in the personal-site hosting repository, refreshed from canonical course commit `0ffb052`, with the final Canvas review brief from `14560a2`. The canonical source is `/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/`. Source-file paths below refer to that checkout unless explicitly identified as hosting paths. Edit canonical curriculum and documentation first; then refresh these mirrors. [Source-agent guidance](source-agent-guidance.md) describes work in that canonical repository.

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
| Review readings or design influences | [Textbook research](textbook-selection.md), [reference analysis](reference-analysis.md) | Current assigned readings in `site/course_content.py`; external sources may change |
| Build interactive lessons after reference-course access ends | [Reference study and build handbook](reference-study/README.md) | Six case studies, visual/animation rules, original worked example, review prompt and exact inspection coverage |
| See how the reference patterns are applied to this course | [Simulation application plan](simulation-application-plan.md) | Five embedded decision challenges, authored explanations, state boundaries, and capstone transfer |
| Deliver the course through Canvas | [Canvas integration guide](canvas-integration.md) | Reusable cartridge builder, native pages/check-ins/rubrics, approved grading weights, and the [verified installation record](canvas-live-integration.md) |

For an independent review, inspect the live learner experience before reading earlier judgments or test results. Source code, a preview, production, and a learner study establish different things.

## Current source and release

`site/course_content.py` owns lesson text, outcomes, cases, readings, milestone criteria, and rubrics. `site/build_core.py` renders the course; `site/visual_lessons.py` supplies the six inline figure explanations. Current interaction and styling files are in `site/assets/`. [The maintenance guide](site-maintenance.md) lists every active file and command.

`site/dist/` is generated and ignored in this source repository. The separate personal website repository intentionally versions its public course snapshot, release manifest, and generated TA corpus. Do not edit those snapshots to change the course. The [repository map](source-map.md) shows the complete handoff.

The verified November 11, 2026 website release is personal-site commit `8ac13228ccc4415e90040ec7c327c42772e1eca6`. It includes the Canvas display profile and the audience framing for everyone with no prerequisites, building on the earlier decision-challenge release. The Canvas installation uses native pages, twelve formative check-ins, five milestone submissions/rubrics, a discussion, and module requirements. Technical and Student View checks passed; representative-learner timing and learning effectiveness remain unvalidated. The validation record identifies exact deployments and their limits.

The optional course TA is embedded in lessons and uses public course evidence. It is distinct from the website chatbot and the workshop assistant. The portable lessons work without the TA; assistant use and external readings require internet access.

## Keep these areas separate

- **Current review inputs:** this README, the review brief, repository map, instructional plan, validation record, current source/assets/tests, generated public course, and relevant research notes.
- **Historical planning:** [archive/planning](source-map.md#review-boundaries-and-evidence-order). The old root planning filenames are compatibility pointers, not competing current plans.
- **Retired implementation:** [site/archive](source-map.md#review-boundaries-and-evidence-order). It contains old studios, pathways, and standalone deployment packaging; none is in the active build.
- **Offering operations:** `offerings/`. Dates, enrollment, Canvas identifiers, grades, old assessments, and research configurations do not define this independent course. Do not scan or run those scripts for a general course review.
- **Legacy technical examples:** `domain-examples/`. Optional historical reference, not required student work.
- **Public visual evidence:** [docs/evidence](evidence/README.md).
- **Private operations evidence:** ignored `private/`. Account screenshots and configuration records are not reviewer inputs.

The surrounding repository contains other courses and pre-existing work. A clean course review does not require resetting, deleting, staging, or publishing that material. This repository currently has local Git history and no configured remote; the personal website has its own Git and deployment workflow.

## Hosting repository handoff

The hosting repository owns [course synchronization](../../scripts/sync-ai-course.mjs), the [generated public snapshot](../../public/teaching/ai-solutions/), its [release manifest](../../content/ai-solutions-release.json), and the [TA maintenance guide](../../lib/course-kb/README.md). These documents and the Canvas handoff folder are not TA corpus inputs or public runtime assets. The [portable Canvas package and source reference](canvas/README.md) are separate from the destination-specific [live installation record](canvas-live-integration.md).
