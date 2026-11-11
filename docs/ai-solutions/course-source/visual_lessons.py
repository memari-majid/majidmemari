"""Compact, original visual explanations inside the existing twelve-unit course.

No browser script is required to read the supplied examples. The enhancement
uses the same facts and adds stepwise manipulation; it creates no new course
path, assessment, learner account, or stored progress.
"""
from html import escape

LESSON_FIGURE_UNITS = (3, 5, 9, 10, 11, 12)

FIGURE_EVIDENCE = {
    3: "Cedar Desk scope example: manual complete effort is8 minutes. The AI-assisted planning components are draft2, checking3, correction2, and handoff1 minute, total8. If checking takes2 instead of3 minutes while quality is preserved, the total is7 and reduction is12.5%. Partial draft time is not complete effort. The simpler template option has no measured result in this example.",
    5: "Original supplied construction demonstration, distinct from the twelve-case benchmark and from the learner’s actual tests. Initial refund-for-every-input behavior passes only the96-hour ordinary case:1/3. Requiring missing timing gives2/3. An under24-hour owner-review rule gives3/3. Reveal an additional exactly24-hour case:3/4, because it requires90-day credit rather than refund. Add the24-to-under72-hour credit rule:4/4. Four selected cases passing do not prove universal correctness or count as a learner-observed user test.",
    9: "Resource-planning assumptions for one supported release: resource-value allowance$180, incremental cash expense$12, preparation/review/handoff time4.5hours at$24/hour=$108, leaving$60 unallocated resource value. This is a combined cash-and-valued-time allowance, not a cash balance, price or profit. Fifteen available support hours allow3 complete releases with1.5hours unused. An additional revision adds1hour, taking5.5hours and$132 valued time; remaining resource-value allowance becomes$36 and capacity becomes2 complete releases, with4hours unused. Setup and recurring costs outside this scenario still need separate estimates; no user outcome is established by these planning figures.",
    10: "Original hypothetical30-day adoption trial; counts are unique people at day30:100 reached,20 conversations,5 pilot agreements,3 observed successful first-task completions. The observations are supplied fictional case facts, not learner-collected evidence. Rates against all100 are20%,5%,3%; against preceding stages20%,25%,60%. Outreach/support resources$150cash+5hours at$24/hour=$270 including valued time. Three observed completions imply$90 per completion; if all5 complete, cost is$54 each under the same total-resource assumption. Reaching people or agreeing to a pilot is not completed use. A successful first task does not establish continued use, broad effectiveness or a cash saving.",
    11: "New fictional five-working-day review-queue scenario: start empty;30 prepared reply requests arrive each day, eachrequires5minutes of review. Standard capacity120minutes/day processes24; the daily ending queue is6,12,18,24,30. Over5days150arrive,120are reviewed,30remain. Increasing reviewcapacity to150minutes/day processes30 and removes the backlog in a comparison restarted from an empty queue; additional30minutes/day at$24/hour has$12/day or$60over5days of assigned staff-time value. It is cash expense only if additional time is paid. This is a new weeklyreview-capacity assumption, separate from the course’s$60monthly support cost. Accepting only24/day keeps the internalqueue at0 but defers6/day,30total; it does not satisfy all demand. Counts model capacity, not observed quality or waiting-time estimates.",
    12: "Supplied benchmark comparison: manual96minutes and reviewedAI84minutes on the same12cases, both12/12acceptable. Complete-effort reduction is(96−84)/96=12.5%. On an axis starting at80, visible bar lengths are16 and4; their visual difference is75%, but the data reduction stays12.5%. No payroll saving, future reliability, or market demand is established by this comparison. Labels must identify the supplied cases, full-process effort, quality, axis and evidence limits.",
}

