# Repository and online course map

Use this map to find the current source, compare it with the live course, and understand the separate hosting application. The course has one maintained local source and one generated public copy. Historical files are retained for provenance rather than used as active inputs.

The maintained audience is students from any discipline, with no prerequisites: no programming, prior AI or business knowledge, specific-tool experience, or paid AI access is assumed. “Practical AI problem-solving for everyone” is the framing; Building AI Solutions remains the course name. Business cases and economics are explained examples within the common real-world problem-solving path.

## Source ownership

| Concern | Owning file or directory | Generated or online result |
|---|---|---|
| Learner experience and review requirements | `README.md`, `AI_REVIEW_BRIEF.md` | Review of the live course |
| Educational intent and assessment alignment | `INSTRUCTIONAL_DESIGN_PLAN.md` | Twelve-unit sequence and five milestone design |
| Current capability coverage and real-world assessment correction | [Real-world AI redesign](real-world-ai-redesign.md) | Capability/task/check map; Unit 9 resource planning, Unit 10 observed adoption and Milestone 4 impact/adoption criteria |
| Optional textbook decision | `TEXTBOOK_RECOMMENDATION.md`, with earlier research in `TEXTBOOK_SELECTION.md` | Selective reference mapping; no book-purchase or required-reading change |
| Reference-course design research and reconstruction guidance | `docs/reference-study/README.md` | Six case studies, build/visual handbooks, coverage ledgers, worked example and independent review instructions; not public runtime or TA input |
| Application of the reference patterns to current lessons | `docs/SIMULATION_APPLICATION_PLAN.md` | Five decision/challenge/revision contracts inside existing Try activities |
| Lesson prose, objectives, checks, readings, cases, rubrics | `site/course_content.py` | Unit, milestone, case, and reading pages |
| HTML structure and authored supporting-page text, optional book list, resources, instructor guidance, course map, redirects, downloads | `site/build_core.py`, invoked by `site/build_site.py` | `site/dist/` |
| Six inline figure explanations and static fallbacks | `site/visual_lessons.py` | Learn sections in Units 3, 5, 9, 10, 11, and 12 |
| Inline figure models and enhancement | `site/assets/lesson-figures.js`, `lesson-figures.css` | Same six in-lesson figures |
| Guided practice models and linked visualizations | `site/assets/practice.js`, `practice.css` | Try activities in Units 2, 4, 6, 7, and 8 |
| Shared course presentation | `site/assets/core.css` | Course layout, theme, responsive and print rules |
| Navigation, checks, progress, standalone embedded TA panel | `site/assets/site.js` | Learn/Try/Build/Finish and saved study state |
| Native Canvas inline TA placement | `integrations/canvas/build_package.py::lesson_body_html` | Unit-specific assistant disclosure between hosted lesson and native text reading |
| Portable workbook format and safe merge | `site/assets/workbook.js` | Local notes and JSON backup/restore |
| Static, model and delivery checks | `site/check_site.py`, `test_workbook.cjs`, `test_practice.cjs`, `test_lesson_figures.cjs`, `test_delivery.cjs` | Link/alignment checks and 68 workbook/model/delivery tests in the Canvas-profile release |
| Build and browser evidence | `DEVELOPMENT_AND_VALIDATION.md`, `VISUAL_QA_REVIEW.md` | Dated results and remaining validation |
| Canvas asynchronous design and packaging | `integrations/canvas/README.md`, `ASYNC_DESIGN_PLAN.md`, `build_package.py`, `mapping.json` | Twelve modules, 15 native pages, 12 quizzes, five milestone snapshots plus individual exam, six rubrics, four discussions, six editable files and 32 requirements |
| Native quiz questions, explanatory feedback, exchanges, public individual-exam case/rubric | `integrations/canvas/async_content.py` | 36 choice questions plus 12 zero-point project-update essays; three exchanges before the corresponding quizzes; 40-point manually assessed case exam |
| Asynchronous orientation, classroom packet, templates, Home and Syllabus rendering | `integrations/canvas/async_guide.py`, `test_async_guide.py` | Start/support/completion pages, six editable text downloads, canonical full case, fictional worked examples, receiving-course HTML fragments |
| Shared Canvas authored theme | `integrations/canvas/theme.py`, `test_theme.py`, `CANVAS_THEME_PLAN.md` | Inline styles derived from the course CSS and its white Canvas profile; semantic heading emphasis retained through Canvas sanitization |
| Receiving-offering Home and Syllabus sources | `integrations/canvas/canvas-home.html`, `canvas-syllabus.html` | Saved rendered fragments with destination-specific routes and separately retained policies; outside the portable cartridge |
| Dated receiving offerings | [Spring 2027](canvas/offerings/spring-2027/README.md), with `schedule.json` and `render_schedule.py` | Native Canvas dates and Home/Syllabus offering blocks; separate from undated cartridge, Vercel runtime and TA corpus |
| Actual Canvas installation and verification | `integrations/canvas/LIVE_INTEGRATION.md`, `live-verification.json` | Destination-specific IDs, policies, screenshots, observed Student View behavior and limits; not TA input |

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

Visual-learning and Canvas-profile releases have been prepared in `/Users/majid/Documents/GitHub/.worktrees/majidmemari-visual-learning`. Use the exact commits and deployments in the validation record to identify each snapshot; a worktree path alone does not identify the latest release.

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

The Canvas package is a separate source-to-LMS pipeline. Its original readings are generated from canonical curriculum, while its native assessment/guide modules own asynchronous instructions. The package does not import a private marking guide or feed Canvas submissions into the TA. The instructor-only guide remains ignored under `private/`; exclude it from all public documentation mirrors and student artifacts. The public course corpus is not evidence that the TA knows newly added Canvas-specific exam or feedback details.

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
