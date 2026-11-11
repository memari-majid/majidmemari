"""Original asynchronous guidance and portable Canvas course fragments.

The public curriculum owns the case and milestone criteria. This module owns
delivery guidance, reusable editable templates, and course Home/Syllabus bodies.
No live Canvas IDs, calendar dates, private records, or institutional policies are
embedded in the portable fragments. The package builder owns resource envelopes.
"""

from html import escape
import importlib.util
from math import ceil, floor
from pathlib import Path
import re
from textwrap import dedent

from theme import primary_link, style_fragment, wrap_content


COURSE_ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location("canvas_async_canonical", COURSE_ROOT / "site" / "course_content.py")
_course = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_course)
COURSE_CASE_HTML = _course.COURSE_CASE_HTML
MILESTONES = _course.MILESTONES
_reading_spec = importlib.util.spec_from_file_location(
    "canvas_async_textbook_readings", COURSE_ROOT / "site" / "textbook_readings.py")
_readings = importlib.util.module_from_spec(_reading_spec)
_reading_spec.loader.exec_module(_readings)


def reading_workload_estimate():
    """Add assigned reading to the earlier provisional course-work estimate."""
    reading = _readings.reading_workload()
    return {
        "guided_minimum": 65 + reading["minimum_minutes"],
        "guided_maximum": 115 + reading["maximum_minutes"],
        "course_minimum": floor(37 + reading["total_minutes"] / 60),
        "course_maximum": ceil(63 + reading["total_minutes"] / 60),
        "reading_minutes": reading["total_minutes"],
    }


_WORKLOAD = reading_workload_estimate()
GUIDED_MINUTES = f'{_WORKLOAD["guided_minimum"]}–{_WORKLOAD["guided_maximum"]}'
COURSE_HOURS = f'{_WORKLOAD["course_minimum"]}–{_WORKLOAD["course_maximum"]}'


def textbook_bibliography_html():
    """Show only the books actually assigned in the maintained unit plan."""
    used = {r["book"] for readings in _readings.READING_PLAN.values() for r in readings}
    items = []
    for key, book in _readings.BOOKS.items():
        if key not in used:
            continue
        items.append(
            f'<li><strong>{escape(book["authors"])}</strong>, '
            f'<em>{escape(book["title"])}</em>, {escape(book["edition"])}, '
            f'{escape(book["publisher"])}, {escape(book["year"])}. '
            f'{escape(book["role"])} {escape(book["access"])}</li>')
    return '<ul>' + ''.join(items) + '</ul>'


def _text(value):
    return dedent(value).strip() + "\n"


