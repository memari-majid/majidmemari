# Building AI Solutions — development and validation

Owner and sole instructor: Majid Memari. Development authorized November 10, 2026 after completion and review of the instructional plan.

## November 11: capability-based real-world course update

The [redesign plan](real-world-ai-redesign.md) preceded implementation. Required learning now links needs to AI capabilities, no-code execution, checked output, observed use, improvement and supported adoption. Unit 1 explains seven capability families; capability/implementation evidence appears in Milestones 1–2. Units 9–10 and Milestone 4 were refocused from required commercialization to release readiness, impact/resources and adoption. Tables, simulations, feedback, templates, quizzes, rubrics, reviewer instructions and TA sources were aligned. Commercialization remains optional.

Published runtime `3cad64d694f10cca254b2e17852f6bc9b4fa393f` is READY; all 70 public artifacts byte-match the release manifest. Validation passed: 68 course tests, 20 Canvas tests, 40 TA/workshop tests, typecheck and optimized Next.js build. Native Canvas was updated without importing the new cartridge: 12 modules/37 items/32 requirements, all 18 Spring dates, weights and 60+40 final split were read back. Nine changed native criteria matched their source, all six template downloads matched, Unit 1 preview scored 3/3 with the correct capability feedback, and the embedded TA used new source examples correctly. Existing synthetic grades remained 30/60 and 20/40; no real learner work was created or changed. Instructor view was restored; the course remains unpublished.

See the [live record](canvas-live-integration.md) and [structured evidence](canvas/evidence/canvas-real-world-ai-verification.json). Reusable cartridge SHA-256 `16b4366f54b28f45158ab432b3150f39cd8de0dd2db7c8ac4e5e4c8e26566563` was not imported. Earlier installation warnings and releases below are historical. Technical success does not establish learning effectiveness; learner-pilot evidence remains outstanding.

## Product contract

One independent real-world AI problem-solving course: twelve ordered units, one continuing capstone, five milestone snapshots. Every unit uses Learn → Try → Build → Finish. Simulations are embedded at the point of instruction. Learners from any discipline follow the same path, with no prerequisites. No programming, paid AI account, commercial launch, or real revenue is required.

The course is hosted within the teaching section of Majid's personal website. The course TA uses the published course corpus and current page. The website chatbot handles site guidance and provides a separate, explicit inquiry form. AI chat alone never claims to send a message to Majid. The shared cream, navy, teal, and blue theme uses labels and patterns alongside semantic colors.

## Source ownership

- `site/course_content.py`: independent twelve-unit instructional content, five assessment specifications, and original Cedar Desk classroom packet.
- `site/build_core.py`: course shell, navigation, resource pages, milestones, legacy redirects, and portable archive.
- `site/build_site.py`: build entry point.
- `site/assets/core.css`: shared course visual language and responsive layout.
- `site/assets/site.js`: stage navigation, completion markers, workbook controls, and embedded TA panel.
- `site/assets/workbook.js`: validated local workbook, version2 backups, conflict-preserving imports, and version1 note migration without false progress migration.
- `site/assets/practice.js` and `practice.css`: original evidence, quality/review, and value/adoption activity families with linked figures/tables, feedback, transfer, and manual or user-started playback.
- `site/dist`: generated public files only. Build replaces this output; do not hand-edit it.
- `site/archive/build_site_legacy.py`: historical generator retained as reference, not the current build.
- Historical `offerings/` materials remain separate. They do not control current public assessment weights, deadlines, or branding.

The personal website repository owns hosting, API routes, the separate website assistant, inquiry delivery, and course TA retrieval. `scripts/sync-ai-course.mjs` copies a validated public snapshot and hashes release files. `scripts/build-course-kb.mjs` indexes only current public lesson, milestone, and resource HTML. It does not ingest student notes, private files, external textbooks, or old offering data. Interactive practice source is hashed; explanations and assumptions are taught in static HTML so retrieval and offline reading share the same evidence.

## Learning and assessment package

The five milestones occur after Units3,5,7,10,12. Suggested weights are15%,20%,25%,15%,25%. These belong to a new offering; no existing gradebook is changed. The final25% comprises15% demonstration/handoff and10% individual explanation, supported by checks near Milestones3 and5.

The supplied case distinguishes discovery observations, a12-case processing benchmark, an adoption cohort, and a monthly planning forecast. None is a real partner result. Students must collect their own actual user-task evidence, record assistance, revise, and retest. Generated personas or supplied responses do not count as customer demand. Capacity value is kept separate from cash savings.

## Verification commands

Run from the course `site` directory:

```sh
python3 build_site.py
python3 check_site.py
node --test test_workbook.cjs test_practice.cjs test_lesson_figures.cjs
```

Run from the personal website repository after building:

