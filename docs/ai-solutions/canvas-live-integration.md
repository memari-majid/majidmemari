# Verified Canvas delivery — November 11, 2026

Destination: https://uvu.instructure.com/courses/644965. The course remains **unpublished**; current learning items are published within that draft. **Building AI Solutions by Majid Memari** welcomes students from any discipline with **no prerequisites**. Its framing is “Practical AI problem-solving for everyone.”

## One path and two complementary systems

| Canvas owns | Embedded Vercel application supplies |
|---|---|
| Twelve ordered modules, guide, readings and completion checklist | Learn → Try → Build → Finish, figures and simulations |
| Twelve practice quizzes: 36 choice items plus 12 written project updates | Interactive controls, linked tables, worked explanations and optional exports |
| Five capstone snapshots, individual exam, six rubrics and instructor feedback | Course-content AI TA inside each lesson |
| Submission/attempt history, progress requirements, discussions, Inbox and grades | Public course explanations and supporting material |

The 37 module items include 15 native pages, 12 native quizzes, six assessed submissions, and four forums. Unit 1 starts with the guide and classroom packet. Exchanges in Units 3, 7 and 12 appear **before** the quiz/project response so students can use peer feedback or critique the supplied sample. Five milestones occur after Units 3, 5, 7, 10 and 12. The individual exam and completion checklist finish Unit 12. Required original readings, supplied outputs, six editable templates and complete text/table alternatives are available within Canvas. No live attendance, business partner, paid AI subscription, public deployment or sale is required.

Every lesson uses the corresponding `unit-XX.html?delivery=canvas` iframe. This profile removes standalone website navigation, external actions, workbook/completion controls and cross-unit website continuation. Canvas Next/Previous supplies the sequence. If a quiz retry result omits Next, the guide directs students to Canvas Modules. TA source labels remain inside its conversation. Raw simulation controls and TA conversations are not submitted automatically; students submit relevant evidence in Canvas.

There are **32 native requirements**: view the guide, 12 lessons and completion page; submit 12 quizzes, five milestones and the exam. No score gates, prerequisites or sequential locks are imposed. A view records a visit; a submission records receipt. Neither establishes correctness, instructor approval or mastery.

## Shared appearance

Authored Canvas content and embedded lessons use **white `#ffffff`**, matching Canvas's native content background. The embedded lesson has **no outer border, corner frame or shadow**. Fonts, ink/navy, teal accents, spacing and labeled information colors follow the same course design. Simulation cards and explanatory color retain their instructional meaning. The course TA also uses a white Canvas surface.

The canonical `site/assets/core.css` owns the delivery tokens. `theme.py` reads the Canvas profile and produces supported inline styling for native content, including Home, syllabus, readings, quiz instructions, assignment briefs and discussions. Canvas strips some CSS, including font-weight declarations, so semantic `<strong>` headings preserve emphasis. The actual authored wrapper measured 960 pixels on desktop. Institutional navigation and native assessment controls keep Canvas's platform styles.

Visual evidence: [embedded lesson](canvas/evidence/canvas-white-lesson.jpg), [simulation](canvas/evidence/canvas-white-simulation.jpg), [integrated TA](canvas/evidence/canvas-white-ta.jpg).

## Assessment, feedback and grades

The owner approved weights **15%, 20%, 25%, 15%, 25%**. Milestones 1–4 are 100 points each. The final 25% group combines the **60-point demonstration/handoff** (25/20/15 rubric) and **40-point individual case exam** (20/20 rubric). Together they total 100 points; the earlier individual explanation is formative preparation, not a second numerical grade.

Each formative quiz has three one-point choices and a zero-point written project update. Choice explanations are immediate; the essay can remain Pending Review. Quizzes are omitted from the final grade and their group has weight 0%. The three structured exchanges and optional help forum add no grade weight. Private questions use Canvas Inbox. The TA explains public materials and known course workflow; it cannot inspect submissions, quiz responses, grades, private feedback or current learner progress.

The guide and syllabus explain how to read criterion feedback, revise the same artifact, and resubmit. An actual other-person attempt and retest are still required; a friend, colleague, classmate or instructor-arranged asynchronous reviewer can support the classroom route. Supplied examples and AI role-play are not observations. Feedback windows are planning targets requiring instructor confirmation before enrollment.

## What was tested live