TEMPLATE_DOWNLOADS = {
    "01-project-record.txt": _text("""
        BUILDING AI SOLUTIONS — PROJECT RECORD
        Original editable template by Majid Memari
        Replace brackets with your work. Leave unobserved results blank or pending.
        Use fictional or approved information; do not include private personal data.

        Project / artifact name: [ ]
        Current version and date: [ ]
        Contributor(s) and individual responsibility: [ ]
        Context: [Cedar Desk classroom case / approved real-world context]

        1. NEED AND EVIDENCE
        User and task: [ ]
        Responsible decision owner (may be you for an appropriate personal project): [ ]
        Consequence of the current problem: [ ]
        Current alternative / baseline, with units and denominator: [ ]
        Evidence: [source ID | claim | supplied / observed / role-play / assumption]
        Contrary evidence and missing information: [ ]
        Three alternatives: [current process | simple improvement | AI candidate]
        Compare all three using the same effort, quality, cost, and feasibility criteria.
        Selected bounded task and why: [ ]
        Excluded tasks / data / commitments: [ ]
        Scope feedback or authorization status: [pending / approved scope and source]

        2. SOLUTION AND WORKFLOW
        Chosen AI capability and why it fits the task: [ ]
        Capability: [generate/transform | source Q&A | extract/classify |
        analyze/predict | images | voice/translation | workflow/agent]
        Permitted input and useful expected output: [ ]
        Execution route: [available no-code tool / supplied-output simulation]
        Tool or supplied example reference, likely failure, and specific human check: [ ]
        Artifact location and reviewer access instructions: [ ]
        Input -> AI or supplied-output step -> human check -> output or handoff: [ ]
        Approved source card version: [ ]
        Missing-information rule, exception owner, and manual fallback: [ ]
        Ordinary / incomplete / exception bench cases: [link to pilot log]

        3. TESTS AND REVISION
        Predeclared question, measures, comparison, and decision boundary: [ ]
        Actual other-person attempt and assistance: [record / pending]
        Full-process effort, quality, units, denominator, and missing values: [ ]
        Defect -> meaningful revision -> actual retest: [record / pending]
        What the evidence supports and cannot support: [ ]

        4. IMPACT, RESOURCES, AND ROUTE TO USERS
        Base and unfavorable scenario: [link to economics table]
        Capacity value versus cash change: [ ]
        Release readiness and bounded adoption plan: [link to release/adoption plan]
        Observed interest, agreement, first successful task, and continued use: [ ]

        5. DELIVERY, OWNERSHIP, AND NEXT DECISION
        Demonstration / accessible written equivalent: [ ]
        Handoff owner, support boundary, source maintenance, and closeout: [ ]
        Recommendation: [continue / revise / narrow / stop] because [evidence]
        One limitation and next test: [ ]
        Pending approvals, feedback, missing observations, or corrections: [ ]

        SNAPSHOT AND AI-USE LOG
        Unit / milestone / version / what changed / evidence / next action: [ ]
        AI tool or supplied output used and purpose: [ ]
        Representative prompt or supplied-output reference: [ ]
        Claim/calculation/source I checked and correction I made: [ ]
        My contribution, consequential choice, and evidence limit: [ ]
        Keep earlier dated snapshots; a new version does not erase the evidence trail.
    """),
    "02-source-card.txt": _text("""
        BUILDING AI SOLUTIONS — SOURCE CARD
        Original editable template by Majid Memari
        Use supplied classroom facts or information approved for the task.

        Task and permitted context: [ ]
        Source card version / date / responsible owner: [ ]
        Approval or classroom-only status: [ ]
        Source access and information-sharing limits: [ ]

        Repeat this record for each material source:
        Source ID: [S1, S2, ...]
        Exact fact / rule / relevant condition: [ ]
        Original title / author or owner / location / date: [ ]
        Label: [supplied fictional fact / approved document / actual observation / assumption]
        When it applies, including numerical boundaries and units: [ ]
        What it does NOT authorize or establish: [ ]
        Currentness check and next review date or trigger: [ ]
        Missing facts to request before acting: [ ]
        Human decision owner and exception route: [ ]

        CLAIM CHECK TABLE
        Output claim | Source ID | Supported / unsupported / unknown | Correction
        [ ] | [ ] | [ ] | [ ]

        RELEASE CHECK
        [ ] Material claims and calculations checked against permitted sources.
        [ ] Missing information is requested rather than invented.
        [ ] Exceptions are held for the named human decision owner.
        [ ] Wording does not claim a booking, refund, payment, or other action occurred.
        [ ] Approved draft / prepared handoff / actual performed action are distinct.
        Reviewer, date, outcome, and remaining uncertainty: [ ]
    """),
    "03-pilot-and-retest-log.txt": _text("""
        BUILDING AI SOLUTIONS — PILOT AND RETEST LOG
        Original editable template by Majid Memari
        A supplied case, self-review, or AI role-play is not another person's observed use.
        Leave observation fields pending until the event actually happens.

        BEFORE THE ATTEMPT
        Question and bounded task: [ ]
        Artifact / source / instruction version: [ ]
        Context: [classroom / approved external scope]
        Reviewer role and permission: [classmate / colleague / friend / assigned reviewer]
        Planned date or asynchronous return window: [ ]
        Inputs, expected result, and exclusions: [ ]
        Comparison: [same cases and conditions; explain differences/order/practice effects]
        Success measure(s), units, denominator, and quality boundary: [ ]
        Decision rule agreed BEFORE viewing results: [ ]
        Stop / exception / privacy conditions: [ ]

        ACTUAL ATTEMPT — repeat a row for each case
        Date | Case | Version | Reviewer role | Assistance | Completed? | Quality issue
        [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ]
        Minutes: setup [ ] + drafting [ ] + checking [ ] + correction [ ] + handoff [ ]
        Total full-process minutes: [ ]
        Missing measurement / excluded record and reason: [ ]
        Observed outcome versus expected behavior: [ ]
        Preserve inconvenient or unusual results; exclusion needs a reason.

        INTERPRETATION
        Counts and rates, each with the correct denominator and time window: [ ]
        Supplied benchmark (if used): [clearly separate from own observations]
        What changed, what stayed fixed, and alternative explanations: [ ]
        Does the stated rule support continue / revise / narrow / stop? Why? [ ]

        REVISION AND ACTUAL RETEST
        Consequential defect: [ ]
        Changed artifact/process and new version: [ ]
        Retest of affected path: [actual record / pending]
        Changed case or unaffected path checked: [actual record / pending]
        Remaining limitation and next decision: [ ]
        Who supplied each observation, and what I did myself: [ ]
    """),
    "04-economics-and-capacity.txt": _text("""
        BUILDING AI SOLUTIONS — IMPACT, RESOURCES, AND CAPACITY TABLE
        Original editable template by Majid Memari
        Keep one period throughout (for example, per month). Label every assumption.
        Released staff time is capacity value; it is not automatically a cash saving.

        Project / version / period: [ ]
        Decision and named threshold: [ ]

        Metric | Unit/period | Base case | Unfavorable case | Source or assumption
        Eligible task volume | tasks/period | [ ] | [ ] | [ ]
        Adoption | proportion of eligible tasks | [ ] | [ ] | [ ]
        Assisted volume | tasks/period | [ ] | [ ] | [ ]
        Complete time released per task | minutes/task | [ ] | [ ] | [ ]
        Released capacity | hours/period | [ ] | [ ] | [ ]
        Assumed capacity valuation | currency/hour | [ ] | [ ] | [ ]
        Gross capacity value | currency/period | [ ] | [ ] | [ ]
        Tools | currency/period | [ ] | [ ] | [ ]
        Review, delivery, support, onboarding | currency/period | [ ] | [ ] | [ ]
        Other recurring costs | currency/period | [ ] | [ ] | [ ]
        Net capacity value | currency/period | [ ] | [ ] | [ ]
        Actual incremental cash receipts/costs | currency/period | [ ] | [ ] | [ ]
        Cash change | currency/period | [ ] | [ ] | [ ]
        One-time implementation cost | currency, separate | [ ] | [ ] | [ ]

        CALCULATIONS TO SHOW
        Assisted tasks = eligible volume x adoption proportion.
        Released hours = assisted tasks x complete minutes released / 60.
        Gross capacity value = released hours x assumed hourly value.
        Net capacity value = gross capacity value - applicable recurring costs.
        Cash change = incremental actual cash receipts/savings - cash outflows.
        Explain whether payroll or another real cash expense changes; do not assume it.
        State what stays fixed when changing adoption, effort, or cost.
        Record useful outcomes and adverse effects, not just monetary value.

        DELIVERY CAPACITY AND DECISION
        Available operator/reviewer hours and whole-task effort per user/task: [ ]
        Feasible users/tasks per period and queue/support limit: [ ]
        Missing costs or possible double counting: [ ]
        Decision threshold (quality / effort / capacity-value / cash) and calculation: [ ]
        Evidence needed before trusting the assumptions: [ ]
        Recommendation and what would change it: [ ]
    """),
    "05-offer-and-adoption-plan.txt": _text("""
        BUILDING AI SOLUTIONS — RELEASE AND ADOPTION PLAN
        Original editable template by Majid Memari
        A role-play can rehearse an invitation. It is not an actual use attempt.
        A sale, business, or public launch is not required. External work needs
        approved scope and information. A classroom reviewer can attempt the task.

        Intended user / responsible decision owner: [ ]
        User's current alternative and specific need: [ ]
        Useful result supported by evidence: [ ]
        Version, current accessible files, and delivery format: [ ]
        Included task, first-step instructions, and acceptance test: [ ]
        Access needs and permitted inputs/actions: [ ]
        Excluded actions, uncertain benefits, and limits: [ ]
        Resources needed and permission status: [ ]
        Whole-package delivery/review/support cost and capacity limit: [ ]
        Evidence supporting readiness, and assumptions still untested: [ ]
        Resource-value allowance - valued effort - cash expense: [ ]
        Name omitted costs; unallocated resource value is not cash remaining/profit.

        ONE ROUTE TO USERS
        Route to intended users and why it fits: [ ]
        Effort/cash budget and period: [ ]
        Stages (define each): reached -> relevant conversation -> pilot agreement
        -> observed successful first-task completion -> continued use
        Count | denominator | time window | observed or forecast: [ ]
        If claiming resource cost per successful first-task completion, divide
        the defined resource cost by OBSERVED SUCCESSFUL COMPLETIONS in the same
        cohort/period. Agreement is not use. Valued time is not necessarily cash.

        CONVERSATION / ROLE-PLAY
        Label: [actual approved interaction / actual classroom role-play / supplied example]
        Date, role, and evidence available: [ ]
        Need, access concern/question, and evidence-based response: [ ]
        What I cannot promise or do without approval: [ ]
        Invitation or instruction revision and truthful next request: [ ]

        ONBOARDING AND FOLLOW-THROUGH
        First task, access, source card, human owner, and support route: [ ]
        Actual task attempt, assistance, outcome, and friction: [record / pending]
        Issue -> meaningful revision -> actual retest: [record / pending]
        Measure for initial use and sustained use, with denominator/window: [ ]
        Stop/review trigger and next review date: [ ]
        Pending information, approval, or observation: [ ]
        Optional commercial application, only if relevant: [ ]
    """),
    "06-operating-handoff.txt": _text("""
        BUILDING AI SOLUTIONS — OPERATING HANDOFF
        Original editable template by Majid Memari
        A prepared handoff is not proof that someone used it or authorized an action.

        Artifact / version / date / intended recipient: [ ]
        Current status: [classroom-only / approved pilot / paused / closed]
        Permitted task, users, data, and exclusions: [ ]
        Files, access instructions, and source card version: [ ]
        Quick start: input -> draft -> source check -> human decision -> reply/handoff
        Steps another person can follow: [ ]
        Expected output and one ordinary, missing-data, and exception example: [ ]

        HUMAN RESPONSIBILITY
        Operator, reviewer, decision owner, and backup: [ ]
        Actions the AI may propose versus actions a human must authorize: [ ]
        Missing-information rule and exception queue: [ ]
        Stop conditions, manual fallback, and escalation route: [ ]

        CONTINUED USE
        Source owner and review/expiry trigger: [ ]
        Quality/effort measures, inspection frequency, and capacity limit: [ ]
        Tool, access, recurring-cost, and support boundaries: [ ]
        What happens if the tool, source, or owner is unavailable: [ ]
        Version/change log and correction procedure: [ ]
        Data retention/removal and project closeout arrangement: [ ]

        HANDOFF TRIAL
        Actual recipient attempt: [record / pending]
        What they could access and do; assistance; result: [ ]
        Issue -> revision -> actual retest: [ ]
        Remaining limitation and next decision: [ ]
        Evidence-backed recommendation and requested approval: [ ]
        Individual contribution / calculation / design choice / evidence limit: [ ]
    """),
}