```sh
node scripts/sync-ai-course.mjs ../uvu_courses/courses/cs4720R/site/dist
node --test scripts/test-course-kb.mjs scripts/test-workshop-kb.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

Use the configured Node runtime compatible with the repository. Do not install unrelated updates as part of a content release.

## Release acceptance

Check a fresh Start, all four stages, a wrong-answer explanation, one interaction from each family, changed assumptions, figure/table agreement, saved notes, reload/resume, completion through Unit12, workbook backup/restore, and old-link redirects. Check keyboard focus, mobile width, text/table alternatives, and reduced-motion behavior. Test course TA citations against the actual current corpus, current-unit context, conversation restore/clear, and recoverable unavailability. Test the website chatbot as a distinct service. Inspect inquiry availability without sending an unsolicited test message.

Preview the exact source commit before production. Verify the production deployment's commit and main domain. Record actual results below. A passing technical check is not evidence of improved learning or an accessibility certification.

## Results

Technical checks passed: 60 generated HTML pages; twelve-unit/milestone alignment; all local links and anchors; public branding; portable ZIP integrity; 13 workbook tests; 21 practice-model tests; 27 course-TA tests; 6 retained workshop-TA tests; TypeScript; and the production Next.js build. Browser checks covered Start, Learn/Try/Build/Finish, wrong-answer feedback, saved notes after reload, next-unit completion, Unit12 finish, all three activity families, changed numbers, cohort denominators, source/exception workflow, reduced motion, 390px layout, embedded TA context/Escape, and workbook download/restore. Independent release review found no blocking contradictions between the instructional plan, generated units, milestone rubrics, and worked examples. Preview verification confirmed a live course-TA answer with current-unit citations, correct capacity-versus-cash reasoning, restored conversation after reload, and conversation reset. The separate website assistant returned appropriate audience guidance. At the initial release, preview and production inquiry availability were false and the connector was denied environment-variable access. The follow-up below completed production configuration through the dashboard; the production readiness endpoint now returns true. No actual inbox delivery is claimed. No real inquiry was sent.

## Remaining educational validation

Recruit representative business learners for a pilot. Observe finding Start, stating the task, reading the chart/table, recovering from a wrong choice, building the artifact, interpreting a changed case, saving/resuming, and finding Finish. Record time on task and help required. Revise from observed difficulties. The37–63hour workload estimate and learning outcomes have not yet been validated by a learner study.

Before each taught offering, settle calendar, team size, partner or classroom client, approved tools/data, submission process, grading weights, accommodations, feedback windows, and partner permissions. These are offering decisions, not extra paths for students.

## Production release — November 10, 2026

- URL: https://www.majidmemari.com/teaching/ai-solutions/
- Git commit: `1b90bf3da6a124cb59b7f4b85a6598e33a3fc889`; production deployment `dpl_Chjpf5SuEqGboaVzMqSpbNT4mnE5`, READY, aliased to the personal domain.
- Release checkout: `/Users/majid/Documents/GitHub/.worktrees/majidmemari-course-path`; branch `course/one-path-capstone`, merged into remote main without overwriting concurrent portfolio work.
- Final merged build passed. Live homepage, Unit6 HTML, and interactive-practice JavaScript matched the release hashes.
- Production course TA correctly changed the reviewed total from84 to90 minutes with six added minutes of rework, calculated6.25% reduction against96, and cited the current Unit6 section.
- Production website chatbot also returned correct business-audience guidance and the canonical course URL, independently of the course TA.
- Saved visual evidence: `docs/evidence/course-release.png` beside this document.
- Inquiry settings were requested from the owner. No inquiry was sent.

Technical release verification does not replace the learner pilot described above.

## Website operations boundary

The website inquiry service is separate from the course. Its account-configuration record and screenshots are retained in ignored `private/operations-evidence/`; they are not included in course review inputs. No actual email delivery was tested by the course release.

## Visual-learning upgrade — November 10, 2026

Implemented within the existing lesson path, without adding another navigation mode:

- Guided practice now uses a reply-wait dot plot and ordered median display; a connected AI/human workflow; a twelve-case quality matrix linked to effort, rework, and a stated target; a twelve-person cohort with explicit denominators; and a capacity calculation, cumulative value waterfall, and adoption-sensitivity curve. Figures, matching tables, source details, and feedback share the same model.
- Six compact inline figures in Units 3, 5, 9, 10, 11, and 12 explain complete effort, prototype repair and retesting, scope and contribution, acquisition counts and cost, review capacity and deferred requests, and misleading chart origins. The maintained sources are `site/visual_lessons.py` and `site/assets/lesson-figures.js` / `lesson-figures.css`.
- Figures use labeled semantic colors, noncolor cues, manual steps, keyboard-operable controls, table alternatives, and reduced-motion handling. Compact figures retain complete static explanations and print fallbacks. Fictional observations, hypothetical changes, authority boundaries, capacity value, and cash expense are explicitly distinguished.

Source verification passed **30 practice tests and 9 inline-figure tests**. Together with 13 workbook tests, the full course command passed **52 tests**. The course build and link validation also passed for 60 generated HTML pages. Independent checks passed 4,725 monthly value scenarios, 94 discovery scenarios, 282 dot layouts, 100 quality/rework frames, and 51 compact-figure model states. The review corrected an unsupported discovery-overlap assumption, separated owner authority from draft correctness, removed inactive interaction targets, and clarified live feedback and staff-time valuation. No unresolved material source-level defect was found in the reviewed visuals. Detailed scope, corrected findings, and source fingerprints are recorded in [VISUAL_QA_REVIEW.md](visual-qa-review.md); the full run above includes the subsequently added unrevealed-policy keyboard regression test.

These results cover calculations, source logic, and generated markup. They do not establish browser or screen-reader behavior, production deployment freshness, accessibility certification, or improved learning. The prior release evidence above applies to that release; final browser and release checks for this visual upgrade must be recorded separately. The representative-learner pilot remains outstanding.

### Browser and integration verification

Browser checks exercised all six compact figures and the five guided-practice visuals. Confirmed: changing the longest wait from31 to47 changes the total to88 and mean to11 while median stays6; the emergency workflow can show the explicit unchecked bypass; switching the cohort denominator changes4/12 to4/6 without changing people; six extra rework minutes produce90 total and6.25% improvement;75% adoption produces$120 net capacity value while cash remains−$240, and increasing tools to$300 changes net value to$0 and recurring cash change to−$360. The truncated-axis exercise rejects a75%effort claim and retains the actual12.5%reduction. Keyboard activation, reduced-motion playback suppression, saved practice state, and390px layouts were checked. Wide tables scroll inside the lesson; the page remains within the viewport. No browser console errors or warnings were observed in the checked local pages. This was not a screen-reader audit.

The personal-site sync contains70 verified course files. Its TA corpus contains24 current pages and145 chunks, including static explanations for all six new inline figures.28 course-TA tests and6 retained workshop-TA tests passed, including retrieval of the queue, changed test denominator, and axis interpretation without executing visual JavaScript. The existing separate website assistant and inquiry setup are unchanged.

### Visual upgrade release

- Published commit `1dbee0c6c988d412999d83a95d6ebbfea27ccc68` from the isolated `course/visual-learning` branch after incorporating the latest personal-site changes through `04b0a2f`. The shared checkout was not reset.
- Exact-commit Vercel preview `dpl_3aLe4MxCFHm9KhXYuRpLnCp1NfAq` reached READY. Its Unit11 figure produced150 arrivals,120 reviewed and30 waiting. The embedded course TA correctly explained those counts and the difference between an internal queue and deferred demand.
- Production `dpl_7dqm4Z3RqCvtEyJ1VXisvc94bp8Y` reached READY and is aliased to `www.majidmemari.com`. Final merged Next.js build and TypeScript checks passed.52 course/workbook checks plus34 TA/workshop checks passed.
- Fixed the portable archive’s existing self-download link to point to the hosted archive; no recursive ZIP copy is required.
- Browser autoplay advanced through all six workflow steps with normal motion; reduced-motion mode disabled autoplay.

The instructional structure and assessments remain unchanged. The new visual examples use original cases and implementation inspired by observed teaching patterns in the reference. This release does not claim validated learner outcomes.

Final public-domain checks returnedHTTP200 and byte-identical release content for the homepage, Unit6, Unit11, practice.js, lesson-figures.js and lesson-figures.css. The live Unit12 exercise retained12.5% actual reduction while showing75% visible-length reduction after truncating the origin. The production course TA correctly calculated both percentages, retained12/12 acceptable replies, and cited the current Unit12 material. The published Unit6 visual and linked case matrix were exercised with no console errors or warnings observed. Saved visual evidence: `docs/evidence/course-visual-learning-release.png`.

## Reviewer orientation and repository organization

On November 10, 2026, the independent review brief was rewritten for the current course, and README, scoped AGENTS guidance, a repository/online map, and the site maintenance guide were aligned with actual source ownership. Historical plans and unused website components were grouped into labeled archives. Existing offerings and unrelated course work were preserved. Generated `site/dist/` is ignored in the source repository; the hosting repository continues to track its public snapshot and TA corpus. Account-configuration evidence was separated into ignored `private/`; public course screenshots are in `docs/evidence/`.

After organization, the course built successfully, all 60 generated HTML pages passed link/alignment checks, and all 52 workbook/practice/figure tests passed. All 69 non-ZIP generated files matched the published snapshot after the documented deployment-relative TA URL rewrite; ZIP container timestamps were not compared. Current documentation links were checked. No course behavior was changed by this organization pass. Independent review found no blocking orientation issue; its recommendations to allow evidence-backed simplification, preserve live-first review order, and clarify supporting-page authorship were incorporated.

The repository contains pre-existing offering edits and other work outside this pass. They are not silently staged, reset, deleted, or represented as a clean working tree.

## Reference preservation study — November 10, 2026

At the owner's request, completed a deeper authenticated UI study of all six reference simulations before access ends. The durable original documentation is indexed at [docs/reference-study/README.md](reference-study/README.md). It contains six case studies, a visual-design guide, an implementation handbook, an original six-record worked example, independent AI review instructions, a coverage report and machine-readable evidence ledgers. It preserves design knowledge rather than the reference's full lessons, data, question bank or application source.

The finite inventory reconciles to 17 top-level stages/parts, 50 concept sections, 38 learning math/method disclosures, 24 business acts, 95 final practice/challenge explanations and 30 inline learning-check explanations. Major control families and representative edge cases were exercised; all numerical combinations, random states, distractor branches and statistical implementations were not verified. Selected content cautions were checked against primary documentation, including ADF interpretation, AIC comparability, residual diagnostics and Prophet regressors.

A 390 × 844 viewport spot check covered the suite and all six initial learning pages. Document widths stayed within 390 px; some charts and tables had internal overflow, and sampled scaled chart text was only 6.5 px high. The records distinguish this limited layout check from a full mobile or accessibility audit. The temporary viewport override was reset.

Documentation validation passed: 12 new Markdown files, 4 evidence JSON ledgers, balanced code fences and 35 local documentation links. Independent review reconciled the aggregate counts and found no material contradiction. The original worked-example calculation passed five expected scenarios, 101 threshold-invariant checks, empty/undefined-output checks and invalid-threshold checks. A manifest records the package files and their hashes; it is not a runtime course release manifest.

Only research and orientation documentation changed in this pass. No published course behavior, TA corpus, account configuration or deployment changed. The existing learner pilot remains outstanding. Unrelated offering edits remain outside the focused documentation commit.


## Shared typography alignment — November 10, 2026

At the owner’s request, changed only the shared course `h1,h2` font weight from 500 to 600, preserving Georgia and the existing cream/navy/teal palette. This matches the personal website’s heading weight. Body text, lesson content, assessments, calculations, interactions, and stored workbook behavior were unchanged.

Before the edit, an isolated build of the clean maintained source matched all 69 hosted non-ZIP files after the documented relative-TA URL rewrite, and every portable ZIP member matched the published archive. After the edit, the course build and structural check passed for 60 HTML pages. The standard personal-site sync refreshed the shared CSS, its cache hashes in 24 pages, portable ZIP, release manifest, and TA source digest; the 145 semantic chunks remained the same. All 34 retained course/workshop TA checks passed. ZIP comparison found only the CSS and its 24 HTML cache references changed. Browser visual checks and production release are handled in the owning personal-site task.

Unrelated offering operations remain outside this typography change.

## Applying the simulation study — November 10, 2026

The owner requested applying the completed reference study to the actual course. The [application plan](simulation-application-plan.md) was written before implementation. Five existing Try activities now preserve an initial prediction and recommendation, reveal an original paired evidence challenge, and invite a retained or learner-authored revised recommendation with a reason. The one twelve-unit path, five milestones, shared theme, and embedded placement remain intact.

The new linked comparisons cover reply-wait distributions (Unit 2), human authority (Unit 4), rework and an effort boundary (Unit 6), cohort denominators (Unit 7), and adoption/value/cash (Unit 8). Choice-specific feedback appears before the challenge. Each paired figure and table use the same calculation, units, and comparison. A fixed worked challenge is explicitly separate from current exploration settings. Worked answers moved below practice into optional ordinary-HTML disclosures, retaining a reading alternative and TA evidence.

Original records, current drafts, and saved final responses are distinct. Freeform revision permits practical actions such as keeping the manual process while narrowing and retesting the AI task. Version-2 notes survive migration without invented commitments; Unit 4's old question choices remain labeled as old answers instead of being assigned new meanings. Completion can retain an incomplete-record notice and never asserts mastery. The separate activity export includes unsaved drafts as well as original and final records.

Verification before publishing:

- Course build and structural checks passed for 60 HTML pages, including all five practice-before-worked-explanation placements, links, branding, and the portable archive. All 63 course tests passed: 13 workbook, 41 practice, and 9 inline-figure checks.
- Independent source/model review passed the five numerical contracts, all 15 initial-choice/recovery paths, snapshot isolation, migration, bounded/escaped revision text, exports, and zero-width zero bars. See [the independent review](simulation-application-review.md).
- Browser checks exercised all five challenge routes. Unit 6 preserved a 3-minute original setting after live exploration changed to 6; a new written recommendation and reason survived reload, completed its transfer, and appeared in the downloaded record alongside the original settings. Incorrect recommendations received explanatory feedback. Unit 7 explicitly skipped a prediction and retained its incomplete-record notice after saving the study marker.
- All five paired challenges stayed within a 390 × 844 viewport, with wide tables scrolling inside their containers. Keyboard Enter selected linked scenario evidence; reduced motion disabled automatic playback while preserving manual steps. Unit 4's zero-outcome bar measured zero width. No warning/error console entries were observed in the local checked tab.
- With JavaScript disabled, Unit 6 retained its reading instructions and the native worked-answer disclosure opened to the complete 90-minute/6.25% comparison. Print behavior continues to use the existing disclosure-opening handler; this pass did not perform a full printed-page audit.
- The synchronized website contains 70 public files and 149 TA chunks from 24 current HTML pages. The TA prompt now describes the decision/revision cycle and explicitly denies access to saved choices or live controls. All 35 course/workshop TA tests passed, including natural-language retrieval of the rework, downside, and authority explanations. TypeScript and the production Next.js build passed.

These are technical and source-based checks. Representative-learner usability, time on task, and learning effectiveness still need the pilot described above. The documented design does not turn fictional comparisons into business-partner evidence. Production verification is recorded separately below after release.

### Decision-challenge production release

- Canonical implementation commit: `54556d3`. Hosting implementation commit: `2e456a10551bcb4767902d4229de394ba5ff35b8`, preserving the personal site's concurrent changes through `6b0fec0`.
- Exact-commit preview `dpl_4bLEyvUi3objxpEpQMmP4Xs5SmpX` reached READY. Browser verification exercised the committed Unit 6 comparison and the embedded Unit 8 TA. The TA returned the complete 50%/30% table, separated −$96 net capacity value from −$240 recurring cash expense, cited the course, and correctly denied access to saved activity state.
- Production deployment `dpl_2e2HNz7BxpUXhWjGwixSLfeG2uTV` reached READY for the same hosting commit and was aliased to `www.majidmemari.com`. The live course index, all five changed unit pages, both practice assets, and portable ZIP matched local release hashes. The public learning path loaded successfully.
- A live production TA request returned the 86.4-minute maximum, 90-minute challenged effort, 6.25% reduction, held-fixed 12/12 quality, and a bounded revision/retest next step, with current Unit 6 citations and a normal stream finish.
- Visual evidence: [the updated in-lesson comparison](evidence/course-decision-challenges-release.jpg), captured from the verified exact-commit preview. The documentation mirror in the hosting repository includes the application plan, independent review, and full original reference-study package. It is not part of the learner runtime or the TA corpus.

No student records, existing offering settings, inquiry configuration, or unrelated personal-site features were changed by this release. No messages or inquiry emails were sent to other people.


## Canvas delivery profile · November 11, 2026

Added the opt-in `?delivery=canvas` profile to the maintained course assets and templates. It keeps the four lesson stages, simulations, figures, practice export, and embedded TA while suppressing standalone navigation, personal-site links, local workbook/progress controls, milestone submission callouts, and the local Finish knowledge-check form. Finish instead directs the learner to the Canvas check-in and Canvas Next. Supporting pages preserve the mode and lesson return context; external reading links become source labels. Existing standalone workbook data is not read, overwritten, or deleted by this profile.

The hosting application now passes an explicit Canvas delivery context to the course TA. In that context the TA directs learners to Canvas check-ins/progression, its source citations remain readable labels, and it does not navigate the parent frame or a new tab. Standalone TA navigation remains unchanged. This is a presentation and coaching profile, not Canvas grade passback; native Canvas content and requirements are a separate integration.

Checks completed before release: Python course build and structural/link/branding/archive checks passed; all 68 course tests passed, including five new profile tests for explicit opt-in, same-frame support/anchor navigation, cross-unit/external rejection, preservation of existing workbook data, and unchanged standalone continuation. Hosting synchronization produced 70 public files and 149 public TA chunks from 24 pages. All 37 course/workshop TA tests passed, including Canvas citation and coaching-context checks. A fresh Next.js production build passed. An initial typecheck encountered stale generated types for a concurrently removed publications route; the fresh build regenerated them and the follow-up typecheck passed.

Browser verification of the actual nested Canvas iframe flow and native assessment requirements belongs to the separate Canvas integration record. No learner effectiveness claim follows from these technical checks.


Canvas-profile production verification: canonical profile commit `cf564239070e37879a0a113796b6176a33d7fff9`; canonical public-audience correction `1e33019f9d3cc77d477f54197970699b177f87f6`. Personal-site production commit `8ac13228ccc4415e90040ec7c327c42772e1eca6` includes both the embedded Canvas profile and the latest audience direction: practical AI problem-solving for everyone, students from any discipline, and no prerequisites. The preceding profile-only hosting commit was `1ee09435e823dd1d7f28e6b82794daa437d2893f`; it was superseded before final verification.

Vercel deployment `dpl_8YyksDuFgqTW2NakB9x6r8Az6aVK` reached READY for the production environment and was aliased to `www.majidmemari.com`. Its immutable deployment URL is `https://majidmemari-8lsnrth8a-memari-majids-projects.vercel.app`. All 70 files fetched from the public course domain matched the committed release manifest; the `unit-06.html?delivery=canvas` response matched the same verified static lesson. The course KB source digest is `4781cf33abbe670b249386098d3da3c129b81c8b97041129f1a0294c40e44ddb`.

