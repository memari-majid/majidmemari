# Canvas course integration

> Mirrored guide. Run the builder and its tests in the canonical course integration directory. The [source-reference copies](canvas/README.md) depend on canonical curriculum and CSS that are not bundled into this documentation folder.

This folder builds the complete Canvas delivery and assessment structure for **Building AI Solutions by Majid Memari**. Students follow one ordered path, study original readings, use the embedded figures/simulations and course AI TA, submit work, and receive feedback inside Canvas. The course welcomes learners from any discipline with no AI, programming, statistics, or business prerequisite.

See `ASYNC_DESIGN_PLAN.md` for the instructional specification and `LIVE_INTEGRATION.md` for the receiving-course state actually observed. Building a package does not by itself establish import success, teaching readiness, accessibility certification, or learner effectiveness.

## Sources and build

| Source | Responsibility |
|---|---|
| `../../site/course_content.py` | Twelve canonical lessons, source case, project prompts, Finish questions, and milestone criteria |
| `../../site/visual_lessons.py` | Original static figure explanations and tables; the native text fallback needs no script |
| `async_content.py` | 36 choice items with per-choice feedback, 12 project-response prompts, three structured exchanges, and the student-facing individual case exam |
| `async_guide.py` | Start/support guide, complete Cedar Desk packet, six editable text templates, completion checklist, and reusable homepage renderer |
| `theme.py` | Inline Canvas presentation derived from the canonical course stylesheet; no global Canvas restyling |
| `build_package.py` | Native page, QTI quiz, discussion, assignment, rubric, file, and module packaging and validation |

From this directory:

```sh
python3 build_package.py
```

Python’s standard library builds `building-ai-solutions-canvas.imscc` and `mapping.json`. The mapping records identifiers, placements, grading policy, source fingerprints, theme version, retired check-in identifiers, and archive SHA-256. Fixed ZIP timestamps make unchanged sources reproduce identical archive bytes. Do not hand-edit the cartridge or mapping.

The instructor-only exam marking guide is kept in ignored private course material. It is not a build input and must remain outside the student cartridge, public course ZIP, website, and course TA corpus. Public source content includes the case questions and rubric, not a private marking guide.

## One course path

The package contains 12 modules and 15 native Canvas pages: twelve lesson pages plus **Course guide**, **Cedar Desk case and project templates**, and **Course completion**. Unit 1 begins with the guide, the optional **Cedar Desk case and editable templates (reference)** item, and the lesson; students read the approved source card first and return to the other materials when prompted. The reference item adds no completion requirement. Templates are also linked from the lessons. Completion is the final Unit 12 item. There is no thirteenth module or separate simulation destination.

Each lesson page places the hosted lesson in `delivery=canvas` mode first, a native collapsible **Course TA — work through a question** section second, and the complete original text lesson in a disclosure third. The TA uses its own same-origin iframe with `lesson=unit-XX.html&embed=1&delivery=canvas`, retaining exact unit context inside Canvas. It is inline native page content, not a modal inside the lesson iframe. The embedded lesson header is hidden and the former bottom help prompt is removed. The text includes outcomes, Learn prose, static figure/table explanations, Try examples and worked reasoning, Build instructions, Finish reasoning, and optional reference citations. It remains usable when the embedded application or TA is unavailable. Students are told to **open the text lesson before printing**; native Canvas pages cannot run the website’s automatic print-expansion script. The source case and editable project materials are available natively, with six same-Canvas text-file downloads. Optional external references are printed as citations, not required navigation links.

The recurring route is **Lesson/reading → Project exchange when listed → Practice and project response → Milestone when due**. Canvas Next/Previous provides navigation. Unit 1 also includes the optional general help forum. Simulations and the TA remain inside the lesson; browser-local application state is not the submission record.

### Native practice and feedback

Twelve native **Graded Quizzes** serve a formative purpose. Each has three one-point multiple-choice items and one zero-point essay field for the continuing project update. This replaces the former standalone check-in assignment rather than adding another response paper. The three raw practice points contribute **0%** to the course grade: the quizzes are omitted from final grading and placed in a zero-weight formative group.

Every choice has misconception-specific explanatory feedback; correct and incorrect responses also receive the worked rationale. All facts needed by the question are included. Unlimited attempts and immediate choice feedback support revision. The zero-point project response is instructor-reviewed; comments or a pending-review state may remain after the choice questions are scored. It is not automatically assessed. A submitted quiz attempt does not prove that every field is complete or correct.

The quizzes use Classic Quizzes, confirmed available in the receiving course’s editor. Recheck engine availability at another institution. The cartridge includes both Common Cartridge QTI and Canvas-specific QTI plus assessment metadata, as the official Canvas exporter does. Native quizzes retain responses, attempts, raw scores, and instructor comments in Canvas; no external JavaScript collects assessment answers.