def _grade_table():
    rows = []
    for milestone in MILESTONES:
        points = "60 shared + 40 individual" if milestone["number"] == 5 else "100"
        rows.append(f'<tr><th scope="row">{milestone["number"]}. {escape(milestone["title"])}</th><td>{milestone["unit"]}</td><td>{points}</td><td>{milestone["weight"]}%</td></tr>')
    return ('<table><caption>Five milestone groups determine the course grade</caption>'
            '<thead><tr><th scope="col">Milestone</th><th scope="col">After unit</th><th scope="col">Points within group</th><th scope="col">Course weight</th></tr></thead>'
            '<tbody>' + ''.join(rows) + '</tbody></table>')


FEEDBACK_HTML = """
<h3>Read feedback, revise, and keep moving</h3>
<ol>
<li>After submitting the unit quiz, open its results and read the explanation for each choice. Your project-update essay is a separate zero-point response: it is not automatically evaluated by AI and can remain pending manual review.</li>
<li>For a milestone or the individual exam, open the assignment from Canvas Grades. Read the instructor comments and the criterion-level rubric before revising. A submission receipt or a raw practice score does not establish mastery.</li>
<li>Use the feedback to change the same artifact or reasoning. Keep the previous version, add a short “feedback → change → evidence” note, and resubmit through the assignment when its revision window is open. For the individual exam, use the announced initial-submission and revision opportunity; the final reviewed submission counts.</li>
<li>If an item is incomplete or feedback is unclear, name the unit, criterion, what you tried, and the specific question in Canvas Inbox. Do not create a new project to replace an unresolved issue.</li>
</ol>
<p><strong>Facilitated-course planning targets:</strong> a response to a course/private question within two working days, and milestone or exam feedback within five working days, while the facilitated offering is active. The instructor must confirm the working-day calendar, availability, and revision windows before enrollment. These are targets, not instant or round-the-clock service; self-study does not include promised instructor review.</p>
<p>While waiting, complete the next original reading, practice with the classroom case, check sources, or improve a non-consequential part of your record. Do not treat silence, a quiz score, or TA advice as approval to use private data, deploy externally, contact customers, spend money, or make commitments. If a confirmed response window passes, send one concise follow-up through Canvas Inbox and continue with the safe classroom route.</p>
"""

REVIEWER_HTML = """
<h3>Arrange an actual user attempt without needing a partner</h3>
<p>Use the complete fictional Cedar Desk case or an approved real-world need. No fee, business partner, paid AI subscription, public launch, or sale is required. A document-based kit or repeatable service can be a usable solution.</p>
<p>For the access check, pilot, and retest, ask another person to attempt a bounded task with your version. A classmate, colleague, friend, or assigned classroom reviewer can work asynchronously using the instructions you supply. Record what actually happened, including assistance, missing measurements, and unresolved problems. The case packet supplies facts and examples; it does not supply your observation.</p>
<p>If no reviewer is available, request a bounded classroom review through Canvas Inbox early enough for the published feedback window. Include your version, one safe task, expected behavior, and the particular observation you need. The instructor arranges an appropriate review/retest route while the facilitated course is active; do not assume instant access. Self-review and AI role-play help preparation, but neither replaces another person's actual attempt. Keep the requirement pending until it occurs.</p>
"""

