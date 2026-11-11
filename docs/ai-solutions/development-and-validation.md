# Building AI Solutions — development and validation

Owner and sole instructor: Majid Memari. Development authorized November 10, 2026 after completion and review of the instructional plan.

## Product contract

One independent business course: twelve ordered units, one continuing capstone, five milestone snapshots. Every unit uses Learn → Try → Build → Finish. Simulations are embedded at the point of instruction. All business disciplines follow the same path. No programming, paid AI account, commercial launch, or real revenue is required.

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

At the owner's request, completed a deeper authenticated UI study of all six reference simulations before access ends. The durable original documentation is indexed at [reference-study/README.md](reference-study/README.md). It contains six case studies, a visual-design guide, an implementation handbook, an original six-record worked example, independent AI review instructions, a coverage report and machine-readable evidence ledgers. It preserves design knowledge rather than the reference's full lessons, data, question bank or application source.

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
