# Verified Canvas integration — November 11, 2026

Destination: https://uvu.instructure.com/courses/644965. The course remains **unpublished**; the current content is published within that draft course. The course is open to students from any discipline, with **no prerequisites**. Building AI Solutions remains the course name; its framing is “Practical AI problem-solving for everyone.”

## Division of responsibility

| Canvas | Embedded Vercel application |
|---|---|
| Twelve ordered native lesson pages and module navigation | Learn → Try → Build → Finish, figures and simulations |
| Twelve zero-point Complete/Incomplete unit check-ins | Practice controls and optional practice exports |
| Five capstone submissions, native rubrics, scores and instructor feedback | Course-content AI TA within the lesson frame |
| Module requirements, submission history, discussion and Inbox | Public course explanations, cases and supporting material |

Each lesson is a native Canvas page containing the corresponding `unit-XX.html?delivery=canvas` iframe. This mode removes website navigation, external actions, standalone workbook/completion controls and cross-unit website continuation. Finish directs the learner to Canvas Next and the native check-in. TA source labels remain readable inside the assistant without opening another site. Standalone delivery remains available independently.

Canvas has 29 requirements: twelve lesson views, twelve check-in submissions and five milestone submissions. There are no prerequisite locks or forced discussion posts. A view records a visit and a submission records receipt; neither demonstrates correctness or mastery. Instructor assessment remains in Canvas.

## Grading and communication

The owner explicitly selected five milestone assignment-group weights: **15%, 20%, 25%, 15%, 25%**, after Units **3, 5, 7, 10, 12**. Weighted groups are enabled and the total was verified as 100% in instructor and Student View. Every milestone is 100 points, counts toward the final grade, and has its canonical native rubric. Check-ins are zero points, Complete/Incomplete, and omitted from the final grade.

The optional, ungraded “Course questions and project exchange” discussion is linked in Unit 1 and the home page. Canvas Inbox supports private course matters. The lesson TA explains public material; it cannot inspect Canvas submissions, grades, private feedback or learner records.

Eighteen superseded weekly modules and twenty-six older assessments/discussions were unpublished, retaining their records and dates. Their six grading groups were set to zero weight. Student View showed only the twelve current modules and seventeen current assignments. Existing student grades and submissions were not edited or deleted. The syllabus now reflects the current pathway and approved weights; existing offering details and late-work, integrity and accessibility policies were retained. Its legacy assignment-summary list is hidden.

## Evidence and limits

- Both imports completed without new issues. The final cartridge SHA-256 is `8ebd1cc93cb3dbdba386fe12225e5962547262d4be2b55e3d8af9737f5e4dbac`. Stable module, lesson-item, milestone and rubric identifiers were retained through the second import.
- All twelve check-ins were inspected live: zero points, excluded from final grade, file/text/URL submission choices, and no invented due dates. All five milestone rubrics had criteria totaling 100 points; student rubric visibility was checked after the final import.
- Student View confirmed that viewing Unit 6 marks its lesson item completed while its check-in still requires submission. Canvas Next opened the correct check-in and its native text editor. The milestone rubric and five weights were visible to the test student. No test response was submitted or graded; the instructor view was restored.
- The embedded Unit 6 simulation responded to six extra minutes of rework with 90 total minutes and a 6.25% reduction; the input was restored. The live nested TA answered inside Canvas, cited course material as contained source labels, and correctly directed submission and feedback to the Canvas check-in.
- The Vercel release was verified at commit `8ac13228ccc4415e90040ec7c327c42772e1eca6`, deployment `dpl_8YyksDuFgqTW2NakB9x6r8Az6aVK`, READY on the personal domain. All 70 public files matched its manifest. Source verification passed 68 course tests, 37 TA/workshop tests, typecheck and production build.
- Offering dates still need to be set. The course remains unpublished. This was a desktop browser and Student View check, not a Canvas mobile-app, comprehensive accessibility, cross-browser or learner-effectiveness study.
- Raw slider events, browser-local practice state and TA conversations do not automatically enter Canvas. The submitted check-in or milestone response and attached evidence are the Canvas record. There is no LTI identity or grade passback integration.

Detailed non-student operational metadata is in [live-verification.json](canvas/live-verification.json). Screenshots show only the course and the agent's test session: [home](canvas/evidence/canvas-home.jpg), [embedded TA](canvas/evidence/canvas-embedded-ta.jpg), [native check-in](canvas/evidence/canvas-check-in.jpg). The installation-specific [home](canvas/canvas-home.html) and [syllabus](canvas/canvas-syllabus.html) HTML contain destination course links; adjust them before reusing in another shell. Rebuild and import instructions are in [README.md](canvas-integration.md).