AI_RULE_HTML = """
<h3>Use AI openly and keep your own reasoning</h3>
<p>Course materials, a calculator, and disclosed AI assistance are allowed, including on the individual case exam. You must author and explain your own analysis, identify the tool or supplied output, show a representative prompt where applicable, and record an important claim or calculation you checked and corrected. A fully generated answer without your verified reasoning does not meet the evidence criteria.</p>
<p>The course TA explains public course material and offers hints. It cannot inspect Canvas submissions, grades, private feedback, or your saved project, and it does not grade the essay, milestones, or exam. Instructor assessment uses the published criteria. Label supplied facts, actual observations, assumptions, classroom role-play, and AI-generated material accurately. Never invent a user test, customer, source, result, or payment.</p>
"""

_GUIDE_BODY = """
<h3>Start here</h3>
<p>Everyone is welcome, from any discipline. There are no prerequisites: no previous AI, programming, statistics, or business study is needed. Use Canvas, a browser, an ordinary document tool, and a calculator or spreadsheet. Ready-made AI tools can help, but the supplied outputs let you do the same reasoning without a paid account.</p>
<p>A useful problem can concern a community service, creative workflow, research coordination, or organizational task. The case teaches transferable methods; you do not need to start a business.</p>
<h3>Your first setup: seven steps</h3>
<ol>
<li>Open <strong>Unit 1 in Canvas Modules</strong> and follow the items in order.</li>
<li>Use <strong>Canvas Next</strong> to open <strong>Cedar Desk case and editable templates (reference)</strong> in Unit 1. Expand the complete Cedar Desk source packet and read the approved sources S1–S6, then use <strong>Canvas Next</strong> to continue to the Unit 1 lesson. Return to the other datasets and templates when a unit asks for them; you do not need to read everything now.</li>
<li>Copy the Project record template into any ordinary document, or prepare the same headings in your Canvas text response. Name it <strong>ReplyKit v1</strong>; label the context “fictional classroom case.” Downloading a file is optional because the complete template text is visible.</li>
<li>Use the <strong>provided AI-output example without creating an account</strong>, or use an approved assistant. For an assistant, supply the task, approved sources, and output format: “Using only this source card, draft a response to the booking question. Give the draft, source IDs for material claims, missing facts, and any human decision needed.” Do not paste private information. The supplied-output route requires no coding, paid tool, external partner, or AI account.</li>
<li>Check the policy and authority yourself. For the supplied 60-hour rescheduling request, S3 permits consideration, but space and coordinator confirmation remain unknown; S4/S6 prohibit claiming a booking has already changed. Correct unsupported wording and record what you checked.</li>
<li>Save the draft, source check, and correction as <strong>version 1</strong> in your project record. Keep unobserved user-test fields pending.</li>
<li>Finish the lesson, use <strong>Canvas Next</strong>, and submit the native quiz's project-update response explaining what you changed and why. A file saved on your device has not yet been submitted to Canvas.</li>
</ol>
<p>Keep this one continuing project. Each unit improves the same evidence, artifact, tests, resource analysis, or handoff; each milestone is a dated snapshot, not a new project. The figures, simulations, and course TA stay inside the lesson. Submit assessed work and read feedback in Canvas.</p>
<details><summary>Connect AI capabilities to your problem</summary>
<p>In Unit 1, start with what a person needs to accomplish. Choose a capability for a permitted input and useful output, then define a check for its likely errors. A particular tool may support only some capabilities. The course does not require every learner to build every kind of AI system.</p>
<table><caption>Candidate capabilities and examples of checks</caption><thead><tr><th scope="col">Capability</th><th scope="col">Possible real-world task</th><th scope="col">What to check</th></tr></thead><tbody>
<tr><th scope="row">Generate or transform text</th><td>Turn approved notes into a plain-language draft.</td><td>Meaning, omitted conditions, unsupported facts, and audience needs.</td></tr>
<tr><th scope="row">Answer from sources</th><td>Explain a policy using permitted documents.</td><td>Every material claim, source conditions, missing facts, and authority.</td></tr>
<tr><th scope="row">Extract or classify</th><td>Make a dates/locations table from event notices.</td><td>Fields against originals; missing values remain visible.</td></tr>
<tr><th scope="row">Analyze or predict</th><td>Summarize attendance or compare a forecast with a simple baseline.</td><td>Data suitability, calculations, units, baseline, and uncertainty.</td></tr>
<tr><th scope="row">Interpret or create images</th><td>Propose an illustration or draft an image description.</td><td>What is actually depicted, misleading details, accessibility, and permissions.</td></tr>
<tr><th scope="row">Transcribe, translate, or speak</th><td>Prepare a transcript or multilingual draft from permitted material.</td><td>Names, numbers, meaning, speaker labels, and missing context.</td></tr>
<tr><th scope="row">Coordinate a workflow or agent</th><td>Prepare a task handoff or propose a next action.</td><td>Allowed actions, approvals, tool failures, status, and a manual fallback.</td></tr>
</tbody></table>
<p>Record <strong>problem → capability → input/output → implementation → human check → actual test</strong> in your project. With no AI account, use the provided output and label that step a supplied-output simulation. An operable document kit can demonstrate the workflow; it does not demonstrate a live model connection or autonomous action.</p>
</details>
<details><summary>Plain-language concepts you will use</summary><dl>
<dt><strong>AI output</strong></dt><dd>A draft, prediction, summary, or recommendation produced by an AI tool; it needs checking before you rely on it.</dd>
<dt><strong>AI capability</strong></dt><dd>A type of work an available AI tool can assist with, such as extracting fields or drafting text. Choose it because it fits the task and can be checked, not because its name sounds advanced.</dd>
<dt><strong>Model</strong></dt><dd>A system that uses learned patterns to produce an output from an input; its confident wording is not proof that a claim is true.</dd>
<dt><strong>Source</strong></dt><dd>The document, record, person, or supplied case fact that a specific claim can be checked against.</dd>
<dt><strong>Evidence</strong></dt><dd>Traceable information supporting a particular claim, with a clear label showing whether it is observed, supplied, or assumed.</dd>
<dt><strong>Baseline</strong></dt><dd>The clearly defined starting process or comparison used to judge whether a proposed change helps.</dd>
<dt><strong>Denominator</strong></dt><dd>The total group or quantity a rate divides by, such as 12 invited people in 6 out of 12.</dd>
<dt><strong>Quality</strong></dt><dd>Whether the output meets stated requirements, including accuracy, useful next steps, and appropriate human authority.</dd>
<dt><strong>Complete effort</strong></dt><dd>All relevant work needed for the task, including preparation, drafting, checking, correction, and handoff.</dd>
<dt><strong>Capacity value</strong></dt><dd>A conditional value assigned to released time that could be used for other work; the time must actually be usable.</dd>
<dt><strong>Cash change</strong></dt><dd>A real change in money received or paid; releasing staff time does not itself reduce payroll or create cash savings.</dd>
</dl></details>
<h3>Your routine in every unit</h3>
<ol>
<li><strong>Learn.</strong> Read the original core explanation and the assigned free textbook passage. Each assignment identifies the book, edition, section, exact scope, approximate time, and project question. The official textbook reader is inside the embedded lesson; stay on this Canvas page. The native “Read the complete text lesson and worked examples” section contains the original explanation and worked tables if the embedded lesson is unavailable.</li>
<li><strong>Try.</strong> Predict, change a meaningful input, compare the figure with its numbers, and explain whether the evidence changes your decision. Use the text/table worked example when an interactive control is inaccessible.</li>
<li><strong>Build.</strong> Add the unit's small piece of evidence or implementation to your project. Keep source labels, version, units, and limitations visible.</li>
<li><strong>Finish and submit.</strong> At Units 3, 7, and 12, read the project exchange before the quiz. Then complete the native Canvas practice quiz and project update: three choice questions plus one short zero-point written response. This replaces the earlier unit check-in; you do not submit both. Read the choice feedback, then continue to the milestone when one is shown.</li>
</ol>
<p>Each quiz may display a technical score out of three, but its formative group contributes <strong>0%</strong> to the final grade and the assessment is omitted from the final grade. Choice explanations are available immediately in the submission results. The written project update may await an instructor response. A module's view/submission mark records a visit or receipt, not correct understanding or completed manual grading. Retries support learning; no minimum practice score is required to continue.</p>
<p>At Units 3, 7, and 12, the short project exchange appears <strong>before the quiz</strong>. Inspect a peer's reasoning or the supplied fictional sample, then include your constructive critique and its effect on your next decision in the quiz's project update when using the individual alternative. You need not wait for a peer or make a forum post to unlock progress. These exchanges are formative and add no course percentage. The general course-questions forum remains optional and ungraded.</p>
<p>The repeated order is <strong>Lesson → Exchange when listed → Practice quiz and project update → Milestone when due</strong>. In Unit 12, continue from the shared demonstration/handoff to the individual case exam, then the completion checklist.</p>
<h3>Plan a workable pace</h3>
""" + f"""
<p>Start with one unit per learning block; split a block across several sessions if useful. Allow roughly <strong>{GUIDED_MINUTES} minutes for each guided unit, including its assigned reading</strong>, plus additional project, review, and revision work. The provisional total is <strong>{COURSE_HOURS} learner hours including the guided units and textbook reading</strong>. The listed textbook passages add about {_WORKLOAD["reading_minutes"]} minutes across the course; they are included in this total, not added again. These are design estimates, not measured completion times or an academic-credit claim. Follow the actual Canvas dates and leave time for another person's attempt, feedback, and retesting. No live class attendance is required for the asynchronous route.</p>
""" + """
<p>The original core explanation and the assigned free textbook passages are required. The reading plan below identifies the academic AI foundation, business and value-creation companion, and quantitative companion. Apply ideas about people, resources, value, and adoption to your chosen real-world context; starting a business is not required. Read only the listed conceptual passages: no book purchase, paid access code, programming, mathematical derivations, algorithm exercises, or whole-book sequence is required. Other named articles and commercial books remain optional further study.</p>
<p>Use one reading idea in the existing zero-point project update: identify its book and section, explain it in your own words, and connect it to a project decision. This is part of the same response, not an extra submission or weighted assessment. The course TA can help with the assignment and original lesson, but it does not have the complete textbooks.</p>
<p>If a required official source is unavailable or inaccessible, use the original explanation and worked example on the same lesson page for the same application question. Label that access alternative and report the problem through Canvas Inbox. Keep moving with this equivalent route; do not claim you read an unavailable textbook section. The course does not require a paid account to recover access.</p>
""" + _readings.render_reading_plan(delivery="canvas") + """
<h3>Know what counts toward the grade</h3>
""" + _grade_table() + """
<p>Milestones 1–4 each have a 100-point rubric. Milestone 5 has a <strong>60-point shared demonstration/handoff assignment and a 40-point individual case exam in the same 25% group</strong>. This contributes 15 and 10 percentage points of the whole course respectively; it does not add a sixth weighted group. “Shared” describes the artifact criteria even when you work individually. Earlier individual explanations prepare you for the exam and are not graded a second time.</p>
<p>The individual case exam is asynchronous, open-materials, and individually authored. It checks quantitative understanding and consequential design judgment using a new supplied case. It is manually assessed, not an automatically scored or proctored claim of unaided performance. A written demonstration or explanation is available as an alternative to a recording or presentation.</p>
""" + FEEDBACK_HTML + REVIEWER_HTML + AI_RULE_HTML + """
<h3>If something does not work</h3>
<ul>
<li><strong>Lesson or animation unavailable:</strong> open “Read the complete text lesson and worked examples” on the same Canvas page. Use its worked table and supplied output, record the access problem, and submit the same reasoning in the native quiz.</li>
<li><strong>TA unavailable:</strong> use the original explanation and worked examples, then the optional course forum or Canvas Inbox. TA access is helpful, not a condition of submission.</li>
<li><strong>Artifact link inaccessible:</strong> correct its permissions using approved information, or upload the working files and instructions to the assignment. Test access as a reviewer would; do not expose a private workspace.</li>
<li><strong>Download unavailable:</strong> copy the editable template text from the classroom packet into an ordinary document. A particular file format is not required.</li>
<li><strong>Time, access, or accommodation concern:</strong> use Canvas Inbox promptly and follow the offering's accessibility arrangements. Keep unmet evidence requirements visible rather than inventing completion.</li>
</ul>
<p>Before finishing Unit 12, use the completion checklist to locate all submitted evidence, returned rubric feedback, the individual exam, and outstanding actions. Finishing a page or receiving a submission check does not award a qualification.</p>
"""

