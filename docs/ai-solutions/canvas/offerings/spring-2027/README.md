# Spring 2027 Canvas offering

This is the dated offering plan for **Building AI Solutions by Majid Memari**, installed in Canvas course `644965`. It is separate from the reusable, undated curriculum and cartridge. The personal Vercel course remains institution-independent and self-paced unless an offering supplies its own dates.

The user requested the Spring 2027 update. The full-semester calendar was checked November 11, 2026 against the [official Spring 2027 calendar](https://www.uvu.edu/schedule/spring/index.html), last updated June 30, 2026. Official instruction runs January 11–April 27, with spring break March 15–21, interim day April 28, final exams April 29–May 5, and faculty grades due May 10. The learning deadlines below are the authored course plan, not university-wide assignment deadlines.

## Sources and outputs

| File | Purpose |
|---|---|
| `schedule.json` | Twelve unit/quiz due dates, five milestone dates and native IDs, three suggested exchange checkpoints, project-clinic blocks, exam window, feedback targets and source calendar |
| `render_schedule.py` | Validates dates and UTC offsets; renders the white Canvas schedule and patches only the offering blocks in maintained Home/Syllabus copies |
| `spring-2027-schedule.html` | Generated inline schedule for the native Canvas syllabus |
| `spring-2027-home-snippet.html` | Generated Home label and same-Canvas schedule link |
| `../../canvas-home.html`, `../../canvas-syllabus.html` | Destination-specific complete HTML copies, maintained separately from the reusable cartridge |

From this folder:

```sh
python3 render_schedule.py
python3 render_schedule.py --apply
```

The first command generates the fragments and `/tmp/spring-2027-home.html` plus `/tmp/spring-2027-syllabus.html`. The second also updates the maintained complete Home/Syllabus HTML. Patching is idempotent and verifies that existing HTML outside the inserted offering blocks remains byte-for-byte intact. A missing expected insertion heading causes a clear error rather than a broad replacement. Both fragments use `../../theme.py`, matching the current white Canvas profile.

## Delivery and assessment dates

Twelve native practice quizzes/project updates are due Sundays at 11:59 p.m. **Mountain Time / America/Denver**. Milestone snapshots remain after Units 3, 5, 7, 10 and 12:

| Milestone | Due | Feedback target for on-time work |
|---|---|---|
| 1. Problem and feasible scope | January 31 | February 5 |
| 2. First usable solution | February 14 | February 22 |
| 3. Pilot and learning | March 7 | March 12 |
| 4. Viability and route to users | April 4 | April 9 |
| 5. Demonstration and handoff, 60-point shared portion | April 25 | April 30 |

February 22–28 and April 5–11 are project/feedback clinics without a new unit quiz. The March 15–21 break has no new unit or deadline. January 18 and February 15 are holidays; no live attendance or holiday response is expected. February 15 is excluded when calculating the February 14 milestone's five-working-day feedback target.

The individual 40-point case exam is available **April 29 at 12:00 a.m.** and due **May 5 at 11:59 p.m.** It remains in the same 25% Milestone 5 group. An optional May 2 initial submission has a May 4 feedback target, allowing revision in the same assignment through May 5. May 2 is not an extra graded deadline or a late-work boundary. Feedback on on-time final exam submissions is targeted for May 10, an offering-specific exception to the general five-working-day exam target so final grading fits the faculty deadline.

Structured exchanges in Units 3, 7 and 12 have suggested initial-post dates January 29, March 5 and April 23. They remain ungraded, with the supplied-sample critique alternative in the quiz response and no mandatory forum-post progression gate. Their JSON `nativeDueAt` remains null; an available Canvas to-do field may display the suggestion without converting the discussion to a graded task.

## Canvas application boundaries

Apply the dated plan through native Canvas assignment/quiz controls and the maintained Home/Syllabus HTML. The JSON includes module-item IDs for the quizzes and actual assignment IDs for the milestones/exam; verify the destination before applying them. The parent integration record owns live save/readback evidence. Rendering these files alone does not establish that Canvas dates were changed.

Only the individual exam receives an available-from date. No other release date, lock date, prerequisite, grading weight, rubric, student record, or late-work penalty is changed by this offering plan. The reusable `.imscc` stays undated and should not be reimported simply to apply dates to an assessed course. No Vercel runtime or TA corpus input is modified by this folder.

Each timed student deadline in JSON has an explicit local ISO timestamp, UTC equivalent and `America/Denver` identifier. The March 14 daylight-saving transition changes the UTC conversion: pre-transition 11:59 p.m. is next-day 06:59 UTC; March 14 onward is next-day 05:59 UTC. Do not label the whole semester “MST” or reuse one fixed offset.