SPECS = {
    3: {
        "title": "Where did the six saved minutes go?",
        "prompt": "Predict the complete effort before revealing the work around the draft.",
        "intro": "A fictional planning comparison. The same task must finish with a checked reply or a useful handoff; drafting alone is not the result.",
        "table": "<table><caption>Complete effort, minutes per reply</caption><thead><tr><th scope=\"col\">Component</th><th scope=\"col\">Planning estimate</th></tr></thead><tbody><tr><th scope=\"row\">Manual complete task</th><td>8</td></tr><tr><th scope=\"row\">AI draft</th><td>2</td></tr><tr><th scope=\"row\">Source checking</th><td>3</td></tr><tr><th scope=\"row\">Correction</th><td>2</td></tr><tr><th scope=\"row\">Handoff</th><td>1</td></tr><tr><th scope=\"row\">Assisted complete task</th><td>8</td></tr></tbody></table>",
        "explanation": "The2-minute draft needs6more minutes of work:2+3+2+1=8. It has no full-process time advantage in this scenario. Checking at2minutes would yield7minutes, or12.5% less effort, only if quality remains acceptable. The template-only alternative still needs measurement.",
        "transfer": "In your scope comparison, identify the overlooked step most likely to change the recommendation.",
    },
    5: {
        "title": "A repair is only as good as its next test",
        "prompt": "Predict which cases a new rule fixes—and which it leaves unresolved.",
        "intro": "An original construction demonstration using S2. These supplied prototype outcomes are separate from the12-case benchmark and from the actual test record you must collect.",
        "table": "<table><caption>Supplied repair sequence, not your observed outcomes</caption><thead><tr><th scope=\"col\">Version or reveal</th><th scope=\"col\">Cases passing</th><th scope=\"col\">What changed</th></tr></thead><tbody><tr><th scope=\"row\">Initial rule</th><td>1/3</td><td>Refund eligibility is incorrectly used for every input.</td></tr><tr><th scope=\"row\">Require timing</th><td>2/3</td><td>Ask when the session starts if timing is missing.</td></tr><tr><th scope=\"row\">Route late exceptions</th><td>3/3</td><td>Under24hours needs owner review.</td></tr><tr><th scope=\"row\">Reveal the24-hour boundary</th><td>3/4</td><td>The additional case requires credit, not a refund.</td></tr><tr><th scope=\"row\">Add the credit window</th><td>4/4</td><td>Apply credit from24to under72hours.</td></tr></tbody></table>",
        "explanation": "All three initial cases can pass while an untested boundary still fails. The denominator changes when the fourth case is added. Retest the earlier cases after each correction; four passing cases do not establish universal reliability.",
        "transfer": "Choose a boundary or missing-input case for your own artifact, make a meaningful repair, and record the actual retest.",
    },
    9: {
        "title": "One more revision uses more than a line on the plan",
        "prompt": "Predict what an additional revision changes: resource allowance, support capacity, or both.",
        "intro": "A fictional resource plan for preparing one version, instructions, acceptance task and supported handoff. The allowance combines valued time and stated cash expense; it is not a price or cash balance.",
        "table": "<table><caption>Per-release resource plan and a15-hour support limit</caption><thead><tr><th scope=\"col\">Measure</th><th scope=\"col\">Planned scope</th><th scope=\"col\">Add a second revision</th></tr></thead><tbody><tr><th scope=\"row\">Resource-value allowance</th><td>$180</td><td>$180</td></tr><tr><th scope=\"row\">Incremental cash expense</th><td>$12</td><td>$12</td></tr><tr><th scope=\"row\">Preparation/review/handoff time at$24/hour</th><td>4.5hours /$108</td><td>5.5hours /$132</td></tr><tr><th scope=\"row\">Unallocated resource value</th><td>$60</td><td>$36</td></tr><tr><th scope=\"row\">Complete supported releases within15hours</th><td>3</td><td>2</td></tr></tbody></table>",
        "explanation": "The additional hour consumes$24 of valued time, reducing the unallocated resource-value allowance from$60to$36. It also reduces capacity from3to2 complete supported releases. Neither remainder is cash remaining or profit. This narrow scenario excludes setup and recurring costs, which still need separate estimates. Capacity does not establish that anyone can successfully use the solution.",
        "transfer": "Name one extra request outside your release plan and show how it changes effort, resources and the support commitment.",
    },
    10: {
        "title": "Keep the people—and the denominator—in view",
        "prompt": "Before counting adoption, decide which event demonstrates a successful first task.",
        "intro": "An original hypothetical30-day adoption trial, counting unique people at day30:100reached→20conversations→5pilot agreements→3observed successful first-task completions. These are supplied fictional observations, not your own user-test evidence.",
        "table": "<table><caption>Same30-day adoption trial, different denominators</caption><thead><tr><th scope=\"col\">Stage</th><th scope=\"col\">Count</th><th scope=\"col\">Of100reached</th><th scope=\"col\">Of previous stage</th></tr></thead><tbody><tr><th scope=\"row\">Conversation</th><td>20</td><td>20%</td><td>20/100=20%</td></tr><tr><th scope=\"row\">Pilot agreement</th><td>5</td><td>5%</td><td>5/20=25%</td></tr><tr><th scope=\"row\">Observed successful first task</th><td>3</td><td>3%</td><td>3/5=60%</td></tr></tbody></table>",
        "explanation": "The$270outreach/support resource cost includes$150cash and5hours valued at$24/hour. Three observed successful completions imply$90per completion. If all five pilot participants complete, cost is$54each, assuming the same total resources. Agreements are not completed use, and a first task does not establish continued use or broad effectiveness. This resource-value calculation is not cash savings or profit.",
        "transfer": "Label the stages, denominator, time period and outreach/support effort for your own rollout. Define a successful first task and keep agreement separate from observed use.",
    },
    11: {
        "title": "A faster draft can build a review queue",
        "prompt": "Predict what accumulates when30requests arrive but only24can be reviewed each day.",
        "intro": "New fictional five-working-day capacity case, starting with an empty queue. Each reply needs5minutes of review. It illustrates operations; it is not observed partner performance.",
        "table": "<table><caption>Thirty arrivals and24reviews per working day</caption><thead><tr><th scope=\"col\">Day</th><th scope=\"col\">Arrivals</th><th scope=\"col\">Reviewed</th><th scope=\"col\">End-of-day queue</th></tr></thead><tbody><tr><th scope=\"row\">1</th><td>30</td><td>24</td><td>6</td></tr><tr><th scope=\"row\">2</th><td>30</td><td>24</td><td>12</td></tr><tr><th scope=\"row\">3</th><td>30</td><td>24</td><td>18</td></tr><tr><th scope=\"row\">4</th><td>30</td><td>24</td><td>24</td></tr><tr><th scope=\"row\">5</th><td>30</td><td>24</td><td>30</td></tr></tbody></table>",
        "explanation": "Over five days,150arrive,120are reviewed, and30wait. An additional30minutes of review capacity per day handles all30arrivals; at$24/hour this adds$60of assigned staff-time value over the five-day scenario. It is cash expense only if additional time is paid. This is distinct from the lesson’s$60monthly support assumption. Limiting intake to24avoids an internal queue but defers30requests over five days; demand has not disappeared.",
        "transfer": "Identify the scarce human step, its capacity, what happens when demand exceeds it, and who can change the service promise.",
    },
    12: {
        "title": "The chart changes. The evidence does not.",
        "prompt": "Predict whether changing the axis can change the actual percentage reduction.",
        "intro": "Use the same supplied12-case benchmark:96manual minutes,84reviewed-AI minutes, and12/12acceptable replies for both policies.",
        "table": "<table><caption>Same evidence on both chart scales</caption><thead><tr><th scope=\"col\">Policy</th><th scope=\"col\">Complete effort</th><th scope=\"col\">Acceptable replies</th></tr></thead><tbody><tr><th scope=\"row\">Manual</th><td>96minutes</td><td>12/12</td></tr><tr><th scope=\"row\">Reviewed AI</th><td>84minutes</td><td>12/12</td></tr></tbody></table>",
        "explanation": "The actual reduction is12/96=12.5%. Starting the axis at80leaves visible bar lengths16and4: the second visible length is75%shorter, although the data did not change. This comparison supports a limited complete-effort claim, not guaranteed cash savings, future reliability, or market demand.",
        "transfer": "Audit one figure in your demonstration: identify its baseline, units, denominator, evidence setting, and a claim it cannot support.",
    },
}