GUIDE_HTML = wrap_content(
    _GUIDE_BODY, eyebrow="Course guide · Keep this beside your project",
    title="Start, continue, and finish one project",
    lead="Practical AI problem-solving for everyone. One path, twelve units, no prerequisites.",
)


WORKED_RESPONSE_HTML = """
<h3>A filled response and a flawed response</h3>
<p><strong>Both examples below are original fictional teaching examples.</strong> They are responses to a Unit 6 project update, not student work, actual user observations, or a complete milestone submission.</p>
<details><summary>Filled example: a decision with an evidence boundary</summary>
<p><strong>Project update:</strong> I changed ReplyKit v0.2 to require a source check and owner review of exceptions. I am evaluating that design against the supplied 12-case benchmark, not claiming that I observed these results.</p>
<p><strong>Calculation:</strong> Manual processing takes 96 minutes for the same 12 cases. The supplied reviewed-AI route takes 84 minutes, including checking and correction, with zero material errors in that case set. The reduction is (96 − 84) ÷ 96 = 12.5%. Under a predeclared classroom rule requiring at least 10% less complete effort and zero material errors, 84 minutes is below the 86.4-minute effort threshold.</p>
<p><strong>Changed assumption:</strong> Adding six hypothetical rework minutes makes the total 90. The reduction is (96 − 90) ÷ 96 = 6.25%, which fails the same effort rule even if zero material errors remains fixed. The extra six minutes are a sensitivity assumption, not a new observation. Released time is not proof of cash savings.</p>
<p><strong>Next decision:</strong> Revise the review process and arrange an actual bounded classroom attempt before claiming my version meets the rule. I will record full effort, errors, assistance, and a retest. Actual reviewer evidence is pending; the supplied benchmark cannot establish future safety, demand, or permission for an external launch.</p>
<p><strong>Source and AI-use boundary:</strong> This worked response uses supplied teaching data, not evidence from a learner's own AI session. In your response, disclose your actual tool use or supplied-output route, the purpose, what you checked, and any correction.</p>
</details>
<details><summary>Flawed example: locate the unsupported claims</summary>
<blockquote>“I interviewed 12 customers and proved AI saves 75% of staff cost because it takes 24 minutes instead of 96. The system is ready to launch and can handle all refunds automatically.”</blockquote>
<p><strong>Why it fails:</strong> The 12 cases are supplied processing inputs, not customer interviews. The unchecked 24-minute route has three materially unacceptable replies; it does not satisfy the quality boundary. A time difference is not a demonstrated payroll or cash saving. No actual pilot, future-performance evidence, or authorization to process refunds has been provided. S2 and S6 require appropriate human decisions and do not authorize automatic exceptions.</p>
<p><strong>Revision task:</strong> Replace the invented observation with its correct source label, use the complete reviewed process, show the denominator and quality result, and state what is still pending. A modest, qualified conclusion with traceable evidence is stronger than an unsupported success claim.</p>
</details>
"""


