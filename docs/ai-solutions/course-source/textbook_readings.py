"""Assigned, free textbook readings and original application questions.

This module contains references and course-authored reading directions, never
publisher chapter text. The official books stay on their owners' websites.
"""
from html import escape
from urllib.parse import urlsplit

BOOKS = {
    "cambridge-ai": {
        "title": "Artificial Intelligence: Foundations of Computational Agents",
        "authors": "David L. Poole and Alan K. Mackworth",
        "edition": "3rd edition",
        "year": "2023",
        "publisher": "Cambridge University Press",
        "url": "https://artint.info/3e/html/ArtInt3e.html",
        "access": "Free official author-hosted HTML, available with the publisher's permission.",
        "role": "Primary academic AI foundation; only the listed conceptual passages are assigned.",
    },
    "openstax-entrepreneurship": {
        "title": "Entrepreneurship",
        "authors": "Michael Laverty and Chris Littel",
        "edition": "1st edition",
        "year": "2020",
        "publisher": "OpenStax, Rice University",
        "url": "https://openstax.org/books/entrepreneurship/pages/1-introduction",
        "access": "Free official online textbook; no paid access code is required.",
        "role": "Business companion for selected principles of needs, feasibility, resources, and adoption.",
    },
    "openstax-statistics": {
        "title": "Introductory Statistics 2e",
        "authors": "Barbara Illowsky and Susan Dean",
        "edition": "2nd edition",
        "year": "2023",
        "publisher": "OpenStax, Rice University",
        "url": "https://openstax.org/books/introductory-statistics-2e/pages/1-introduction",
        "access": "Free official online textbook; no paid access code is required.",
        "role": "Quantitative companion for the specific statistics used in the course.",
    },
}