One real production TA request used Unit 6 and `delivery=canvas`. It returned six grounded course sources and directed the learner to submit the check-in in Canvas and continue with Canvas Next after Finish. This verified the live API/model response; it did not by itself verify the rendered nested Canvas iframe or native Canvas submission/grade behavior. Those UI and LMS checks remain in the integration record. The fresh audience-copy build and follow-up typecheck passed; all 37 TA/workshop checks passed again.

## Verified native Canvas delivery — November 11, 2026

Completed the authorized installation in the selected Canvas shell. The [installation record](canvas-live-integration.md) and [machine-readable observations](canvas/live-verification.json) distinguish package checks, actual Canvas behavior and remaining limits. The reusable builder/package lives in `integrations/canvas/`; it is separate from historical offering scripts and the public TA corpus.

Canvas now contains twelve ordered native lesson pages with embedded Vercel lessons/TA, twelve zero-point formative check-ins, five 100-point milestone assignments with native rubrics, one optional discussion and 29 view/submission requirements. The owner selected 15/20/25/15/25% milestone weights. Weighted grading is enabled, legacy groups have zero weight, and the live instructor/student weight tables total 100%. Eighteen superseded modules and twenty-six older assessments/discussions were unpublished without deleting records or editing existing student grades/submissions. New due dates were not invented; the course remains unpublished.

