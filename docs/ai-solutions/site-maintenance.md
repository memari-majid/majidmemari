# Building AI Solutions site maintenance

This directory is the editable source for the independent course owned and taught by Majid Memari. The current experience has **12 units, one capstone, five milestones, and Learn → Try → Build → Finish** in each unit. Simulations belong inside lessons.

Start with the [course orientation](README.md), [AI review brief](review-brief.md), and [current instructional plan](instructional-design.md). The [validation record](development-and-validation.md) distinguishes completed checks, release history, and the outstanding learner pilot.

**Live course:** https://www.majidmemari.com/teaching/ai-solutions/

## Editable sources

| File | Responsibility |
|---|---|
| `course_content.py` | Twelve lessons, objectives, readings, formative questions, Cedar Desk source packet, and five milestone rubrics |
| `build_site.py` and `build_core.py` | Build entry point, page templates, four-stage navigation, supporting pages, redirects, asset hashes, and portable ZIP |
| `visual_lessons.py` | Static explanations, tables, and enhancement hooks for six inline figures |
| `assets/core.css` and `assets/site.js` | Shared course appearance, navigation, knowledge checks, printing, workbook interface, and standalone embedded TA panel |
| `assets/workbook.js` | Workbook validation, versioned backups, conflict-preserving restore, and readable export |
| `assets/practice.js` and `assets/practice.css` | Guided practice models, linked figures/tables, feedback, and activity state |
| `assets/lesson-figures.js` and `assets/lesson-figures.css` | Six compact interactive explanations; no network, grading, or stored progress |
| `check_site.py` and `test_*.cjs` | Current structural, quantitative, and workbook checks listed below |

The builder imports `course_content.py` and `visual_lessons.py`. It does **not** read offering JSON, Canvas records, archived modules, or private teaching files. Edit these maintained sources; do not edit generated `dist/` files.

`archive/pre-twelve-unit/` preserves the superseded builder, widgets, assets, and tests. `archive/standalone-deployment/` preserves earlier deployment packaging and release notes. They are historical references, not current build instructions. `test-fixtures/workbook-backup.json` is a fictional earlier-edition backup for compatibility checks.

## Build and inspect locally

Run from this directory:

