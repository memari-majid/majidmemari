# Canvas course integration

The November 11 installation and Student View checks are documented in [LIVE_INTEGRATION.md](canvas-live-integration.md). Its operational metadata and screenshots are distinct from the portable package and source validation below. The maintained course welcomes everyone, from any discipline, with no prerequisites.

This folder builds the Canvas delivery and assessment structure for **Building AI Solutions by Majid Memari**. Students follow the ordered Canvas modules, work through the lessons and simulations inside Canvas, submit their work in Canvas, and receive instructor feedback there. The maintained lesson application remains hosted on Majid Memari’s website and is displayed within the Canvas lesson pages.

## Current package

`building-ai-solutions-canvas.imscc` contains:

- Twelve ordered modules with twelve **native Canvas lesson pages**. Each page embeds its corresponding lesson using `?delivery=canvas`. The course’s Canvas display mode provides the lesson and its integrated AI TA without the independent website navigation. The native wrapper has no external navigation link or new-tab call to action.
- Twelve **native Canvas unit check-ins**, each zero points, Complete/Incomplete, and omitted from the final grade. A learner submits a concise project update, explains the unit’s canonical Finish question, and identifies a limitation and next action. These are formative responses in one continuing project record, not twelve additional papers.
- Five native milestone assignments after Units **3, 5, 7, 10, and 12**, with the canonical brief, evidence checklist, and full rubric table.
- Five native rubric associations, each totaling 100 points. Canonical criteria and “meets”/“stronger evidence” anchors are preserved. Free-form scoring/comments and technical zero/maximum bounds support editable Canvas rubrics without inventing intermediate achievement thresholds.
- One optional, ungraded discussion, **Course questions and project exchange**, after the Unit 1 lesson. It supports shared questions and structured peer feedback. Private assessment questions use Canvas Inbox; the integrated course TA explains course material. Posting is not required for completion.
- **29 native module requirements:** view each of the twelve lesson pages, submit each of the twelve check-ins, and submit each of the five milestone assignments. There are no hard prerequisites or sequential gates.

Each module follows **Lesson → Unit check-in → Milestone when due**. The optional discussion appears between the Unit 1 lesson and its check-in. Canvas Next/Previous controls provide the course path. The lesson itself retains Learn → Try → Build → Finish.

## Authorized grade policy

The five 100-point milestone assignments count toward the final grade through five separate weighted assignment groups:

| Milestone | After unit | Course weight |
|---|---:|---:|
| 1. Problem and feasible scope | 3 | 15% |
| 2. First usable solution | 5 | 20% |
| 3. Pilot and learning | 7 | 25% |
| 4. Viability and route to users | 10 | 15% |
| 5. Demonstration and handoff | 12 | 25% |

These weights were explicitly selected for the receiving course on 2026-11-11. Each milestone has `omit_from_final_grade=false`. The twelve zero-point check-ins remain omitted and sit in a zero-weight formative group. The originally imported milestone group identifier is retained for this formative group; the five milestones keep their original assignment and rubric identifiers while moving to their new weighted groups.

The cartridge supplies assignment-group weights but does not change the course-level weighted-grading setting or existing legacy groups. Configure weighted grading and set unrelated legacy group weights to zero separately in the receiving course, then verify that the five current milestone groups total 100%. Preserve existing submissions and grades. The 40% individual component within Milestone 5 uses evidence from the checks near Milestones 3 and 5; it is not graded twice.

Assignments accept file upload, text entry, or website URL with unlimited attempts. No due, unlock, or lock dates are included. The instructor publishes the actual calendar, submission/team arrangements, feedback windows, and accessibility arrangements before teaching.

## Rebuild and structural validation

This is a documentation mirror. The [artifact handoff](canvas/README.md) includes the package, mapping and builder source reference. Run the command below in the canonical `integrations/canvas/` directory, where its curriculum dependency exists; do not run the reference copy from this hosting checkout.

From this directory:

```sh
python3 build_package.py
```

The Python-standard-library builder imports `../../site/course_content.py`, validates the canonical content, and regenerates the cartridge plus `mapping.json`. The mapping records titles, identifiers, placements, approved weights, curriculum fingerprint, and current package SHA-256. Fixed ZIP timestamps make unchanged inputs reproduce the same archive bytes.

Built-in validation checks ZIP integrity and safe paths; XML parsing; all manifest references and dependencies; twelve native page identifiers and exact `delivery=canvas` iframe URLs; absence of external wrapper/assignment anchors; seventeen assignment types, points, omission flags, and absent dates; six group weights and assignment placements; 29 correct completion requirements; an optional ungraded forum; and rubric point totals and technical bounds. It rejects course-settings/syllabus overrides and prohibited identity/secret strings. These are structural checks, not full external XSD validation or proof of a successful receiving-instance import.