Student View showed only the twelve current modules and seventeen current assignments. Viewing Unit 6 produced its completed-view indicator while its check-in still required submission. Native Canvas Next opened the correct check-in; file/text/URL choices, the native text editor, student rubric visibility, and the final-grade weights were checked. All twelve check-in configurations and all five native rubric totals were inspected. No assignment response was submitted or graded during these checks; instructor view was restored.

Inside the actual Canvas iframe, lesson stages, the simulation calculation (six extra minutes gives 90 total and 6.25% reduction), Finish guidance, and the nested TA worked. The live TA correctly directed the learner to the Canvas check-in and instructor feedback; its source labels had no outbound links. The home and syllabus welcome everyone with no prerequisites and use Canvas course navigation. Course input means the response/evidence students submit in Canvas; raw simulation events and TA conversations are not automatically copied into it. Screenshots are retained in `integrations/canvas/evidence/`. These are desktop/Student View observations, not a mobile-app, cross-browser, full accessibility or learner-effectiveness study.

## Asynchronous Canvas source and package upgrade — November 11, 2026

This entry records source and package checks for the asynchronous version (v4). The preceding native-delivery entry describes the earlier check-in installation. It does not establish that the newer assessments or theme were live. Current import IDs, exact final package hash, actual test submissions, feedback and grading behavior remain owned by [the live integration record](canvas-live-integration.md) and its machine-readable evidence.

