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
node --test test_workbook.cjs test_practice.cjs
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

Technical checks passed: 60 generated HTML pages; twelve-unit/milestone alignment; all local links and anchors; public branding; portable ZIP integrity; 13 workbook tests; 21 practice-model tests; 27 course-TA tests; 6 retained workshop-TA tests; TypeScript; and the production Next.js build. Browser checks covered Start, Learn/Try/Build/Finish, wrong-answer feedback, saved notes after reload, next-unit completion, Unit12 finish, all three activity families, changed numbers, cohort denominators, source/exception workflow, reduced motion, 390px layout, embedded TA context/Escape, and workbook download/restore. Live model responses and production configuration require verification after preview deployment. No real inquiry was sent.

## Remaining educational validation

Recruit representative business learners for a pilot. Observe finding Start, stating the task, reading the chart/table, recovering from a wrong choice, building the artifact, interpreting a changed case, saving/resuming, and finding Finish. Record time on task and help required. Revise from observed difficulties. The37–63hour workload estimate and learning outcomes have not yet been validated by a learner study.

Before each taught offering, settle calendar, team size, partner or classroom client, approved tools/data, submission process, grading weights, accommodations, feedback windows, and partner permissions. These are offering decisions, not extra paths for students.