```sh
python3 build_site.py
python3 check_site.py
node --test test_workbook.cjs test_practice.cjs test_lesson_figures.cjs test_delivery.cjs
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8765/. Python's standard library builds the static course without credentials or network access. A suitable Node.js runtime runs the pure-data tests; students do not need Node or programming tools. The current test set contains 68 checks: 13 workbook, 41 practice, 9 inline-figure tests, and 5 delivery-profile tests.

The builder replaces only `dist/`, which is generated and ignored by Git. Current output includes 24 main content pages, 36 compatibility redirects, seven maintained assets, two text downloads, and the portable ZIP. Retired `module-*`, `assessment-*`, and `labs/index.html` routes are redirects, not another learner path.

Browser verification should cover Start/Continue/Finish, all four lesson stages, changed inputs, wrong-answer explanations, figure/table agreement, source-linked cases, keyboard focus, reduced motion, mobile width, local save/reload, backup/restore, and printing. Pure-data tests cannot establish usability, accessibility certification, or learning effectiveness.

## Visual learning

Guided practice appears in Units 2, 4, 6, 7, and 8: discovery evidence, source checking and human authority, complete effort versus quality, cohort denominators, and capacity versus cash. Three model families serve these five lesson placements; this is not a separate simulation suite.

The [simulation application plan](simulation-application-plan.md) defines the decision cycle: record a prediction, explore linked evidence, commit a recommendation and its settings, reveal a fixed worked challenge, then retain or revise with a reason and a capstone implication. The challenge comparison is labeled separately from the learner's live settings. A complete worked table and explanation follows each practice in an optional disclosure; it remains available to printing, static readers, and the course TA.

Inline figures appear in Units 3, 5, 9, 10, 11, and 12: complete effort, repair/retest, offer scope, acquisition, review queues, and misleading chart origins. Keep static explanations, dynamic calculations, tables, and evidence limits consistent. Fictional supplied observations, hypothetical changes, and actual learner evidence are distinct.

## Canvas delivery profile

Append `?delivery=canvas` to a unit URL when embedding the lesson in Canvas. This is an opt-in presentation profile; public standalone URLs retain the normal website navigation and workbook.

The profile keeps Learn → Try → Build → Finish, linked figures, simulations, and practice exports. It hides the entire embedded website header, learning-path and unit-continuation links, milestone submission callouts, standalone knowledge-check form, and local workbook/progress controls. The former bottom help/TA prompt is removed from generated course pages in both delivery modes. In Canvas, the native lesson page supplies a collapsible **Course TA — work through a question** section after the lesson iframe and before the complete text reading. Its separate same-origin assistant iframe receives the exact unit context; students no longer open the TA through a modal inside the lesson iframe. `integrations/canvas/build_package.py::lesson_body_html` in the course root owns this placement. The standalone website retains its header TA entry. Finish directs the learner to the Canvas check-in and Canvas Next. The standalone workbook is neither read nor overwritten in this mode; existing notes are preserved. Practice interactions remain learning aids, not Canvas submissions, grade records, or evidence that a module requirement was completed.

Supporting case/project/reading/resource pages stay in the frame and retain `delivery=canvas` plus a validated `canvasLesson` return context. External references become readable source titles, not links that open another website. The embedded course TA receives the Canvas delivery context, explains sources inside its conversation, and renders source citations as labels. It does not expose a separate assistant-page link in this mode. Canvas owns the authoritative sequence, check-ins, submissions, instructor feedback, completion, and grades; this profile is not an LTI grade-passback integration.

The course and TA need JavaScript for this embedded interactive experience. Canvas embedding, iframe permission, page height, native module requirements, and assessment setup are configured and verified separately by the Canvas integration workflow.

## Workbook and printing

The course workbook uses browser key `building-ai-solutions-v2`. Progress markers, preparation checks, notes, and lesson position remain on that browser and origin; they are not submissions or grades. Resources provides a version-2 JSON backup and readable text export. Imports preserve differing notes; invalid or oversized merges fail without replacing saved work. Earlier-edition import preserves notes without mapping old completion marks to new units.

Guided practice has separate keys, `ai-solutions:v2:practice:<unit>:<family>`, and its own export/reset controls. A workbook backup does not contain those activity records. Clearing browser storage or changing origin can separate or remove local work. Use fictional notes for testing.

The decision-cycle update uses a version-3 activity record in the existing practice key. Earlier version-2 notes are preserved without inventing a prior commitment. Original commitments and final responses are separate from editable exploration settings. The readable practice export records those distinctions. Finishing an activity is a study marker, not a score or proof of mastery.

Browser Print shows all four lesson stages and opens worked-answer disclosures. Inline figures print their complete static worked explanations instead of a partially revealed animation. There is no maintained `course-print.html` reader in this edition.

## Publish through the personal website

The separate personal-site repository owns hosting, server routes, and the TA. Use a clean, current checkout or isolated worktree of `memari-majid/majidmemari`; do not overwrite an existing checkout's unrelated edits.

After the course build and checks, run from that personal-site checkout:

```sh
node scripts/sync-ai-course.mjs /absolute/path/to/uvu_courses/courses/cs4720R/site/dist
node --test scripts/test-course-kb.mjs scripts/test-workshop-kb.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

The sync validates the public snapshot, replaces only `public/teaching/ai-solutions/`, writes `content/ai-solutions-release.json`, and regenerates `lib/course-kb/generated.ts`. It does not deploy. Follow the personal site's current release workflow; verify the exact commit, deployment, public content, and TA after publishing.

The TA builder indexes the 24 current public HTML pages, retaining headings, tables, rubrics, and authored worked explanations. It hashes `practice.js` and `lesson-figures.js` for freshness but does not execute them or derive live learner input from them. Keep required simulation reasoning in the HTML. Navigation, note inputs, private records, and this repository's review instructions are excluded.

The embedded course TA receives the current lesson and conversation, retrieves course passages, and uses an online AI service. It cannot inspect the workbook or live figure settings unless the learner describes them. Its conversation uses browser session storage and can survive reload; this is separate from workbook backups and provider processing. The general website chatbot has a separate contact role.

## Portability and private material

For another static host, copy the contents of `dist/`, preserving relative paths. The downloadable ZIP contains only public course output. A local HTTP server is recommended. Lessons and worked explanations remain readable without JavaScript; interactive controls require it.

The portable course links to the online TA and external readings. It does not include server routes, credentials, model access, or an offline assistant. Personal-site synchronization changes TA links in hosted HTML to the same deployment; the portable ZIP retains the absolute public TA address.

Keep environment files, deployment credentials, private operations evidence, offering records, student data, and archived material outside `dist/` and release uploads. The public course uses Building AI Solutions and Majid Memari only, with no institution-specific identity, course number, public email address, or fixed offering calendar.