The package retains twelve ordered modules and the existing lesson/simulation path. It adds the original core explanation and worked text/table alternative to each native lesson page. Three support pages provide the course guide, complete canonical Cedar Desk case and editable templates, and completion checklist. The guide includes a literal seven-step first setup, no-prerequisite glossary, supplied-output/no-AI-account route, feedback/revision guidance, actual-reviewer fallback, and clearly provisional workload/support targets.

Twelve native quizzes replace the earlier standalone check-ins. Each has three one-point choice questions with explanatory feedback and a zero-point project-update essay: 36 choice questions and twelve essay fields overall. They sit in the zero-weight formative group and are omitted from final grading. The source distinguishes immediate choice explanations from manual essay review; it does not claim that AI grades the written response. Three ungraded project exchanges in Units 3, 7, and 12 occur before their quizzes, with supplied-sample critique in the project update as a route that does not depend on a peer or forum-post gate. The optional general-help forum remains separate.

The existing five milestone weights remain 15/20/25/15/25%. Milestones 1–4 retain 100-point rubrics. The final group contains the shared 60-point demonstration/handoff rubric (25/20/15) and a separate individual 40-point case-exam rubric (20/20), preserving 15 and 10 percentage points of the full course. The exam is open-materials with disclosed AI assistance, individually authored, and manually assessed. The instructor-only marking guide remains ignored private material, outside the student package, public mirror, runtime and TA corpus.

