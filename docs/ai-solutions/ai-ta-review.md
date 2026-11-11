# AI TA decision-lab review — 11 November 2026

**Course:** Building AI Solutions · Majid Memari

**Scope:** Twelve unit-specific labs inside Try, their coaching, saved reasoning, export, and Canvas delivery. The labs rehearse **Decide → Investigate → Revise → Apply** and feed the existing project update; they are not new graded assignments.

**Status:** Reviewed, repaired, deployed and checked in the sampled core flows. Exact coverage and remaining limits are recorded below.

- Final commit: **a87c5a4ada8bc1a7a84471f0f2f2f6ab8b412de4**
- Final deployment / READY state: **dpl_5zHrQ2iXLJaCkxwjCXszKDw7XRXj — READY, production**
- Final embedded export/copy check: **Readonly 1,118-character reasoning snapshot and full text selection verified inside Canvas; no download receipt claimed.**
- Final Canvas state / instructor view restored: **Instructor view restored; overall course remains unpublished. No new quiz attempt or grade entry.**

## Findings and repairs

| Finding | Repair and evidence |
|---|---|
| Coaching could lose a pending or partial response when its panel collapsed. | Reproduced and repaired the conversation/state handling. A full Unit 1 cycle subsequently exercised actual feedback and reload. Pending/partial state is distinct from a completed response. |
| Coaching could expose later worked material too early or present old feedback as if it addressed the current step. | Tightened phase-specific context and feedback labeling. Reviewed the server/client contracts and sampled live replies; this does not guarantee every future model response. |
| Opened evidence cards were not reliably restored. | Added validated restoration. Canvas Unit 8 retained the revealed cards after reload. |
| Long learner reasoning could create horizontal overflow on mobile. | Corrected wrapping. At the tested 390 px viewport, document width was 375 px with no horizontal overflow. Keyboard operation of evidence controls was also checked. |
| Generic course questions and milestone help could inherit the wrong entry context. | Corrected selected-unit and milestone entry handling. Tested milestone help and sampled production answers with explicit lesson context. |
| Canvas advice could send students directly to a quiz when a project exchange comes first. | Preserved **Lesson → Exchange when listed → Practice quiz/project update → Milestone when due**. The Unit 3 production check returned the exchange-before-quiz order. |
| Unit 12's worked answer implied quality had been demonstrated although its mini-case supplied only effort data. | Made the recommendation conditional on verifying that both methods meet the same quality threshold; acceptable-output counts are explicitly unprovided. The 12.5% effort calculation remains correct. |
| The complete native Canvas text alternative omitted the new labs. | Added all twelve static lab routes from the same canonical JSON: scenario, choices, evidence, challenge, worked reasoning and project application. All twelve native fallbacks were read back exactly. They retain two course frames, no outbound native anchors, and no additional assessment. |
| An embedded export attempt could report success without an observed download. | Unit 1's standalone export produced a real file. The embedded download was not observed, so the final candidate adds a visible copyable reasoning fallback and truthful attempt wording. The final Canvas check verified the readonly snapshot, all initial/revision/action fields, and complete selection for the device’s Copy command without leaving Canvas. |

## What was verified

- **Live learning flow:** Unit 1 completed all four phases with actual AI feedback, saved reasoning, reload and a downloaded reasoning file.
- **Canvas:** Unit 8 coaching interpreted capacity value versus cash correctly; evidence cards survived reload. All twelve native no-AI routes matched their authored content. No new grade entry or quiz attempt was made during this review.
- **Production checks:** The sampled deployment was READY; all 71 public artifacts matched its manifest. Three sampled AI responses covered current-unit behavior and Unit 3 navigation. Exact checks and release identifiers are in [the production checks](canvas/evidence/ta-review-2026-11-11/production-checks.json). The final UI-only export repair retains the same server and static course artifacts; its READY identity is above.
- **Content:** All twelve authored labs were reviewed for unit alignment, beginner/no-code scope, fictional-data labels, worked routes and project transfer. Numerical examples were independently checked, including complete effort, percentage points, cash versus capacity, resource allowances and queue growth.
- **Automated validation:** 57 TA/workshop tests, 71 site Node tests, six textbook-reading Python tests and 25 Canvas tests passed. TypeScript and the optimized Next.js build passed.

Canvas continues to own submissions, instructor feedback, progress requirements and grades. Browser-tab practice and AI feedback do not establish correctness, mastery or a Canvas submission. The course TA remains separate from the website chatbot and does not gain access to private Canvas records.

## Remaining limits

A representative student pilot is still needed to evaluate learning gains, workload and transfer to a real project. This review did not certify accessibility or cover every assistive technology, browser or native Canvas mobile-app behavior. Mobile browser and keyboard checks were sampled. Model responses remain variable and should be assessed against sources and the stated evidence boundaries.

## Source ownership

- **Canonical curriculum and Canvas renderer:** `/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/`. The authored lab source is `site/ta_activities.json`; `integrations/canvas/build_package.py` supplies the native text alternative.
- **Hosted application and course TA:** `/Users/majid/Documents/GitHub/.worktrees/majidmemari-visual-learning/`. The interface is under `app/teaching/ai-solutions/assistant/`; server, validation and saved-conversation logic are under `lib/course-kb/`.
- **Content/build evidence:** [content/build checks](canvas/evidence/ta-review-2026-11-11/content-build-checks.json), [native fallback readbacks](canvas/evidence/ta-review-2026-11-11/native-reading-checks.json), and [browser checks](canvas/evidence/ta-review-2026-11-11/browser-checks.json). These are implementation and delivery evidence, not learner-effectiveness results.

## Review evidence

- [Canvas live coaching](canvas/evidence/ta-review-2026-11-11/canvas-live-coaching.png)
- [Selectable Canvas reasoning record](canvas/evidence/ta-review-2026-11-11/canvas-copyable-record.png)
- [Mobile long-reason check](canvas/evidence/ta-review-2026-11-11/mobile-long-reason.png)
- [Native route and corrected quality assumption](canvas/evidence/ta-review-2026-11-11/canvas-quality-assumption.png)

The rebuilt reusable Canvas cartridge is `3c693767d7be2a33446b05cb5552cce5032bb11463b22f79865243af47988c4c` and was **not imported**. The twelve native page bodies were updated through the HTML editor in place; published state, assignment/submission records, rubrics, and grade settings were not edited. The existing last-imported package and used-rubric notices remain historical.