### Communication and project exchange

The optional **Course questions and project exchange** forum is for shared help. Three structured exchanges in Units 3, 7, and 12 support scope, evaluation/revision, and final communication. Instructions ask for a concise contribution and constructive feedback on a peer or a supplied fictional sample. The approved alternative is a sample critique in the quiz’s project-response field, so progress does not depend on a peer being online. No forced forum-completion requirement is used because a native contribution check cannot represent that alternative accurately. These activities add no grading percentage.

Private assessment questions, feedback, or individual circumstances use Canvas Inbox. The integrated course TA explains public course material; it cannot read Canvas rosters, submissions, quiz responses, grades, private feedback, or live simulation settings, and it does not make assessment decisions.

## Approved grading and submission policy

Keep five weighted groups totaling 100%:

| Group | Native assessment points | Course weight |
|---|---:|---:|
| Milestone 1. Problem and feasible scope | 100 | 15% |
| Milestone 2. First usable solution | 100 | 20% |
| Milestone 3. Pilot and learning | 100 | 25% |
| Milestone 4. Viability and route to users | 100 | 15% |
| Milestone 5. Demonstration and handoff | 60 shared + 40 individual exam | 25% |

The five milestone snapshots remain after Units 3, 5, 7, 10, and 12. Milestones 1–4 keep their canonical rubrics. The existing Milestone 5 assignment becomes the 60-point shared demonstration/handoff with criteria 25/20/15. The separate individual case exam has two 20-point criteria and sits in that **same** Milestone 5 group. Together the group remains 100 points: the shared portion contributes 15 percentage points of the course, the individual portion 10. Do not keep a 100-point Milestone 5 assignment beside the 40-point exam.

The six native scored rubrics preserve the canonical evidence anchors and use free-form scoring/comments with technical zero/maximum bounds for safe editor recalculation. The individual case exam is an asynchronous, open-materials authored response, manually graded by the instructor. Earlier individual evidence near Milestone 3 is preparation and supporting evidence, not a second numerical grade. Publish the permitted AI-use, disclosure, feedback, and revision arrangements in the guide; do not claim this is proctored proof of unaided performance.

Milestone/exam assignments accept upload, text entry, or artifact URL with reviewer-access instructions and unlimited technical attempts. The instructional policy describes an initial submission and a feedback/revision route. There are no due, unlock, or lock dates in the package; the offering’s actual calendar or self-paced expectations must be published separately.

The cartridge supplies six group weights—one formative group at zero plus five milestone groups—but does not change course-wide weighted grading or legacy group weights. The receiving course must have weighted grading enabled, legacy groups at zero, and the five active weights verified. Existing grades and submissions are preserved.

## Progress and migration boundaries

There are **32 native module requirements**: view the guide, twelve lesson pages, and completion page; submit twelve formative quizzes, five milestone snapshots, and the individual exam. There are no prerequisites, minimum-score locks, or sequential gates. A view means an item was opened. A submission means an attempt or artifact was received. Neither establishes quality, correctness, instructor approval, or mastery.

The stable identifiers preserve the twelve modules, twelve lesson pages/items, five milestone assignments, five milestone rubric identities, and the existing formative group. Existing check-in module items are retargeted to new native quizzes. Their former standalone assignment records are not deleted: unpublish the superseded twelve check-ins separately after successful import so students see one current path. The individual exam, new quiz records, support pages, structured exchanges, and files have distinct identifiers.

Canvas importers match many objects by migration identifier, but repeated imports are not generically idempotent. Importing can overwrite authored records, reset positions, or remove missing imported module items. The rubric importer may refuse to overwrite a rubric already used for grading. Inspect migration issues, actual IDs, counts, points, rubric associations, and content after every import. Do not reimport blindly after students have worked in the course.

The current reusable package includes this inline TA placement. It was **not reimported** into the receiving course: all twelve native lesson bodies were updated through the Canvas HTML editor, preserving assessment and grade history. The [live record](canvas-live-integration.md) distinguishes the current source-package hash from the last imported hash and retains earlier rubric notices. Do not reimport merely to reproduce this page-layout change in an already-assessed course.

The package contains no course settings, replacement syllabus, enrollment, grade, message, student record, credential, announcement, or institution-specific branding. It does not change overall course publication. `canvas-home.html`, `canvas-syllabus.html`, and live evidence are maintained separately; update any destination-specific Canvas IDs before reuse.

## Dated offerings

The reusable cartridge and public Vercel course remain undated. The [Spring 2027 offering](canvas/offerings/spring-2027/README.md) owns the receiving course’s January–May schedule, explicit Mountain Time/UTC conversions, native assignment IDs and destination-specific Home/Syllabus fragments. Its `schedule.json` and renderer are separate from package build inputs. Apply offering dates through native Canvas controls; do not rebuild or reimport an assessed course merely to set deadlines.