The current package structure contains 15 pages, 12 quizzes, six assessed assignments/rubrics, four discussions, six editable text files, and 32 view/submission requirements. No due dates, hard prerequisites, minimum practice-score locks, student records or course-wide settings are added. Migration and visibility boundaries are documented in [the integration guide](canvas-integration.md); an import must not be assumed generically idempotent.

The shared [theme helper](canvas/theme.py) derives its colors from the course CSS and Canvas-specific profile. Its current version uses a white Canvas paper/surface, shared navy/teal typography and meaningful figure colors. It emits literal inline styles, a 912px content maximum plus 48px horizontal padding, and semantic strong heading contents. The [theme plan](canvas-theme-plan.md) records receiving-sanitizer findings: both numeric and named CSS font weights were removed, while semantic emphasis survived; repeat rendering is idempotent even if a heading's data marker is absent. Native controls remain Canvas-owned. Saved Home/Syllabus source fragments were regenerated with the white profile, using recorded routes and retained offering policies, with identical visible text to their preceding versions. This source operation is not a claim that the final pages were saved in Canvas.

Checks completed during this documentation closeout:

- All **15 theme and asynchronous-guide tests passed**, covering token drift, semantic/iframe/table preservation, repeated heading rendering, safe routes, all canonical milestone text, six template links, full canonical case preservation, grade/feedback boundaries, and receiving-policy preservation.
- The existing asynchronous cartridge passed the builder's **read-only structural validator**: archive/XML/manifest integrity, native resource counts, completion references, quiz question/feedback configuration, group/rubric arithmetic, theme markers, same-Canvas links, file-discovery/download metadata, and prohibited-content exclusions. No package rebuild was performed by this documentation pass; final theme-only package identity belongs in the installation record.
- The six editable files use Canvas's `web_resources/templates/` discovery path, exported forced-download query parameters, matching file metadata, and UTF-8 byte-order marks. These checks establish package configuration; actual file import/download behavior must be observed separately.
- The private instructor marking-guide path remains covered by `.gitignore`. No private marking content was read, copied into these documents, or staged.

