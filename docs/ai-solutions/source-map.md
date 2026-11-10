# Repository and online course map

Use this map to find the current source, compare it with the live course, and understand the separate hosting application. The course has one maintained local source and one generated public copy. Historical files are retained for provenance rather than used as active inputs.

## Source ownership

| Concern | Owning file or directory | Generated or online result |
|---|---|---|
| Learner experience and review requirements | `README.md`, `AI_REVIEW_BRIEF.md` | Review of the live course |
| Educational intent and assessment alignment | `INSTRUCTIONAL_DESIGN_PLAN.md` | Twelve-unit sequence and five milestone design |
| Lesson prose, objectives, checks, readings, cases, rubrics | `site/course_content.py` | Unit, milestone, case, and reading pages |
| HTML structure and authored supporting-page text, optional book list, resources, instructor guidance, course map, redirects, downloads | `site/build_core.py`, invoked by `site/build_site.py` | `site/dist/` |
| Six inline figure explanations and static fallbacks | `site/visual_lessons.py` | Learn sections in Units 3, 5, 9, 10, 11, and 12 |
| Inline figure models and enhancement | `site/assets/lesson-figures.js`, `lesson-figures.css` | Same six in-lesson figures |
| Guided practice models and linked visualizations | `site/assets/practice.js`, `practice.css` | Try activities in Units 2, 4, 6, 7, and 8 |
| Shared course presentation | `site/assets/core.css` | Course layout, theme, responsive and print rules |
| Navigation, checks, progress, embedded TA panel | `site/assets/site.js` | Learn/Try/Build/Finish and saved study state |
| Portable workbook format and safe merge | `site/assets/workbook.js` | Local notes and JSON backup/restore |
| Static and model checks | `site/check_site.py`, `test_workbook.cjs`, `test_practice.cjs`, `test_lesson_figures.cjs` | Link/alignment checks and 52 model/workbook tests in the recorded release |
| Build and browser evidence | `DEVELOPMENT_AND_VALIDATION.md`, `VISUAL_QA_REVIEW.md` | Dated results and remaining validation |

The builder uses only current course sources and its seven explicit assets. It does not read historical offering JSON, Canvas records, old studios, private screenshots, or external textbook files. Student-facing text does not come from the old course plans.

## Online pages

Base URL: https://www.majidmemari.com/teaching/ai-solutions/

| Page | Purpose |
|---|---|
| `index.html` or the base URL | Start or continue the one learning path |
| `unit-01.html` through `unit-12.html` | Twelve units, each with Learn, Try, Build, Finish |
| `milestone-1.html` through `milestone-5.html` | Cumulative evidence criteria after Units 3, 5, 7, 10, and 12 |
| `project.html` | Complete project and milestone overview |
| `example.html` | Fictional Cedar Desk packet and supplied evidence |
| `resources.html` | Supporting materials and workbook backup/restore |
| `readings.html` | Focused reading guide and optional books |
| `instructor.html` | Offering preparation and teaching guidance |
| `finish.html` | Final evidence, decision, and handoff |
| `assistant` | Online course TA, also embedded from each lesson |
| `downloads/course-site.zip` | Portable public course, excluding server code and private data |

There are 24 current HTML content pages and 36 legacy redirect pages in the recorded build. Old `module-*`, `assessment-*`, `labs/index.html`, pathways, and studio URLs redirect to the current path. A redirect is not a separate active course component.

## Hosting and TA ownership

The separate repository is `memari-majid/majidmemari` on GitHub. Its source checkout commonly lives beside this repository as `../majidmemari`, but a working directory may contain older or concurrent changes. Inspect `git status`, `git log -1`, `git worktree list`, and the remote branch before using it as release evidence. Do not reset that checkout to match a course release.

The verified visual-learning release was prepared in `/Users/majid/Documents/GitHub/.worktrees/majidmemari-visual-learning`, at commit `1dbee0c6c988d412999d83a95d6ebbfea27ccc68`. Use the exact commit and validation record to identify that snapshot; future releases may differ.

Within a current personal-site checkout:

| Concern | Location |
|---|---|
| Course documentation mirror and orientation | `docs/ai-solutions/` |
| Validated source-to-host copy | `scripts/sync-ai-course.mjs` |
| Generated public HTML/assets/archive | `public/teaching/ai-solutions/` |
| Per-file release checksums | `content/ai-solutions-release.json` |
| Public course text extraction | `scripts/build-course-kb.mjs` |
| Generated TA evidence | `lib/course-kb/generated.ts` |
| Retrieval, prompt, validation, limits, conversation restoration | `lib/course-kb/` |
| Course TA API | `app/api/course-chat/route.ts` |
| Course TA UI | `app/teaching/ai-solutions/assistant/` |
| General website chatbot and inquiry service | `app/api/chat/route.ts`, `app/api/contact/route.ts`, website components |
| Separate workshop TA | `/teaching/agentic-llm` and `app/api/workshop-chat/route.ts` |

The course KB builder extracts the 24 allowlisted HTML pages, preserving public table values, explanations, rubrics, and section links. It hashes the public practice and lesson-figure scripts for change tracking, but does not execute or convert their dynamic models into evidence chunks. Essential reasoning must therefore remain in the authored HTML. It excludes note inputs and does not ingest this review brief, private records, or historical folders.

The course TA's current conversation storage is session-scoped and can survive a reload. The learner workbook and guided practice use separate local storage and exports. None is an instructor submission system. Verify live storage and privacy behavior when reviewing rather than treating these statements as a permanent guarantee.

## Build and release flow

```text
Current lesson and figure sources + seven assets
  → site/build_site.py
  → ignored site/dist/
  → personal-site scripts/sync-ai-course.mjs
  → tracked public snapshot + checksum manifest + TA evidence corpus
  → personal-site tests and Next.js build
  → authorized Vercel release
  → verify exact commit and public-domain behavior
```

[site/README.md](site-maintenance.md) contains executable build/test/sync commands. Local building requires Python's standard library; pure-model tests use Node without installing course packages. A static preview does not run the TA server. Sync writes only the owning personal-site snapshot and regenerates its KB; it is not itself a deployment.

A full source rebuild replaces `site/dist/`. Keep personal notes and hand edits out of that generated directory. The portable ZIP keeps the assistant's absolute online URL; the personal-site sync makes hosted assistant links relative to that deployment so previews use their own TA.

## Review boundaries and evidence order

For a general course review, begin with the live learner experience as described in the review brief, then compare it with the current documents and active source rows above. If live access is unavailable, use the generated pages and state that limitation. Consult research notes for specific claims. Do not start by recursively reading the whole surrounding repository: it contains unrelated courses, offering operations, and protected student material.

`archive/` and `site/archive/` are historical. `offerings/` is operational or historical context. `domain-examples/` contains earlier technical examples. `private/`, credentials, account settings, grading records, submissions, and backups are outside the review scope. Generated `site/dist/` is ignored here; the personal-site public snapshot is intentionally tracked there.

Use instructional intent to assess alignment, source to understand implementation, deployment evidence to establish what shipped, and actual learner observations to judge learning. When those disagree, report the discrepancy instead of silently choosing the most flattering account.