For Spring 2027, twelve quiz/project updates, five milestones and the individual exam have saved native due dates. Only the exam has an available-from date (April 29); no Until date was added. The three exchange dates are suggestions, not new native deadlines or grading requirements. The [live record](canvas-live-integration.md) distinguishes the saved/Student View observations from the reusable source plan.

## Validation and live acceptance

The builder checks archive integrity/safe paths, XML parsing, all manifest references/dependencies, expected resource counts, native page and same-Canvas file links, twelve exact lesson frame routes and twelve matching assistant routes with verified disclosure order, absence of outbound navigation, all 32 completion references, question counts/points/feedback targets, six group weights, 60+40 final allocation, six rubric totals, absent dates, and excluded private/secret content. It also checks the receiving Canvas file-discovery contract: all six text resources must have manifest/ZIP paths under `web_resources/templates/`; their logical page links use `$IMS-CC-FILEBASE$/templates/<filename>?canvas_download=1&canvas_qs_download_frd=1`. Those exported parameters reconstruct Canvas's attachment-download route, keeping the course page open instead of navigating to a raw text preview. The anchors also carry the download filename and `inline_disabled` class. Six UTF-8 text payloads include a byte-order mark so downloaded punctuation is interpreted correctly. `course_settings/files_meta.xml` supplies matching file identifiers, display names, and visible/unlocked state. Generic valid `webcontent` resources outside `web_resources/` are not discovered by Canvas's native export-package importer. These are structural checks, not full external XSD validation or live Canvas behavior.

Before student publication:

1. Import the reviewed `.imscc` through **Settings → Import Course Content → Canvas Course Export Package**. Wait for completion and inspect issues.
2. Verify 12 current modules, 15 pages, 12 quizzes with 36 choice questions and 12 project fields, five milestone snapshots plus the individual exam, six rubrics, four discussions, six template files, and 32 requirements. Retire the superseded check-ins by visibility and preserve history.
3. Follow the actual learner path. Test the native text fallback, print after opening it, template links, embedded stage controls/figures, and the inline course TA. Keep all required activity within Canvas.
4. Using only approved test arrangements, submit a wrong choice, correct choice, project response, retry, and resubmission. Observe feedback, pending essay state, attempt history, module progress, instructor comment, and student access to feedback. Never manufacture real student work.
5. Verify milestone rubric grading and the individual exam’s manual 20+20 rubric. Confirm the effective final grade arithmetic and zero contribution of formative/legacy groups.
6. Check keyboard use, narrow screens, zoom, meaningful color labels, tables, readable figures, print, and non-video alternatives. Compare actual authored surfaces with the website; native Canvas controls and institutional chrome retain Canvas behavior.
7. Confirm calendar/self-paced expectations, instructor response windows, reviewer access/fallback, feedback/revision arrangements, accessibility route, integrity policy, and completion definition before opening the course.

The theme derives its palette from `../../site/assets/core.css`; it supplies supported inline presentation rather than injecting scripts, stylesheets, or account-wide CSS. A shared palette does not establish that every Canvas control is visually identical to the website. Browser-local simulation state and TA conversations are not automatically transferred to Canvas. There is no LTI identity exchange or grade passback.

## Primary format sources

Checked against Instructure’s public Canvas source at commit `1c9f0bb8013ed69c4f2efe11fd483025469b7e6c`:

- [Official course export fixture](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/spec/fixtures/exporter/cc-with-modules-export.imscc)
- [Module metadata/requirements](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/module_meta.rb) and [module/item importer](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/app/models/importers/context_module_importer.rb)
- [Native QTI generator and Canvas assessment copies](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/qti/qti_generator.rb), [question processing/feedback](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/qti/qti_items.rb), and [Canvas quiz importer](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/importer/canvas/quiz_converter.rb)
- [Assignment metadata](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/assignment_resources.rb), [discussion metadata](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/topic_resources.rb), and [rubric metadata](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/rubrics.rb)
- [Native Canvas file-discovery prefix and metadata](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/importer/canvas/webcontent_converter.rb) and [official exported file layout](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/web_resources.rb)
- [Portable file-query translation](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/lib/cc/cc_helper.rb) and [forced attachment-download behavior](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/app/controllers/files_controller.rb)
- [Canvas QTI import guide](https://community.instructure.com/en/kb/articles/660996-how-do-i-import-quizzes-from-qti-packages), [quiz options](https://community.instructure.com/en/kb/articles/660995-unknown), and [HTML editor allowlist](https://community.instructure.com/en/kb/articles/387066-canvas-html-editor-allowlist)