def _templates_body():
    items = [
        '<p>Use an ordinary document or spreadsheet. These six plain-text downloads are editable starting points, not six extra assignments. Combine them into the same project record and submit the relevant dated snapshot in Canvas. Blank or pending fields are honest when an observation has not happened.</p>',
        '<p>Download a template below or copy its visible text. The downloads contain no learner data. Keep only fictional or approved information in your copy.</p>',
    ]
    labels = ("Project record", "Source card", "Pilot and retest log", "Impact, resources, and capacity", "Release and adoption plan", "Operating handoff")
    for (filename, content), label in zip(TEMPLATE_DOWNLOADS.items(), labels):
        items.append(
            f'<details><summary>{escape(label)} · editable template</summary>'
            f'<p><a class="instructure_file_link inline_disabled" href="$IMS-CC-FILEBASE$/templates/{filename}?canvas_download=1&amp;canvas_qs_download_frd=1" download="{filename}">Download {escape(label.lower())} (.txt)</a></p>'
            f'<pre style="white-space:pre-wrap;overflow-wrap:break-word;font-size:0.9rem;line-height:1.6;max-width:100%;">{escape(content)}</pre></details>'
        )
    items.append('<details><summary>Complete Cedar Desk classroom source packet</summary>' + COURSE_CASE_HTML + '</details>')
    items.append(WORKED_RESPONSE_HTML)
    items.append('<p>Use Canvas Next to return to the ordered module items. A downloaded file, a completed template, or a supplied example does not submit your work; use the native quiz or milestone assignment.</p>')
    return ''.join(items)


TEMPLATES_HTML = wrap_content(
    _templates_body(), eyebrow="Classroom packet · Reuse throughout the course",
    title="Your case and editable project tools",
    lead="For Unit 1, open the complete Cedar Desk classroom source packet and read approved sources S1–S6, then use Canvas Next for the lesson. Return to the other datasets and templates when a unit asks for them; you do not need to read everything now.",
)