The package contains no course settings, replacement syllabus, enrollments, grades, messages, student records, credentials, announcements, or institution-specific branding. It does not change the overall course publication state.

## Import and live verification

1. In the intended Canvas course, open **Settings → Import Course Content** and select **Canvas Course Export Package**. Import the `.imscc` file. No date adjustment is needed.
2. Wait for completion and inspect reported issues before retrying.
3. Confirm exactly twelve current modules in Unit 01–12 order, twelve lesson pages, twelve check-ins, five milestones, five rubric associations, and one ungraded discussion. An existing shell can retain older content; manage its visibility separately.
4. Open a native lesson page from a module. Confirm the lesson remains inside Canvas, the four stages and interactive figures work, the course TA responds inside the lesson, and Canvas Next moves to the next module item. Check the released Canvas display mode, not only the public standalone website.
5. Check each lesson’s view requirement, each check-in’s submit requirement, each milestone’s submit requirement, and the absence of prerequisite/sequential gates. A discussion reply must not be required.
6. Inspect check-ins for zero points, Complete/Incomplete feedback, final-grade omission, file/text/URL options, unlimited attempts, and no inherited dates. Inspect milestones for 100 points, inclusion in final grading, the correct weighted group, complete criteria, and a matching native rubric totaling 100 points.
7. Verify course-level weighted grading, zero-weight legacy groups, and the five active weights totaling 100%. Verify schedule and course publication state separately.
8. Test a fictional student submission/feedback/progress flow only through the institution’s approved testing arrangements. Do not manufacture learner submissions or infer learning effectiveness from a successful import.

Stable migration identifiers let Canvas’s importers match existing modules, module items, assignments, groups, and rubrics. The former external lesson items retain their module-item identifiers and are retargeted to new native Canvas pages. The official module importer passes an existing content tag into `add_item` with the new page type. Confirm actual record IDs and counts after import; do not assume generic repeated imports are idempotent. Imports can overwrite imported content, reorder modules, or remove missing imported module items. This package preserves the prior current-course module/item/milestone/rubric identifiers and adds check-ins/pages rather than replacing legacy records by title.

`canvas-home.html` and `LIVE_INTEGRATION.md`, when present, document the separately configured receiving course. The homepage can contain destination-specific Canvas Modules or Assignments links. Update that course ID before reusing the homepage elsewhere; it is outside the cartridge.

## Progress, learner input, and feedback

A Canvas `must_view` requirement records opening a native lesson page, not completing the simulation or mastering its concepts. A `must_submit` requirement records receipt of a Canvas submission, not completeness, correctness, grading, or mastery. No module requirement depends on receiving a particular grade.

The unit check-ins put the learner’s project update, quantitative reasoning, and next decision in Canvas. Native assignment history, instructor comments, Complete/Incomplete feedback, milestone scores/rubrics, and module progress remain available through Canvas. Course practice is formative; submit relevant observations or an optional activity export as supporting evidence. The lesson application does not automatically send its slider state, local practice history, or AI TA conversation to Canvas.

The course AI TA is inside each lesson frame and uses the public course corpus and lesson context. It cannot read Canvas rosters, grades, submissions, check-ins, or private feedback, and it does not make assessment decisions. Shared course questions use the discussion; private matters use Canvas Inbox.

Embedded Canvas and direct website visits may have separate browser storage partitions. Canvas is the submission record for this offering; browser-local application storage is not its gradebook or submission record. The Canvas display mode directs learners to the native check-in for input and progress. The package has no LTI identity exchange, single sign-on, automatic grading, or grade passback. Supported student browsers, mobile delivery, and another institution’s Canvas settings need their own preflight.

## Format references

The cartridge uses Common Cartridge 1.1 with Canvas metadata extensions, checked against Instructure’s public source at commit `1c9f0bb8013ed69c4f2efe11fd483025469b7e6c` on 2026-11-11. No exporter code or external course content is included:

- [Official Canvas export fixture, including native wiki page metadata](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/spec/fixtures/exporter/cc-with-modules-export.imscc)
- [Module export metadata and completion requirements](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/module_meta.rb), [module converter](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/importer/canvas/module_converter.rb), and [module/item import matching](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/app/models/importers/context_module_importer.rb)
- [Assignment settings](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/assignment_resources.rb) and [assignment importer](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/importer/canvas/assignment_converter.rb)
- [Discussion resources and metadata](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/topic_resources.rb) and [discussion importer](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/importer/canvas/topic_converter.rb)
- [Native rubric metadata](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/rubrics.rb) and [rubric importer](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/importer/canvas/rubrics_converter.rb)

All twelve mapped public lesson URLs returned HTTP 200 during preparation. The receiving-course record must distinguish source/package checks from observed import, browser, submission, and grading behavior.