# Assignment scopes were reviewed against official sections on November 11, 2026.
# Business companion selections are added after their source-level review.
READING_PLAN = {1: [{'book': 'cambridge-ai',
      'section': '1.1',
      'title': 'What is Artificial Intelligence?',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch1.S1.html',
      'scope': 'Read the opening of section 1.1 only. Stop at the heading 1.1.1 Artificial and Natural '
               'Intelligence. Do not follow links or read later subsections.',
      'purpose': 'Introduces agents, goals, limited information, adaptation, and human assistance without '
                 'requiring programming.',
      'bridge': 'In this course, a useful AI capability is a task you can observe and check: summarize, extract, '
                'classify, generate, recommend, or help carry out a bounded workflow. A fluent answer alone does '
                'not establish that a task was completed correctly. Current tool demonstrations and limitations '
                'come from the unit guide, rather than treating a 2023 book as a live product catalog.',
      'prompt': 'Name one real task, the input the tool would receive, the output you need, and one check a '
                'person must make before relying on that output.',
      'minutes': 12}],
 2: [{'book': 'openstax-entrepreneurship',
      'section': '5.2',
      'title': 'Researching Potential Business Opportunities',
      'url': 'https://openstax.org/books/entrepreneurship/pages/5-2-researching-potential-business-opportunities',
      'scope': 'Read the opening paragraph and Common Sources of Research Data, including the primary and '
               'secondary research explanations. Skip the Link to Learning box. Stop at the heading Researching '
               'and Verifying the Entrepreneurial Opportunity; later material is not assigned.',
      'purpose': 'Distinguish existing information from research gathered to answer a specific need question.',
      'bridge': "For any discipline, translate the book's customer into the intended user and its opportunity "
                'into a worthwhile problem. This is an application of the research principle; a friendly response '
                'is not proof of demand.',
      'prompt': 'Identify one existing source and one direct observation you still need. Explain which claim each '
                'can support.',
      'minutes': 9},
     {'book': 'openstax-statistics',
      'section': '2.5',
      'title': 'Measures of the Center of the Data',
      'url': 'https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data',
      'scope': 'Read the first two paragraphs defining mean, median, and outliers. Then jump to Example 2.27 and '
               'read its problem and explanation; its displayed arithmetic can be checked with an ordinary '
               'calculator. Skip other examples, formulas, and calculator instructions.',
      'purpose': 'Shows why an average can hide an unusual value and why a typical result should be described '
                 'carefully.',
      'bridge': 'Report the baseline, revised result, sample size, and variation before making an impact claim. '
                'Time saved is potential capacity; it becomes a cash saving only when an actual expense is '
                "reduced. Include review time, rework, setup, and ongoing tool costs in the course's original "
                'resource table. These readings support interpreting results, not a guarantee of financial '
                'return.',
      'prompt': 'Compare a typical baseline and revised result. Explain whether an outlier changes the '
                'conclusion, then separate measured time changes, estimated capacity, actual expenses, and '
                'assumptions.',
      'minutes': 9}],
 3: [{'book': 'cambridge-ai',
      'section': '1.6.3',
      'title': 'Defining a Solution',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch1.S6.html',
      'scope': 'Go to 1.6.3 Defining a Solution. Read from that heading through the Optimal solution and '
               'Satisficing solution entries. Stop before Approximately optimal solution. Earlier 1.6 subsections '
               'and later Representations are not assigned.',
      'purpose': 'Shows why informal requests need explicit success criteria, limits, and consequences for '
                 'incomplete or incorrect outputs.',
      'bridge': 'A first solution should solve one bounded task well enough for a stated use. Write a minimum '
                'acceptable result, not a promise that the AI is always right. Consider whether a simpler '
                'checklist, template, search tool, or process change would meet the need without AI.',
      'prompt': 'Write one measurable acceptance rule, one task outside the scope, and one costly mistake the '
                'solution must avoid. Explain why AI is useful here compared with a simpler alternative.',
      'minutes': 12},
     {'book': 'openstax-entrepreneurship',
      'section': '11.3',
      'title': 'Conducting a Feasibility Analysis',
      'url': 'https://openstax.org/books/entrepreneurship/pages/11-3-conducting-a-feasibility-analysis',
      'scope': 'Read the opening explanation and Organizational Feasibility Analysis only. Stop at Financial '
               'Feasibility Analysis. Do not prepare a business plan or financial statements.',
      'purpose': 'Evaluate whether people, skills and resources can support the proposed scope.',
      'bridge': 'Feasibility is separate from usefulness. A community, personal, research or business solution '
                'needs both a worthwhile task and a practicable way to perform it.',
      'prompt': 'Name one resource or skill constraint that changes the scope of your AI solution.',
      'minutes': 6}],
 4: [{'book': 'cambridge-ai',
      'section': '1.3',
      'title': 'Agents Situated in Environments',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch1.S3.html',
      'scope': 'Read section 1.3, including the list of information and abilities available to an agent. Do not '
               'follow chapter or technical-term links.',
      'purpose': 'Gives a conceptual account of inputs, goals, prior knowledge, actions, and human participation.',
      'bridge': 'Draw the practical path from a request to a reviewed result: input, approved information, AI '
                'step, human check, and next action. A diagram is a design proposal; it does not mean the AI has '
                'tool access or permission to act. Every external action needs an actual implementation and an '
                'appropriate approval boundary.',
      'prompt': 'Sketch five workflow steps. Mark where information enters, where the AI contributes, where a '
                'person checks it, and what happens when the input is missing or the output fails a check.',
      'minutes': 12}],
 5: [{'book': 'cambridge-ai',
      'section': '1.6.2',
      'title': 'Tasks: the four-step task framework',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch1.S6.html',
      'scope': 'Go to 1.6.2 Tasks. Read its opening paragraphs, Figure 1.9, and four-step list. Stop immediately '
               'after that list, before the discussion distinguishing long-term knowledge and immediate belief.',
      'purpose': 'Connects a stated need to inputs, an output or action, and interpretation of that output.',
      'bridge': 'Build the smallest version that can carry out the selected task with approved sample input. A '
                "paper mockup can clarify an idea, but the course's final AI-assisted artifact must be usable and "
                'tested according to the project requirements. Follow the original no-code build guide for the '
                'chosen available tool; these readings explain the design logic, not tool-specific setup.',
      'prompt': 'Identify the input, the usable output, and the question your first prototype will test. State '
                'which part works now and which part is still simulated or carried out by a person.',
      'minutes': 12}],
 6: [{'book': 'openstax-statistics',
      'section': '1.4',
      'title': 'Experimental Design and Ethics',
      'url': 'https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics',
      'scope': 'Read the opening of section 1.4, from the introduction through the definition of a double-blind '
               'experiment. Stop before Example 1.19. No medical experiment or statistical calculation is '
               'assigned.',
      'purpose': 'Introduces changed and measured variables, comparison groups, lurking variables, random '
                 'assignment, and blinding.',
      'bridge': 'Compare the current approach with the AI-assisted approach on comparable tasks using the same '
                'scoring rules. Keep some new cases for a later retest. Random assignment or alternating task '
                'order can reduce particular sources of bias, but a small classroom pilot does not guarantee '
                'balanced groups or prove a general causal effect. Record limitations instead of claiming '
                'certainty.',
      'prompt': 'Name the factor you will change, the result you will measure, the comparison approach, and one '
                'factor that could make the comparison unfair. Describe how you will reduce that problem.',
      'minutes': 9},
     {'book': 'cambridge-ai',
      'section': '7.4',
      'title': 'Overfitting: introductory example',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch7.S4.html',
      'scope': 'Read the opening explanation and Example 7.15 about restaurant ratings. Stop before the next '
               'discussion of model complexity and Example 7.16. The polynomial example and equations are not '
               'assigned.',
      'purpose': 'Provides an accessible example of why a result based on a small or favorable sample can '
                 'disappoint later.',
      'bridge': 'Compare the current approach with the AI-assisted approach on comparable tasks using the same '
                'scoring rules. Keep some new cases for a later retest. Random assignment or alternating task '
                'order can reduce particular sources of bias, but a small classroom pilot does not guarantee '
                'balanced groups or prove a general causal effect. Record limitations instead of claiming '
                'certainty.',
      'prompt': 'Name the factor you will change, the result you will measure, the comparison approach, and one '
                'factor that could make the comparison unfair. Describe how you will reduce that problem.',
      'minutes': 9}],
 7: [{'book': 'cambridge-ai',
      'section': '7.1',
      'title': 'Learning Issues: measuring success on new cases',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch7.S1.html',
      'scope': 'Read the initial Task, Data, and Measure of improvement definitions. Then jump to Measuring '
               'success and read that block, stopping before Bias. The illustrative P and N classifier paragraph '
               'may be skimmed; no symbolic work is assigned.',
      'purpose': 'Distinguishes success on familiar examples from performance on cases not used to improve the '
                 'system.',
      'bridge': 'Use an observed failure to change the artifact or workflow, then try the revision on new '
                'comparable cases. Here, improving prompts or instructions is not the same as training the '
                'underlying AI model. The retained cases help test your revised solution; they do not certify all '
                'future uses.',
      'prompt': 'Record one observed failure, one specific revision, and the outcome on a new case. Explain what '
                'your evidence supports and what it cannot yet establish.',
      'minutes': 8},
     {'book': 'cambridge-ai',
      'section': '7.7',
      'title': 'Social Impact: validation and real-world use',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch7.S7.html',
      'scope': 'Read only the final three paragraphs, beginning with the paragraph about a model performing well '
               'on held-out validation data and ending before the navigation links. Earlier examples and section '
               '7.6 are not assigned.',
      'purpose': 'Explains why a test result can fail to transfer to the actual setting, and why a prediction '
                 'alone is not a decision.',
      'bridge': 'Use an observed failure to change the artifact or workflow, then try the revision on new '
                'comparable cases. Here, improving prompts or instructions is not the same as training the '
                'underlying AI model. The retained cases help test your revised solution; they do not certify all '
                'future uses.',
      'prompt': 'Record one observed failure, one specific revision, and the outcome on a new case. Explain what '
                'your evidence supports and what it cannot yet establish.',
      'minutes': 7}],
 8: [{'book': 'cambridge-ai',
      'section': '18.4',
      'title': 'Work and Automation: tasks and human judgment',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch18.S4.html',
      'scope': 'Read the first three paragraphs only, ending with the discussion of prediction and human '
               'judgment. Stop before the paragraph discussing new job categories. Later labor-market forecasts '
               'and policy proposals are not assigned.',
      'purpose': 'Frames automation as changes to tasks and skills, with human judgment still needed.',
      'bridge': 'Report the baseline, revised result, sample size, and variation before making an impact claim. '
                'Time saved is potential capacity; it becomes a cash saving only when an actual expense is '
                "reduced. Include review time, rework, setup, and ongoing tool costs in the course's original "
                'resource table. These readings support interpreting results, not a guarantee of financial '
                'return.',
      'prompt': 'Compare a typical baseline and revised result. Explain whether an outlier changes the '
                'conclusion, then separate measured time changes, estimated capacity, actual expenses, and '
                'assumptions.',
      'minutes': 8},
     {'book': 'openstax-entrepreneurship',
      'section': '9.4',
      'title': 'Developing Startup Financial Statements and Projections: cash flows',
      'url': 'https://openstax.org/books/entrepreneurship/pages/9-4-developing-startup-financial-statements-and-projections',
      'scope': 'Go directly to The Statement of Cash Flows. Read its first four paragraphs, including the '
               'unpaid-client explanation, and stop before Figure 9.14. The rest of the page, accounting '
               'exercises and break-even formulas are not assigned.',
      'purpose': 'Distinguish a statement about value or earnings from actual cash received or paid.',
      'bridge': 'Released time has a stated capacity value in the course scenario. Released time becomes a cash '
                'saving only when actual cash spending is reduced; additional cash receipts would be a separate '
                "cash benefit. The textbook does not validate the course's assumed dollar rates or benefits.",
      'prompt': 'In your resource table, identify which entries change cash and which only value time or '
                'capacity.',
      'minutes': 8}],
 9: [{'book': 'cambridge-ai',
      'section': '2.3.3',
      'title': 'Offline and Online Computation: the Users role',
      'url': 'https://artint.info/3e/html/ArtInt3e.Ch2.S3.html',
      'scope': 'Go to 2.3.3, find the online roles list, and read only the Users item and its following two '
               'paragraphs. Stop before Sensors. The earlier sections 2.3.1 and 2.3.2, formulas, and other roles '
               'are not assigned.',
      'purpose': 'Explains that users may not know which inputs are needed and require a natural interface and '
                 'understandable recommendations.',
      'bridge': 'A release needs clear instructions, required inputs, a bounded purpose, a checkable output, and '
                'a route for help or stopping. An AI-generated explanation is another output to verify; it is not '
                'independent evidence that a recommendation is correct.',
      'prompt': 'Write a three-sentence first-use guide: who it is for, what input to provide, and what the '
                'person must check. Add one clear stop or escalation condition.',
      'minutes': 12},
     {'book': 'openstax-entrepreneurship',
      'section': '14.1',
      'title': 'Types of Resources',
      'url': 'https://openstax.org/books/entrepreneurship/pages/14-1-types-of-resources',
      'scope': 'Read the opening explanation and the first paragraph under Tangible Resources. Then read the '
               'opening paragraph under Intangible Resources. Skip equipment shopping lists, funding, '
               'patent/legal advice and linked activities.',
      'purpose': 'Identify different resource categories before promising that a solution can be delivered.',
      'bridge': 'A file or AI subscription alone does not supply the time, knowledge, permissions and support '
                'needed for use. The course resource allowance is an original planning example, not a textbook '
                'accounting measure.',
      'prompt': 'Identify one tangible and one intangible resource your release needs, and one requirement your '
                'estimate omitted.',
      'minutes': 6}],
 10: [{'book': 'cambridge-ai',
       'section': '18.2',
       'title': 'Values and Bias',
       'url': 'https://artint.info/3e/html/ArtInt3e.Ch18.S2.html',
       'scope': 'Read section 18.2. Do not follow links to the no-free-lunch theorem, technical chapters, or the '
                'references.',
       'purpose': 'Asks whose values and experiences shape a system, including people affected indirectly by its '
                  'use.',
       'bridge': "Availability does not establish adoption, successful use, or equitable benefit. The unit's "
                 'original rollout guide supplies the practical communication and onboarding steps. Use the '
                 'textbook lens to ask whether the chosen access method, language, costs, and workflow exclude '
                 'anyone or impose unwanted work on others.',
       'prompt': 'Name one intended user and one affected non-user. Identify one barrier or unequal burden, one '
                 'change that could reduce it, and an observable sign that people can use the solution '
                 'successfully.',
       'minutes': 12},
      {'book': 'openstax-entrepreneurship',
       'section': '8.2',
       'title': 'Market Research, Market Opportunity Recognition, and Target Market',
       'url': 'https://openstax.org/books/entrepreneurship/pages/8-2-market-research-market-opportunity-recognition-and-target-market',
       'scope': 'Read the introduction, then only the first paragraph under Define the Research Goal and the '
                'first paragraph under Determine Research Design. Skip the remaining paragraphs of both '
                'subsections, later research steps, sampling advice, market-size calculations and campaign '
                'activities.',
       'purpose': 'Choose a specific audience and an evidence-gathering method before interpreting interest or '
                  'use.',
       'bridge': 'Apply the research principle to intended users in any setting. Reaching someone, gaining '
                 'agreement and observing a completed task are different evidence states; the course funnel is an '
                 'original teaching example.',
       'prompt': 'State one question about starting or using your solution and an observation that could answer '
                 'it.',
       'minutes': 8}],
 11: [{'book': 'cambridge-ai',
       'section': '18.8',
       'title': 'Governance and Regulation: internal governance',
       'url': 'https://artint.info/3e/html/ArtInt3e.Ch18.S8.html',
       'scope': 'Read only the final four paragraphs, starting where governance is described as including '
                'internal governance. Stop before navigation. The earlier country-specific and draft-law '
                'descriptions are historical and are not assigned as current legal guidance.',
       'purpose': 'Introduces organizational accountability and explains why a human-oversight label alone does '
                  'not establish safety.',
       'bridge': 'Dependable delivery needs a named owner, scheduled checks, a way to report failures, and a '
                 'working fallback. Human review helps only when the reviewer has the information, skill, time, '
                 'and authority to act. The original operating checklist translates these general principles into '
                 'project-specific responsibilities; it is not a legal compliance certification.',
       'prompt': 'Name the owner, a check they will perform, a failure that triggers pausing the solution, and '
                 'the fallback users can actually follow. State when the next review will happen.',
       'minutes': 12}],
 12: [{'book': 'cambridge-ai',
       'section': '1.6.3',
       'title': 'Defining a Solution: revisit the acceptance criteria',
       'url': 'https://artint.info/3e/html/ArtInt3e.Ch1.S6.html',
       'scope': 'Revisit the same section 1.6.3 passage assigned in Unit 3: heading through the Satisficing '
                'solution entry, stopping before Approximately optimal solution. This is a review, not a new '
                'whole-section assignment.',
       'purpose': 'Connects the final demonstration to the success criteria set before building.',
       'bridge': 'Defend the result using the original need, acceptance rule, observed use, revision, and retest. '
                 'Separate demonstrated behavior from an unimplemented plan and identify remaining risks. A '
                 'credible final recommendation can be to continue, revise, limit, or stop the solution.',
       'prompt': 'Give your final recommendation and support it with one measured result, one demonstrated '
                 'change, and one remaining limitation. Explain who owns the next decision and why the evidence '
                 'is sufficient for that limited next step.',
       'minutes': 11},
      {'book': 'openstax-entrepreneurship',
       'section': '7.3',
       'title': 'Developing Pitches for Various Audiences and Goals',
       'url': 'https://openstax.org/books/entrepreneurship/pages/7-3-developing-pitches-for-various-audiences-and-goals',
       'scope': 'Read the introductory discussion before Table 7.3 and the first paragraph under Pitch Audiences. '
                "Skip the table's specific timings, investor fundraising sections and external videos.",
       'purpose': 'Adapt a concise problem/solution explanation and specific request to its audience.',
       'bridge': 'A request can be for a classroom review, an approved pilot, feedback or continued use. '
                 'Investment, a company, a sale and a public launch are not required.',
       'prompt': 'Name your audience, the evidence it needs and one proportionate next request.',
       'minutes': 7}]}