The [current textbook recommendation](textbook-recommendation.md) was checked against official public publisher/resource pages. It proposes selective use of Marily Nika's book and IDEO.org's free field guide; it does not claim paid-book full-text inspection, assign invented page ranges, require a purchase, or change runtime reading requirements.

Live final-theme import, quiz attempts and feedback, manual assessment, responsive/keyboard/print behavior, operational response windows, and representative-learner timing/effectiveness require their own evidence. Do not infer these from a passing package or a matching palette.

## Asynchronous delivery and seamless Canvas profile verified — November 11, 2026

The source/package specification above is now installed and checked in the selected Canvas shell. The current [live installation record](canvas-live-integration.md) supersedes the earlier v3 check-in configuration. It records 12 modules, 37 module items and 32 requirements; native readings and templates; 12 three-choice-plus-project quizzes; three project exchanges plus optional help; five milestone snapshots; and the individual case exam.

Actual Test Student checks covered an incorrect 2/3 quiz attempt with explanatory feedback, a corrected 3/3 retry, manual-essay Pending Review and completed submission requirement, native milestone/exam receipts, rubric grading and student criterion feedback, and a second milestone submission with earlier history retained. Synthetic 30/60 and 20/40 scores produced 50/100 within the final group and 12.5% of the full course when ungraded work was included. Only clearly labeled Test Student QA records were changed; real learner records were untouched.

The last user-directed visual adjustment removes the inset cream website appearance inside Canvas. Both authored Canvas content and the embedded lesson now use white `#ffffff`; the embedded outer lesson border, radius and shadow are removed. The TA uses the same white surface. Actual Canvas saves retained white Home, syllabus, classroom packet and lesson wrapper. Computed iframe body/tokens, border 0px and shadow none were inspected. Native Canvas platform controls remain native, and semantic figure/callout colors retain their meaning. Visual evidence is linked from the live record.

Final package SHA-256: `891ef92210f08cd39bd62018ddbebb9f182ba3f58d15a1401917d739aa25b11c`. Its theme-only 10:33am import retained two notices for the already-assessed handoff/exam rubrics. Their XML, identifiers and point allocation were byte-identical to the preceding complete import; retained native rubrics, feedback, scores and weighting were verified after import. The record describes this as Partially Completed with checked preserved rubrics, not a warning-free import. An isolated rebuild was byte-identical; all package validators and 15 helper/guide tests passed.

Production white-profile runtime commit `f046173356f277c6fa92838e77fbb94bdc1d2153` was followed by TA workflow clarification `32a1a8073d2477fe3550233e086404594c6b4621`, deployment `dpl_Fbhy2Nq6N5XFQFrZchf6hpYBknGf`, READY on the personal domain. All 70 static files matched manifest `9202bb753d49e224dfee4370e8eaa7da2578d3aa63da271dce2fbc4af6adc743`. All 68 course tests, 40 TA/workshop tests, typecheck and optimized build passed. The exact live submission/pending-review question returned direct quiz-field/Submit Quiz instructions, Canvas feedback guidance, and continuation while review is pending. The assistant still cannot read private learner records or supply grades.

Instructor view was restored. The course remains unpublished, with offering dates, facilitator response/revision windows and reviewer availability still to confirm before enrollment. This is desktop/Student View and production-API verification, not a new mobile-app, full accessibility, cross-browser or learner-effectiveness study. The private marking guide remains excluded from all student and public artifacts.