- **Native quiz submission and retry:** Test Student's Unit 6 attempt deliberately selected one wrong choice, producing 2/3 with the selected-answer explanation, correct answer and general rationale. A second attempt produced 3/3, with both attempts retained and the highest score kept. The zero-point essay remained Pending Review, while the module item showed Completed. Canvas Next and the documented Modules fallback worked.
- **Instructor grading and student feedback:** Only clearly labeled Test Student work was submitted. Native rubrics produced synthetic scores 30/60 for the handoff and 20/40 for the exam. After the final import, Student View still showed both criterion rubrics, the instructor QA comment, 50/100 in the final group, and 50% with only graded groups counted. Including ungraded work gave **12.5%**, confirming the group's 25% contribution. A second handoff submission was received as Attempt 2 with the earlier version retained. No real learner record was modified.
- **Readings and templates:** Unit 6's complete native text reading and worked examples opened inside Canvas. Six same-Canvas template routes were present after the final import. A project-record download was previously opened via Canvas's native file overlay and Download control; its UTF-8 BOM and content were verified. File payloads and logical references were unchanged by the white-theme update.
- **Interactive lesson and TA:** Six extra minutes of rework produced 90 total minutes and 6.25% reduction in the embedded figure, with the missed boundary labeled in text; the input was restored. The nested TA appeared on white within Canvas. After clarification of its workflow instruction, production API verification answered the exact submission/pending-review question directly, including the final quiz essay field, Submit Quiz, Canvas Grades and continued progress while review is pending.
- **Theme:** Home, syllabus, classroom packet and lesson wrapper saved as white. Computed embedded body/paper/surface were white, border 0px and shadow none. Canvas retained Georgia headings and the intended readable body font. Instructor view was restored, and the lesson tab was left available.

## Import history and release evidence

The complete asynchronous package at hash `b043770b813f83dc46dee4bcf3b52be6defdb54151b39e46617cfd8d5c996622` imported **Completed** at 9:39am. Earlier missing-template-link trouble at 9:26am was corrected by the `web_resources/` file layout and subsequent complete imports.

The final white-profile package is **`891ef92210f08cd39bd62018ddbebb9f182ba3f58d15a1401917d739aa25b11c`**. Its 10:33am import reports **Partially Completed with two rubric notices**, naming the already-assessed handoff and individual-exam rubrics. These were retained rather than overwritten. The old and new rubric XML, points, criteria and identifiers were byte-identical; the actual native rubrics, saved scores, criterion feedback and final grade arithmetic were checked after import. There is no remaining criterion/point mismatch. The import-history notices have not been erased or relabeled as a fully clean import. No further reimport is planned after these QA assessments.

Eighteen superseded weekly modules, 26 older assessments/discussions and the 12 former standalone check-ins remain unpublished with records preserved. Six legacy groups have weight 0%. Stable current module/item and milestone identifiers remain intact. The prior [v3 installation record](canvas/evidence/canvas-v3-installation.json) is historical, not the current assessment model.

Vercel production is READY at commit `32a1a8073d2477fe3550233e086404594c6b4621`, deployment `dpl_Fbhy2Nq6N5XFQFrZchf6hpYBknGf`. The static manifest SHA-256 is `9202bb753d49e224dfee4370e8eaa7da2578d3aa63da271dce2fbc4af6adc743`; all 70 public files were verified. Checks passed: 68 course tests, 40 TA/workshop tests, typecheck, production build, all package validators, 15 Canvas helper/guide tests and a byte-identical cartridge rebuild. The private exam marking guide is excluded from the cartridge, website, review mirrors and TA corpus.

## Remaining offering decisions and limits

Set the actual calendar or publish explicit self-paced dates, confirm facilitator response/revision windows and reviewer availability, and check the receiving offering's policies before enrolling students. The asynchronous syllabus replaces the prior meeting-time requirement and hides the legacy assignment summary while retaining applicable late-work, integrity and accessibility policy text. This course is prepared in an unpublished shell; it has not been opened to students.

This was a desktop-browser/Student View check, not a new Canvas mobile-app, full accessibility, cross-browser or learner-effectiveness study. There is no LTI identity exchange or automatic grade passback. The course TA and site chatbot remain separate.

See [live-verification.json](canvas/live-verification.json) for structured operational evidence, [ASYNC_DESIGN_PLAN.md](canvas-async-design.md) for the instructional design, [CANVAS_THEME_PLAN.md](canvas-theme-plan.md) for theme constraints, and [README.md](canvas-integration.md) for safe rebuilding and reuse. Destination-specific [Home](canvas/canvas-home.html) and [syllabus](canvas/canvas-syllabus.html) links must be adapted for another shell. The [textbook recommendation](textbook-recommendation.md) proposes selective readings without changing current purchase requirements.
