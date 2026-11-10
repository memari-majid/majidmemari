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
- Saved visual evidence: `course-release.png` beside this document.
- Inquiry settings were requested from the owner. No inquiry was sent.

Technical release verification does not replace the learner pilot described above.

## Inquiry configuration follow-up — November 10, 2026

- Vercel environment-variable connector still returns403. Read-only dashboard inspection found the existing private production recipient, but no Resend key or sender setting. No private recipient value was revealed.
- Added Resend sending domain `mail.majidmemari.com` (domain ID `a7064711-a80f-4023-a6ce-c8938a398f8c`). Added exactly its supplied DKIM TXT and two sending CNAME records in Vercel DNS; existing web/DNS records were preserved. Resend shows Verified with all three supplied records verified. Receiving is disabled.
- Saved production `RESEND_FROM_EMAIL` as the website-notification sender on that domain. Existing `CONTACT_TO_EMAIL` remains in place.
- After explicit action-time approval, created `majidmemari website production` with sending-only permission restricted to `mail.majidmemari.com` (key metadata ID `448429f0-33b8-472f-bf63-bcbf13c16667`). Stored it as the Vercel Production Secret `RESEND_API_KEY`. No credential value is printed, stored in source, or recorded in this document. The temporary transfer variable and clipboard were cleared.
- User clarified to focus on current personal-site needs; no old keys or domains were deleted by this task.
- Verification screenshot: `resend-domain-verified.png`; prepared scope screenshot: `resend-key-scope.png`.

A production redeployment of the current website commit `333cc66c763cd7120f84b490a912212ec9a6d714` was started after saving the key (deployment `dpl_EqLcq4J9vHvkypkXFmRjaS5Ea5Sf`). The newer portfolio changes were preserved.

### Completed production inquiry configuration

Production deployment `dpl_EqLcq4J9vHvkypkXFmRjaS5Ea5Sf` reached READY and was assigned to `www.majidmemari.com`. On the public domain, GET `/api/contact` returned HTTP200 with `available:true`. A same-origin POST with an empty object returned the expected HTTP400 validation response before any Resend send call. The live website chatbot displays the name, reply-address, and inquiry fields with the Send inquiry control enabled. No inquiry or test email was sent; provider acceptance and inbox receipt have not been tested.

`RESEND_API_KEY` is a production-only Secret; `RESEND_FROM_EMAIL` is production server configuration. The existing private production recipient remains in place. No secret values or private recipient address were exposed in site content or documentation. Final configuration evidence: `resend-vercel-configured.png`.

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