COMPLETION_HTML = wrap_content("""
<h3>Check the evidence, not just the page ticks</h3>
<ol>
<li><strong>One complete project:</strong> the current artifact or repeatable service is accessible, versioned, and usable for the bounded task. Include sources, review rules, exceptions, and fallback.</li>
<li><strong>Actual use, revision, and retest:</strong> another person's attempt is recorded with assistance, quality, complete effort, and limitations. Supplied benchmarks, role-play, assumptions, and observations remain distinct. Any missing observation is marked pending.</li>
<li><strong>Quantitative decision:</strong> tables/figures state units, denominator, period, and baseline. Resource analysis distinguishes capacity from cash and includes a less favorable scenario. Claims about need, initial use, and continued use fit the evidence.</li>
<li><strong>Five milestone groups:</strong> confirm the current snapshots are submitted after Units 3, 5, 7, 10, and 12. In Milestone 5, confirm both the 60-point demonstration/handoff and the separate 40-point individual case exam are submitted to their proper assignments.</li>
<li><strong>Individual reasoning:</strong> your exam and contribution record show a calculation, consequential choice, source/AI-use disclosure, and evidence limit. Instructor review may still be pending; submission alone is not a passing judgment.</li>
<li><strong>Feedback and revisions:</strong> open Canvas Grades, read each rubric and comment, identify any incomplete or unreviewed item, and submit revisions within the current offering's window. Do not count a quiz's raw practice score toward the course grade.</li>
<li><strong>Operating handoff:</strong> the recipient can locate files and instructions. Name the responsible person, support/capacity limits, source-maintenance trigger, stopping rule, and post-course status. Record a handoff trial or explicitly identify the remaining task.</li>
<li><strong>Final next decision:</strong> state continue, revise, narrow, or stop; explain what evidence supports it and what remains unknown. A justified stop can demonstrate sound judgment.</li>
</ol>
<h3>If an item remains pending</h3>
<p>Make a short list of the missing evidence, feedback, approval, or revision, with the responsible person and next action. Use Canvas Inbox for private assessment questions. Keep the project classroom-only or within its approved scope while waiting; course completion is not permission to operate a service on someone's behalf.</p>
<p>Canvas module checks show views and submissions. They do not establish that manual assessment is finished, that a solution is safe for every future case, or that a credential has been awarded. The instructor's reviewed assessment and the offering's published requirements determine the academic result. Independent self-study has no automatic grade or qualification.</p>
""", eyebrow="After Unit 12 · Final evidence review", title="Finish with a usable handoff and an honest record")


def _course_path(course_id):
    value = str(course_id)
    if not re.fullmatch(r"[1-9][0-9]*", value):
        raise ValueError("A receiving Canvas course ID must be a positive integer")
    return f"/courses/{value}"


def _route(base, routes, key, fallback):
    value = routes.get(key) or fallback
    if not isinstance(value, str) or not (value.startswith(base + "/") or value == "/conversations"):
        raise ValueError(f"Route {key} must stay in the receiving Canvas course")
    return value


def render_home(course_id, routes):
    """Render Home with receiving-course routes, never portable hard-coded IDs.

    Supported route keys: start, guide, templates, completion, questions, modules,
    syllabus, grades. Missing supporting routes safely fall back to Modules.
    """
    base = _course_path(course_id)
    modules = _route(base, routes, "modules", base + "/modules")
    urls = {key: _route(base, routes, key, modules) for key in ("start", "guide", "templates", "completion", "questions")}
    grades = _route(base, routes, "grades", base + "/grades")
    syllabus = _route(base, routes, "syllabus", base + "/assignments/syllabus")
    body = (
        '<p><strong>Majid Memari · All disciplines · No prerequisites</strong></p>'
        '<p>Find a real-world need, select a suitable AI capability, build a useful solution without programming, test it with a person, and explain the evidence, impact, resources, and next decision. No prior AI, statistics, or business background is required.</p>'
        '<p>' + primary_link(urls["start"], "Start with Unit 1 →") + '</p>'
        '<h3>One path, twelve units, one project</h3>'
        '<ol><li><strong>Read and explore.</strong> Use Learn → Try → Build → Finish inside each Canvas lesson. Read the original explanation and the assigned free textbook passage in the embedded reader, then apply one idea to the same project. A text/table alternative, figures, simulations, and the course TA are on the page.</li>'
        '<li><strong>Submit one short practice response.</strong> Read the exchange first when it appears in Units 3, 7, and 12; a supplied sample lets you continue without waiting for a peer. Then use Canvas Next for three choice questions and a zero-point project update. Read the immediate choice explanations; written feedback may await instructor review.</li>'
        '<li><strong>Improve the same project.</strong> Submit five cumulative milestones. Use an approved need or the complete fictional Cedar Desk case; no partner, paid AI tool, live attendance, or public launch is required.</li></ol>'
        f'<p>Suggested pace: one unit per learning block. Allow {GUIDED_MINUTES} minutes for guided unit work including the assigned reading, plus project/review time; {COURSE_HOURS} hours total is a provisional design estimate, not measured workload. Textbook time is included in that total. Follow current Canvas dates and allow time for feedback and an actual reviewer attempt.</p>'
        f'<p>Read the <a href="{escape(urls["guide"], quote=True)}">course guide</a> for the routine, feedback windows, recovery options, and individual exam. Use the <a href="{escape(urls["templates"], quote=True)}">classroom case and editable templates</a> throughout.</p>'
        '<p><strong>Required textbooks, free access:</strong> short assigned passages from an academic AI text, a business/value-creation text, and a statistics companion support the project. Each lesson gives the book, edition, precise scope, and reader; the guide lists the complete bibliography. No purchase or access code is required; the guide explains an honest access alternative.</p>'
        '<h3>Five milestones, clear evidence</h3>' + _grade_table() +
        '<p>Practice quizzes and project exchanges contribute 0%. Milestone 5 divides its 25% group into 60 points for the shared demonstration/handoff and 40 points for the individually authored case exam. The instructor assesses the exam; the AI TA does not grade.</p>'
        '<h3>Questions, feedback, and finishing</h3><ul>'
        f'<li><a href="{escape(urls["questions"], quote=True)}">Course questions and project exchange</a>: optional general questions and constructive peer help.</li>'
        '<li><a href="/conversations">Canvas Inbox</a>: private assessment/access questions and requests for an asynchronous classroom reviewer.</li>'
        '<li><strong>Course AI TA:</strong> explanations and hints inside the lesson; it cannot read Canvas submissions, grades, or private feedback.</li>'
        f'<li><a href="{escape(grades, quote=True)}">Canvas Grades</a>: instructor comments, rubrics, and reviewed results. Read and revise before treating work as complete.</li>'
        f'<li><a href="{escape(urls["completion"], quote=True)}">Completion checklist</a>: final evidence, individual exam, handoff, and pending tasks.</li></ul>'
        '<p>While the facilitated course is active, planning targets are two working days for questions and five for milestone/exam feedback; the instructor confirms these arrangements before enrollment. A view or submission tick records progress, not correctness, approval, or an award.</p>'
        f'<p><a href="{escape(syllabus, quote=True)}">Syllabus and assessment arrangements</a> · <a href="{escape(modules, quote=True)}">Continue in Canvas Modules</a></p>'
    )
    return wrap_content(body, eyebrow="Building AI Solutions", title="Practical AI problem-solving for everyone")