def validate_readings(plan=None):
    plan = READING_PLAN if plan is None else plan
    assert sorted(plan) == list(range(1, 13)), "Assign a reading to every unit"
    required = {"book", "section", "title", "url", "scope", "purpose", "bridge", "prompt", "minutes"}
    for unit, readings in plan.items():
        assert readings, f"Unit {unit} has no assigned reading"
        for reading in readings:
            assert required <= reading.keys(), f"Unit {unit} is missing reading directions"
            assert reading["book"] in BOOKS, f"Unknown textbook in Unit {unit}"
            url = urlsplit(reading["url"])
            assert url.scheme == "https" and not url.username and not url.password
            source_prefix = {
                "cambridge-ai": "https://artint.info/3e/html/",
                "openstax-statistics": "https://openstax.org/books/introductory-statistics-2e/pages/",
                "openstax-entrepreneurship": "https://openstax.org/books/entrepreneurship/pages/",
            }[reading["book"]]
            assert reading["url"].startswith(source_prefix), "Match the reading to its official textbook source"
            assert not url.query, "Use the stable assigned section without tracking or login parameters"
            assert isinstance(reading["minutes"], int) and 1 <= reading["minutes"] <= 30
            assert all(isinstance(reading[k], str) and reading[k].strip() for k in required - {"minutes"})
    return plan