## November 11, 2026 — native inline Canvas TA and simpler embedded lesson

Removed the bottom website help/TA prompt from generated course pages and hid the embedded course header in Canvas mode. The standalone header TA entry remains available. Canvas lesson bodies now place a native collapsible course TA after the interactive lesson and before the complete text reading, using a separate iframe with the exact unit context. The backend, source access, public-course-only privacy boundary and assessment workflow are unchanged.

Source implementation was committed as `e7eeda9`. All twelve native lesson bodies were saved through Canvas’s HTML editor and read back with the correct iframe routes and order. Actual Student View Unit 12 opened the inline assistant and received three final-demonstration reminders with Unit 12 sources. The QA conversation was cleared for the [placement screenshot](canvas/evidence/canvas-inline-ta.jpg); [structured evidence](canvas/evidence/canvas-inline-ta-verification.json) records all twelve pages. The embedded header was hidden, the background remained white, the bottom help prompt was absent, and Canvas Next remained available. Instructor view was restored.

Runtime production is READY at `d907328c88e2b7efe103b96aeab3e77f96561a42`, deployment `dpl_4pnuqm5HtnsSLqGETe3JruJwEdsr`. Manifest SHA-256: `dff3f1c38b014e7f4d1736f1d83b3cf1400b03664fcf57f0d00bee38a1436b72`. All 70 public files matched the release bytes; 68 course tests, 40 TA/workshop tests, TypeScript and the production build passed. The package validators and 15 Canvas helper/guide tests passed.

The rebuilt reusable package SHA-256 is `a061893e367608491e2bf62d916b59342a3730272b419fdb0373d3e168b057d7`. It was **not imported**: only the twelve live lesson page bodies were edited. Its twelve lesson-page ZIP entries changed; all 71 other entries are byte-identical to the last imported package, `891ef92210f08cd39bd62018ddbebb9f182ba3f58d15a1401917d739aa25b11c`. The prior Partially Completed import and two retained-rubric notices remain recorded, as do the previously verified synthetic Test Student grades and feedback. No submission, grade, rubric, publication or real learner record was changed during this placement follow-up. Private marking material remains excluded. This desktop verification does not establish mobile accessibility or learning effectiveness.

## November 11, 2026 — Spring 2027 Canvas offering dates

Added a separate [Spring 2027 offering source](canvas/offerings/spring-2027/README.md): dated JSON, a validating renderer, and native Home/Syllabus fragments. The reusable cartridge, public course and TA corpus remain undated. The saved syllabus includes an 18-row chronological schedule, two project/feedback clinics, March 15–21 spring break, and three suggested exchange dates with the existing sample-critique alternative. Home links to that same-Canvas schedule. The administrative name/code/term remain read-only ODS/2026 metadata; no institutional term reassignment is claimed.

Canvas’s bulk date editor reported a successful save for all 18 current assessments, and Student View confirmed all dates. Twelve quiz/project updates are due at 11:59 p.m. Mountain Time on January 17, 24, 31; February 7, 14, 21; March 7, 14, 28; and April 4, 18, 25. The five milestones are due January 31, February 14, March 7, April 4 and April 25. The 40-point individual exam is available April 29 at 12:00 a.m. and due May 5 at 11:59 p.m., with no Until date. Student View displayed its unavailable-until-April-29 state. No new native due dates were added to the three ungraded exchange discussions. The optional May 2 exam submission and May 4 feedback target do not add a graded deadline; final exam feedback targets May 10 under an explicit exception to the general five-working-day target.

The course time zone was verified as Mountain Time. Native ISO values match America/Denver’s daylight-saving change: Unit 1 `2027-01-18T06:59:00Z` and Unit 8 `2027-03-15T05:59:00Z`. The [schedule screenshot](canvas/evidence/canvas-spring-2027-schedule.jpg) and [structured offering evidence](canvas/evidence/canvas-spring-2027-verification.json) distinguish observed native dates from the authored plan; all 18 native and Student View due values match the schedule JSON. Offering source, Home/Syllabus and evidence were committed as `8070d09`. The renderer checks date/offset consistency and preserves HTML outside its offering blocks. This was a desktop Canvas/Student View check, not a new mobile, accessibility or learner-effectiveness study.

No package reimport or runtime deployment was needed for the Canvas schedule. Source cartridge SHA-256 remains `a061893e367608491e2bf62d916b59342a3730272b419fdb0373d3e168b057d7`; the last imported cartridge remains `891ef92210f08cd39bd62018ddbebb9f182ba3f58d15a1401917d739aa25b11c`, with its two historical retained-rubric notices preserved. The Vercel course manifest remains `dff3f1c38b014e7f4d1736f1d83b3cf1400b03664fcf57f0d00bee38a1436b72`. No grading weights, rubrics, grades, late-work rules, legacy unpublished dates, real learner records or course-publication state were changed. Instructor view was restored; the course remains unpublished.