# Normalize only prose strings, never HTML markup or attributes. Authoring keeps
# explanatory numbers compact in this data block; rendered text stays readable.
def _prose_spacing(text):
    import re
    text = re.sub(r"(?<=[a-z])(?=\d|\$)", " ", text)
    text = re.sub(r"(?<=\d)(?=[A-Za-z])", " ", text)
    text = re.sub(r"(?<=\d)(?=\$)", " ", text)
    return text


def _space_html_text(fragment):
    import re
    return "".join(part if part.startswith("<") else _prose_spacing(part)
                   for part in re.split(r"(<[^>]+>)", fragment))


FIGURE_EVIDENCE = {unit: _prose_spacing(value) for unit, value in FIGURE_EVIDENCE.items()}


def render_lesson_figure(unit):
    """Return one inline figure with complete script-free explanatory content."""
    if unit not in SPECS:
        return ""
    spec = SPECS[unit]
    safe = lambda key: escape(_prose_spacing(spec[key]))
    return f'''<section class="lesson-figure" data-lesson-figure="{unit}" aria-labelledby="lesson-figure-{unit}-title">
<p class="lesson-figure-kicker">See the decision</p>
<h3 id="lesson-figure-{unit}-title">{safe('title')}</h3>
<p class="lesson-figure-prompt">{safe('prompt')}</p>
<p class="lesson-figure-provenance">{safe('intro')}</p>
<div data-lf-fallback><div class="lesson-figure-table" tabindex="0" role="region" aria-label="Worked figure data">{_space_html_text(spec['table'])}</div><p class="lesson-figure-insight">{safe('explanation')}</p></div>
<p class="lesson-figure-transfer"><strong>Use it in your project:</strong> {safe('transfer')}</p>
</section>'''