def reading_workload(plan=None):
    """Return planning estimates from the assigned scopes, not measured effort."""
    assignments = READING_PLAN if plan is None else plan
    per_unit = {unit: sum(r["minutes"] for r in rs) for unit, rs in assignments.items()}
    values = list(per_unit.values())
    return {"per_unit_minutes": per_unit, "minimum_minutes": min(values, default=0),
            "maximum_minutes": max(values, default=0), "total_minutes": sum(values)}


def _reference(reading):
    book = BOOKS[reading["book"]]
    return (f'{book["authors"]}. {book["title"]}. {book["edition"]}. '
            f'{book["publisher"]}, {book["year"]}.')


def render_required_reading(unit, *, delivery="standalone", plan=None):
    """Render one unit's assignment, with an LMS-safe text-only variant."""
    if delivery not in {"standalone", "canvas"}:
        raise ValueError("Unknown reading delivery")
    assignments = READING_PLAN if plan is None else plan
    readings = assignments.get(unit, [])
    if not readings:
        return ""
    minutes = sum(r["minutes"] for r in readings)
    html = (
        f'<section class="reading-entry" data-required-reading="{unit}" '
        f'aria-labelledby="required-reading-heading-{unit}">'
        f'<p class="eyebrow">Required textbook reading · about {minutes} minutes</p>'
        f'<h2 id="required-reading-heading-{unit}">Read, then apply one idea</h2>'
        '<p>Read only the passages listed here. Mathematical derivations, algorithms, '
        'code, and end-of-chapter exercises are not assigned.</p>'
    )
    readers = []
    for index, r in enumerate(readings, 1):
        label = f'{r["section"]}: {r["title"]}'
        html += (
            f'<h3>{escape(label)}</h3><p>{escape(_reference(r))}</p>'
            f'<p><strong>Read:</strong> {escape(r["scope"])}</p>'
            f'<p><strong>Why this unit:</strong> {escape(r["purpose"])}</p>'
        )
        if delivery == "canvas":
            html += (
                '<p>Read this official section in the textbook reader inside the '
                'embedded lesson above. Stay on this Canvas page.</p>'
                f'<p><strong>Source:</strong> <span>{escape(r["url"])}</span></p>'
            )
        else:
            readers.append(
                '<details class="textbook-reader"><summary>Read this textbook section here</summary>'
                '<p>The official source is displayed below. Read only the assigned scope; '
                'other chapters, coding activities, and exercises on the source site are optional.</p>'
                f'<iframe data-textbook-src="{escape(r["url"], quote=True)}" '
                f'title="Unit {unit} textbook reading {index}: {escape(label, quote=True)}" '
                'width="100%" height="600" loading="lazy" '
                'sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" '
                'style="width:100%;height:600px;border:1px solid #d8dee5;border-radius:8px" '
                'data-kb-skip></iframe>'
                f'<p class="standalone-only"><a href="{escape(r["url"], quote=True)}" '
                'target="_blank" rel="noopener noreferrer">Official textbook section ↗</a></p>'
                '</details>'
            )
    for bridge in dict.fromkeys(r["bridge"] for r in readings):
        html += f'<p><strong>Course connection:</strong> {escape(bridge)}</p>'
    prompts = list(dict.fromkeys(r["prompt"] for r in readings))
    html += '<p><strong>Apply one idea:</strong> Choose one prompt for the brief connection in your existing project update.</p><ul>'
    html += ''.join(f'<li>{escape(prompt)}</li>' for prompt in prompts) + '</ul>'
    html += ''.join(readers)
    html += (
        '<p>Add a brief connection to your existing project update: identify the book '
        'and section, explain one relevant idea in your own words, and show the decision '
        'it informs. This is part of the same update, not another assignment.</p>'
        '<p class="muted">If the official reader is unavailable or inaccessible, use '
        'the original lesson explanation and worked example, apply the same question, '
        'and label that access alternative honestly. Report the problem through the '
        'course support route; do not claim to have read an unavailable text.</p></section>'
    )
    return html