def render_syllabus(course_id, policies_html=""):
    """Render portable asynchronous syllabus text plus separately owned policies.

    policies_html is trusted receiving-offering content. This function does not
    invent institutional policy, calendar dates, physical meetings, or credits.
    """
    base = _course_path(course_id)
    body = (
        '<p><strong>Instructor: Majid Memari</strong></p>'
        '<p>Discover a real-world need, select a suitable AI capability, build and test a useful solution, evaluate its impact and resources, help people use it, and deliver a responsible handoff. This course is open to everyone, from any discipline. There are no prerequisites: no prior AI, programming, statistics, or business background is required.</p>'
        '<h3>Asynchronous course path</h3>'
        f'<p>Follow Units 01–12 in <a href="{base}/modules">Canvas Modules</a>. Each lesson uses Learn → Try → Build → Finish, with original core reading, a text/table alternative, embedded simulations, and the course TA. Use Canvas Next for an exchange when listed, then the native quiz/project update, then a milestone when due. The Unit 12 milestone is followed by the individual case exam and completion checklist. No live attendance is required for this route.</p>'
        '<p>Work on one continuing capstone using an approved need or the complete fictional Cedar Desk case. A usable document-based kit or repeatable service is sufficient; a mock-up alone is not the final deliverable. No business partner, paid AI account, sale, public deployment, or payment is required. External work must stay within approved scope and information permissions.</p>'
        f'<p>Use an ordinary document tool and a calculator or spreadsheet. The original explanations, required textbook assignment directions, supplied outputs, and textbook reader are available within the Canvas lesson. Other references and commercial books are optional. Allow approximately {GUIDED_MINUTES} minutes per guided unit including assigned reading, plus project work; {COURSE_HOURS} total learner hours, including the textbook time, is a provisional design estimate, not measured effort or academic-credit equivalence. Actual offering dates and requirements appear in Canvas.</p>'
        '<h3>Required textbooks and reading assignments</h3>'
        + textbook_bibliography_html() +
        '<p>Complete only each unit\'s named conceptual passages and use one idea in the existing project update, naming the book and section. No purchase, paid access code, full-book reading, coding, mathematical derivations, or textbook end-of-chapter exercises are required. The course supplies its own current-tool guidance, no-code implementation activities, simulations, cases, and assessment; textbook publication is not an endorsement of this course.</p>'
        '<p>Read inside Learn without leaving Canvas. If the official reader is unavailable or inaccessible, use the original lesson and worked example for the same question, label that access alternative, and report the problem through Canvas Inbox. Do not claim to have read a source you could not access. The course guide lists all twelve assignments and reading times.</p>'
        '<h3>What you will learn</h3><ul>'
        '<li>Identify a specific need, user, accountable decision owner, and measurable success criteria.</li>'
        '<li>Match a task to an AI capability: text, source answers, extraction/classification, data analysis/prediction, images, voice/translation, or workflows/agents. Check its limits using an available tool or a clearly labeled supplied-output simulation.</li>'
        '<li>Build a bounded usable solution, observe another person using it, revise, and retest.</li>'
        '<li>Interpret statistics, tables, figures, denominators, uncertainty, complete effort, costs, and capacity without programming.</li>'
        '<li>Prepare accessible instructions and a bounded release, observe first use, improve onboarding, and communicate an evidence-backed next decision.</li>'
        '<li>Prepare operating instructions, human review, exceptions, maintenance, support limits, and handoff.</li></ul>'
        '<h3>Assessment and final-grade weights</h3>' + _grade_table() +
        '<p>Twelve native quizzes contain three one-point choice questions and one zero-point project-update essay. Include the brief reading connection in that same essay. Their technical raw scores are formative, omitted from the final grade, and in a 0%-weight group. They replace the earlier unit check-ins. Three project exchanges add formative critique with a supplied-sample alternative; the general course-questions forum is optional. No practice score or forum score contributes to the final grade.</p>'
        '<p>Milestones 1–4 each use a 100-point rubric. Milestone 5 consists of a 60-point shared demonstration/handoff and a 40-point individual case exam in the same 25% group, contributing 15 and 10 percentage points of the whole course. The exam evaluates two 20-point criteria: quantitative understanding, and design judgment/ownership. Earlier individual explanations are preparation, not an additional numerical grade.</p>'
        '<p>Submit a dated snapshot of the same record as files, concise text, or a reviewer-accessible artifact link according to the assignment. Include access instructions, source/AI-use disclosure, and honest pending items. Use the posted dates and revision windows. A written alternative can replace a recording or presentation. A justified revision, narrowing, or stop decision can demonstrate learning; a successful sale or favorable AI result is not a grading condition.</p>'
        '<p>Canvas is the official submission and feedback record. A lesson view or submission requirement tracks a visit or receipt, not correctness or mastery. Interactive practice, exports, local browser state, and TA conversation are not submitted automatically. The instructor grades the milestones and individual exam using the rubric; the essay and exam are not automatically assessed by AI.</p>'
        + FEEDBACK_HTML + REVIEWER_HTML + AI_RULE_HTML +
        '<h3>Access and support</h3><p>If a hosted lesson, animation, TA, or optional reference is unavailable, use the native original text, worked tables, and supplied outputs. Submit the same reasoning in Canvas and report the problem. Ask private assessment/access questions through <a href="/conversations">Canvas Inbox</a>; use the course forum for general methods and peer questions. Follow the receiving offering’s accessibility and academic-integrity policies below.</p>'
    )
    if policies_html:
        body += '<h3>Receiving-offering policies</h3>' + policies_html
    return wrap_content(body, eyebrow="Course syllabus · Asynchronous delivery", title="Building AI Solutions")