def render_reading_plan(*, delivery="standalone", plan=None):
    """Render the one-path unit schedule without reproducing book content."""
    if delivery not in {"standalone", "canvas"}:
        raise ValueError("Unknown reading delivery")
    assignments = READING_PLAN if plan is None else plan
    html = (
        '<section id="required-textbooks"><h2>Your free textbook reading plan</h2>'
        '<p>Short textbook readings support the same twelve-unit path. No book purchase, '
        'access code, programming background, or full-book sequence is required. Read '
        'the named scope of each listed source, then choose one idea or prompt for the project update you already submit.</p>'
        '<dl class="book-list">'
    )
    for book in BOOKS.values():
        label = escape(book["title"])
        if delivery == "standalone":
            label = f'<a href="{escape(book["url"], quote=True)}" target="_blank" rel="noopener">{label} ↗</a>'
        html += (f'<dt>{label}</dt><dd>{escape(book["authors"])}. '
                 f'{escape(book["edition"])}, {escape(book["publisher"])}, {escape(book["year"])}. '
                 f'{escape(book["role"])} {escape(book["access"])}</dd>')
    html += (
        '</dl><p>The AI text is an academic foundation; the course supplies its own '
        'current-tool guidance, no-code implementation activities, fictional cases, '
        'simulations, and assessment.</p>'
        '<table><caption>Twelve units: required textbook scope and project connection</caption>'
        '<thead><tr><th scope="col">Unit</th><th scope="col">Reading and scope</th>'
        '<th scope="col">Apply to the same project</th><th scope="col">Approximate time</th>'
        '</tr></thead><tbody>'
    )
    for unit in sorted(assignments):
        readings = assignments[unit]
        scope = '<br>'.join(
            f'<strong>{escape(BOOKS[r["book"]]["authors"])} · '
            f'{escape(r["section"])}: {escape(r["title"])}</strong><br>{escape(r["scope"])}'
            for r in readings
        )
        prompt = '<br>'.join(escape(value) for value in dict.fromkeys(r["prompt"] for r in readings))
        minutes = sum(r["minutes"] for r in readings)
        html += f'<tr><th scope="row">{unit:02d}</th><td>{scope}</td><td>{prompt}</td><td>{minutes} minutes</td></tr>'
    html += (
        '</tbody></table><p>Readings are free at their official sources. The course '
        'links to or displays those sources; it does not copy their chapters, figures '
        'or restricted instructor materials into the course download or TA corpus. '
        'The course TA knows the assignment directions and original course explanations; '
        'it cannot claim to have the complete textbook text.</p></section>'
    )
    return html
