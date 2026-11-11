#!/usr/bin/env python3
"""Build an additive Canvas cartridge from the maintained public curriculum.

Python standard library only. Canvas extension structures follow Instructure's
own exporter/importer; see README.md for source links and operational limits.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import xml.etree.ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
SOURCE_DIR = HERE
COURSE = HERE.parents[1]
SOURCE = COURSE / "site" / "course_content.py"
BASE = "https://www.majidmemari.com/teaching/ai-solutions/"
CC = "http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"
CANVAS = "http://canvas.instructure.com/xsd/cccv1p0"
DT = "http://www.imsglobal.org/xsd/imsccv1p1/imsdt_v1p1"
QTI = "http://www.imsglobal.org/xsd/ims_qtiasiv1p2"
LOM = "http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest"
XSI = "http://www.w3.org/2001/XMLSchema-instance"
APP_TYPE = "associatedcontent/imscc_xmlv1p1/learning-application-resource"
PACKAGE = HERE / "building-ai-solutions-canvas.imscc"
sys.path.insert(0, str(HERE))
from theme import THEME_VERSION, render_criteria, style_fragment, wrap_content


def child(parent, tag, value=None, **attributes):
    el = ET.SubElement(parent, tag, attributes)
    if value is not None:
        el.text = str(value).lower() if isinstance(value, bool) else str(value)
    return el


def root(tag, namespace, **attributes):
    return ET.Element(tag, {"xmlns": namespace, **attributes})


def xml(element):
    ET.indent(element, space="  ")
    return ET.tostring(element, encoding="utf-8", xml_declaration=True)


def identifier(kind, number=""):
    return f"memari_ai_solutions_v1_{kind}_{number}".rstrip("_")


def load_content():
    spec = importlib.util.spec_from_file_location("canvas_course_content", SOURCE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.validate_content()
    return module.UNITS, module.MILESTONES


def load_visuals():
    spec = importlib.util.spec_from_file_location("canvas_visual_lessons", COURSE / "site" / "visual_lessons.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def normalize_practice(unit, source):
    n = unit["number"]
    questions = []
    for index, question in enumerate(source.UNIT_PRACTICE[n], 1):
        qid = identifier(f"practice_question_{n}", index)
        choices = [{"id": f"{qid}_choice_{choice_index}", "text": choice["text"],
                    "feedback": style_fragment(f'<p>{escape(choice["feedback"])}</p>')}
                   for choice_index, choice in enumerate(question["choices"], 1)]
        prompt = f'<p>{escape(question["prompt"])}</p>'
        questions.append({"id": qid, "title": question.get("section", f"Apply Unit {n}"),
                          "prompt_html": wrap_content(prompt, compact=True), "choices": choices,
                          "answer": question["correct_index"],
                          "explanation": style_fragment(f'<p>{escape(question["rationale"])}</p>')})
    assert len(questions) == 3
    return {"unit": n, "questions": questions,
            "evidence_prompt_html": wrap_content(source.UNIT_EVIDENCE[n],
                                                  title="Your project update", compact=True)}


def assignment_html(milestone):
    title = f'Milestone {milestone["number"]}: {milestone["title"]}'
    checklist = "".join(f"<li>{escape(c)}</li>" for c in milestone["checklist"])
    body = (
        f"<h2>{escape(title)}</h2>"
        f'<p>Complete after Unit {milestone["unit"]} in this Canvas module. '
        "Use the schedule and feedback arrangements announced for this offering.</p>"
        "<p>Submit a dated snapshot of the same continuing capstone. Upload the "
        "relevant files, enter a concise evidence record, or submit a reviewer-accessible "
        "artifact link. Include instructions and permissions needed for review. "
        "Submit the evidence here in Canvas; working in the lesson does not submit it automatically.</p>"
        '<h3>What to produce</h3>' + milestone["brief_html"] +
        f'<h3>Before you submit</h3><ul>{checklist}</ul>'
        f'<h3>Assessment criteria</h3><p>The criteria total {milestone.get("_points", 100)} points for this '
        'submission. Use the course guide for the approved course weights and feedback route.</p>'
        + render_criteria(milestone["rubric"]) +
        '<p>Use approved or fictional information. Label supplied facts, observations, '
        'role-play, assumptions, and AI assistance accurately. A defensible decision to '
        'revise, narrow, or stop can demonstrate sound evidence-based judgment.</p>'
    )
    body = wrap_content(body, eyebrow="Your continuing capstone", compact=True)
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Assignment: {escape(title)}</title></head><body>{body}</body></html>').encode()


def native_reading_references(fragment):
    """Keep optional source citations readable without external LMS navigation."""
    class Citations(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.parts, self.links = [], []

        def handle_starttag(self, tag, attrs):
            href = dict(attrs).get("href", "")
            external = tag == "a" and urlsplit(href).scheme.lower() in {"http", "https"}
            if tag == "a":
                self.links.append(href if external else None)
            self.parts.append("<span>" if external else self.get_starttag_text())

        def handle_endtag(self, tag):
            href = self.links.pop() if tag == "a" else None
            self.parts.append(f' <span>({escape(href)})</span></span>' if href else f'</{tag}>')

        def handle_data(self, data): self.parts.append(data)
        def handle_entityref(self, name): self.parts.append(f'&{name};')
        def handle_charref(self, name): self.parts.append(f'&#{name};')
        def handle_startendtag(self, tag, attrs): self.parts.append(self.get_starttag_text())
        def handle_comment(self, data): self.parts.append(f'<!--{data}-->')

    parser = Citations()
    parser.feed(fragment)
    parser.close()
    return ''.join(parser.parts)


def lesson_body_html(unit, *, templates_href=None, guide_href=None):
    """Render the shared lesson body for a cartridge or a native page update.

    Installed-page updates pass already-observed Canvas-relative resource routes;
    the portable package keeps Canvas's migration-reference tokens by default.
    """
    n = unit["number"]
    frame_title = f'Unit {n:02d}: {unit["title"]} — interactive lesson'
    body = (
        '<p>Work through <strong>Learn → Try → Build → Finish</strong> in the lesson below. '
        'Open the <strong>Course TA</strong> section on this Canvas page when you want to work through a question. '
        'Then use <strong>Canvas Next</strong> to continue through this module and submit '
        'your practice quiz and project response. Keep improving the same project record.</p>'
        f'<iframe src="{BASE}unit-{n:02d}.html?delivery=canvas" '
        f'title="{escape(frame_title, quote=True)}" width="100%" height="1000" '
        'style="border: 0;"></iframe>'
        '<p>Your practice quiz, project response, submission history, instructor feedback, and module progress '
        'are recorded in Canvas. Opening this page records a visit; it does not confirm '
        'that you completed the lesson or mastered its concepts.</p>'
    )
    assistant_title = f'Course teaching assistant for Unit {n:02d}: {unit["title"]}'
    assistant = (
        '<details data-course-ta="inline"><summary>Course TA — work through a question</summary>'
        '<p>Ask for a simpler explanation, help with the numbers, or a hint for your next step. '
        'This assistant uses the course material for this unit. Submit work and read instructor feedback in Canvas.</p>'
        f'<iframe src="{BASE}assistant?lesson=unit-{n:02d}.html&amp;embed=1&amp;delivery=canvas" '
        f'title="{escape(assistant_title, quote=True)}" '
        'width="100%" height="760" loading="lazy" style="border:0;"></iframe></details>'
    )
    q = unit["finish_check"]
    reading = (
        '<details><summary>Read the complete text lesson and worked examples</summary>'
        '<p><strong>Required core reading.</strong> This original text version covers the lesson '
        'without depending on the interactive frame or an AI service. Open this text lesson '
        'before printing; Canvas cannot automatically open it when you print.</p>'
        '<h3>By the end of this unit</h3><ul>'
        + ''.join(f'<li>{escape(o)}</li>' for o in unit["objectives"]) + '</ul>'
        + unit["learn_html"] + VISUALS.render_lesson_figure(n)
        + '<h3>Try the reasoning</h3>' + unit["try_html"]
        + (unit.get("try_worked_html", ""))
        + '<h3>Build the same project</h3>' + unit["build_html"]
        + f'<h3>Finish: explain the decision</h3><p>{escape(q["question"])}</p>'
        + f'<p><strong>Worked reasoning:</strong> {escape(q["explanation"])}</p>'
        + '<h3>Optional further reading</h3><p>The core text above is sufficient for the assigned work. '
        'These references are optional background, not required external destinations.</p>'
        + ''.join(f'<p>{escape(r["title"])}. {escape(r["purpose"])}<br>'
                  f'<span>{escape(r["url"])}</span></p>' for r in unit["readings"])
        + '</details>'
    )
    templates_href = templates_href or '$WIKI_REFERENCE$/pages/' + identifier("templates")
    guide_href = guide_href or '$WIKI_REFERENCE$/pages/' + identifier("course_guide")
    resources = ('<p><a href="' + escape(templates_href, quote=True) + '">'
                 'Open the Canvas case packet and editable project templates</a> · '
                 '<a href="' + escape(guide_href, quote=True) + '">Course guide and help</a></p>')
    return wrap_content(body + assistant + native_reading_references(reading) + resources,
                        eyebrow=f"Unit {n:02d} of 12", compact=True)


def lesson_page_html(unit, page_id):
    n = unit["number"]
    title = f'Unit {n:02d} lesson: {unit["title"]}'
    body = lesson_body_html(unit)
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>{escape(title)}</title><meta name="identifier" content="{page_id}">'
            '<meta name="editing_roles" content="teachers">'
            '<meta name="workflow_state" content="active"></head>'
            f'<body>{body}</body></html>').encode()


def wiki_html(title, page_id, body):
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>{escape(title)}</title><meta name="identifier" content="{page_id}">'
            '<meta name="editing_roles" content="teachers">'
            '<meta name="workflow_state" content="active"></head>'
            f'<body>{body}</body></html>').encode()


def add_page(files, resources, page_id, filename, title, body):
    path = f"wiki_content/{filename}.html"
    files[path] = wiki_html(title, page_id, body)
    res = child(resources, "resource", identifier=page_id, type="webcontent", href=path)
    child(res, "file", href=path)


def add_page_item(org_module, items, requirements, page_id, item_id, title, position, required=False):
    org_item = child(org_module, "item", identifier=item_id, identifierref=page_id)
    child(org_item, "title", title)
    item = child(items, "item", identifier=item_id)
    for key, value in [("content_type", "WikiPage"), ("workflow_state", "active"),
                       ("title", title), ("identifierref", page_id),
                       ("position", position), ("indent", 0)]:
        child(item, key, value)
    if required:
        requirement = child(requirements, "completionRequirement", type="must_view")
        child(requirement, "identifierref", item_id)


def qti_metadata(parent, values):
    metadata = child(parent, "qtimetadata")
    for label, value in values.items():
        field = child(metadata, "qtimetadatafield")
        child(field, "fieldlabel", label)
        child(field, "fieldentry", value)


def qti_material(parent, text):
    material = child(parent, "material")
    child(material, "mattext", text, texttype="text/html")


def qti_feedback(parent, feedback_id, text):
    feedback = child(parent, "itemfeedback", ident=feedback_id)
    qti_material(child(feedback, "flow_mat"), text)


def qti_question(parent, question, for_cc):
    """Canvas exporter-compatible choice/essay questions with explanatory feedback."""
    qid = question["id"]
    essay = question.get("kind") == "essay"
    item = child(parent, "item", ident=qid, title=question["title"])
    metadata = {"cc_profile": "cc.essay.v0p1" if essay else "cc.multiple_choice.v0p1"} if for_cc else {
        "question_type": "essay_question" if essay else "multiple_choice_question",
        "points_possible": 0 if essay else 1,
        "assessment_question_identifierref": f"{qid}_assessment",
        "original_answer_ids": "" if essay else ",".join(str(c["id"]) for c in question["choices"]),
    }
    if for_cc and essay:
        metadata["qmd_computerscored"] = "No"
    qti_metadata(child(item, "itemmetadata"), metadata)
    presentation = child(item, "presentation")
    qti_material(presentation, question["prompt_html"])
    if essay:
        response = child(presentation, "response_str", ident="response1", rcardinality="Single")
        child(child(response, "render_fib"), "response_label", ident="answer1", rshuffle="No")
    else:
        response = child(presentation, "response_lid", ident="response1", rcardinality="Single")
        choices = child(response, "render_choice")
        for choice in question["choices"]:
            qti_material(child(choices, "response_label", ident=str(choice["id"])), escape(choice["text"]))
    processing = child(item, "resprocessing")
    outcomes = child(processing, "outcomes")
    child(outcomes, "decvar", maxvalue="100", minvalue="0", varname="SCORE", vartype="Decimal")
    if essay:
        child(child(child(processing, "respcondition", **{"continue": "No"}), "conditionvar"), "other")
        return
    for choice in question["choices"]:
        condition = child(processing, "respcondition", **{"continue": "Yes"})
        child(child(condition, "conditionvar"), "varequal", choice["id"], respident="response1")
        child(condition, "displayfeedback", feedbacktype="Response", linkrefid=f'{choice["id"]}_fb')
    correct = question["choices"][question["answer"]]
    condition = child(processing, "respcondition", **{"continue": "No"})
    child(child(condition, "conditionvar"), "varequal", correct["id"], respident="response1")
    child(condition, "setvar", 100, action="Set", varname="SCORE")
    child(condition, "displayfeedback", feedbacktype="Response", linkrefid="correct_fb")
    condition = child(processing, "respcondition", **{"continue": "Yes"})
    child(child(condition, "conditionvar"), "other")
    child(condition, "setvar", 0, action="Set", varname="SCORE")
    child(condition, "displayfeedback", feedbacktype="Response", linkrefid="general_incorrect_fb")
    qti_feedback(item, "correct_fb", question["explanation"])
    qti_feedback(item, "general_incorrect_fb", question["explanation"])
    for choice in question["choices"]:
        qti_feedback(item, f'{choice["id"]}_fb', choice["feedback"])


def qti_assessment(quiz_id, title, questions, for_cc):
    document = root("questestinterop", QTI)
    assessment = child(document, "assessment", ident=quiz_id, title=title)
    qti_metadata(assessment, {"cc_profile": "cc.exam.v0p1", "qmd_assessmenttype": "Examination",
                              "qmd_scoretype": "Percentage", "cc_maxattempts": "unlimited"})
    section = child(assessment, "section", ident="root_section")
    for question in questions:
        qti_question(section, question, for_cc)
    return xml(document)


def add_practice_quiz(files, resources, org_module, items, requirements, unit, group_id, quiz, description):
    n = unit["number"]
    quiz_id, assignment_id = identifier("practice_quiz", n), identifier("practice_assignment", n)
    item_id = identifier("checkin_item", n)  # Retarget the current module item; preserve its history.
    title = f'Unit {n:02d} practice and check-in: {unit["title"]}'
    questions = quiz["questions"] + [{"id": identifier("project_response", n), "kind": "essay",
                                     "title": "Your project evidence and next decision",
                                     "prompt_html": quiz["evidence_prompt_html"]}]
    org_item = child(org_module, "item", identifier=item_id, identifierref=quiz_id)
    child(org_item, "title", title)
    item = child(items, "item", identifier=item_id)
    for key, value in [("content_type", "Quizzes::Quiz"), ("workflow_state", "active"),
                       ("title", title), ("identifierref", quiz_id), ("position", 2), ("indent", 0)]:
        child(item, key, value)
    requirement = child(requirements, "completionRequirement", type="must_submit")
    child(requirement, "identifierref", item_id)
    qti_path, native_path = f"{quiz_id}/assessment_qti.xml", f"non_cc_assessments/{quiz_id}.xml.qti"
    meta_path, meta_id = f"{quiz_id}/assessment_meta.xml", identifier("practice_meta", n)
    files[qti_path] = qti_assessment(quiz_id, title, questions, True)
    files[native_path] = qti_assessment(quiz_id, title, questions, False)
    metadata = root("quiz", CANVAS, identifier=quiz_id)
    for key, value in [("title", title), ("description", description), ("quiz_type", "assignment"),
                       ("points_possible", 3), ("shuffle_answers", True), ("scoring_policy", "keep_highest"),
                       ("hide_results", ""), ("show_correct_answers", True), ("allowed_attempts", -1),
                       ("one_question_at_a_time", False), ("cant_go_back", False), ("available", True),
                       ("one_time_results", False), ("show_correct_answers_last_attempt", False),
                       ("assignment_group_identifierref", group_id)]:
        child(metadata, key, value)
    assignment = child(metadata, "assignment", identifier=assignment_id)
    for key, value in [("title", title), ("assignment_group_identifierref", group_id),
                       ("workflow_state", "published"), ("quiz_identifierref", quiz_id),
                       ("has_group_category", False), ("points_possible", 3), ("grading_type", "points"),
                       ("all_day", False), ("submission_types", "online_quiz"), ("position", n),
                       ("peer_reviews", False), ("omit_from_final_grade", True), ("post_to_sis", False)]:
        child(assignment, key, value)
    files[meta_path] = xml(metadata)
    res = child(resources, "resource", identifier=quiz_id, type="imsqti_xmlv1p2/imscc_xmlv1p1/assessment")
    child(res, "file", href=qti_path)
    child(res, "dependency", identifierref=meta_id)
    res = child(resources, "resource", identifier=meta_id, type=APP_TYPE, href=meta_path)
    child(res, "file", href=meta_path)
    child(res, "file", href=native_path)
    return {"unit": n, "title": title, "quiz_identifier": quiz_id,
            "assignment_identifier": assignment_id, "replaces_assignment_identifier": identifier("checkin", n),
            "points": 3, "choice_questions": 3, "essay_questions": 1,
            "omit_from_final_grade": True, "completion_requirement": "must_submit"}


def add_discussion(files, resources, org_module, items, discussion=None):
    """Add one ungraded optional forum, with no announcement or forced-post rule."""
    n = discussion["unit"] if discussion else ""
    topic_id = identifier("exchange", n) if discussion else identifier("course_questions")
    meta_id = identifier("exchange_meta", n) if discussion else identifier("course_questions_meta")
    item_id = identifier("exchange_item", n) if discussion else identifier("course_questions_item")
    title = discussion["title"] if discussion else "Course questions and project exchange"
    prompt = (
        "<p>Use this shared space for course questions, project methods, and constructive "
        "peer feedback. State the unit, the decision you are considering, and the evidence "
        "you have checked so another learner can follow your reasoning.</p>"
        "<p>When offering feedback, give one specific observation, one useful question, "
        "and one suggested next test. Separate observed results from assumptions. "
        "Share only fictional or approved information; remove private customer, partner, "
        "and personal information from examples and attachments.</p>"
        "<p>This discussion is optional and ungraded. For private assessment questions, "
        "feedback, or individual circumstances, contact the instructor through Canvas Inbox. "
        "Submit check-ins and assessed work in their Canvas assignments. The course AI TA inside each "
        "lesson can explain course material; it cannot read Canvas submissions "
        "or grades and does not make assessment decisions.</p>"
    )
    prompt = wrap_content(discussion["prompt_html"] if discussion else prompt,
                          eyebrow="Project exchange" if discussion else "Course help", title=title)
    topic = root("topic", DT)
    child(topic, "title", title)
    child(topic, "text", prompt, texttype="text/html")
    topic_path, meta_path = f"discussions/{topic_id}.xml", f"discussions/{meta_id}.xml"
    files[topic_path] = xml(topic)
    meta = root("topicMeta", CANVAS, identifier=meta_id)
    for key, value in [("topic_id", topic_id), ("title", title), ("position", 1),
                       ("type", "topic"), ("discussion_type", "threaded"),
                       ("has_group_category", False), ("workflow_state", "active"),
                       ("require_initial_post", False), ("locked", False),
                       ("allow_rating", False)]:
        child(meta, key, value)
    files[meta_path] = xml(meta)
    res = child(resources, "resource", identifier=topic_id, type="imsdt_xmlv1p1")
    child(res, "file", href=topic_path)
    child(res, "dependency", identifierref=meta_id)
    res = child(resources, "resource", identifier=meta_id, type=APP_TYPE, href=meta_path)
    child(res, "file", href=meta_path)
    org_item = child(org_module, "item", identifier=item_id, identifierref=topic_id)
    child(org_item, "title", title)
    item = child(items, "item", identifier=item_id)
    for key, value in [("content_type", "DiscussionTopic"), ("workflow_state", "active"),
                       ("title", title), ("identifierref", topic_id),
                       ("position", 2), ("indent", 0)]:
        child(item, key, value)
    return {"title": title, "unit": n or 1, "identifier": topic_id,
            "graded": False, "required_for_completion": False}


def add_rubric(rubrics, rubric_id, title, criteria, points):
    rubric = child(rubrics, "rubric", identifier=rubric_id)
    for key, value in [("title", f"Building AI Solutions — {title}"), ("read_only", False),
                       ("reusable", True), ("public", False), ("points_possible", points),
                       ("hide_score_total", False), ("free_form_criterion_comments", True)]:
        child(rubric, key, value)
    nodes = child(rubric, "criteria")
    for index, criterion in enumerate(criteria, 1):
        c = child(nodes, "criterion")
        previous = re.fullmatch(re.escape(identifier("rubric")) + r"_(\d+)", rubric_id)
        criterion_id = identifier(f"criterion_{previous[1]}", index) if previous else f"{rubric_id}_criterion_{index}"
        child(c, "criterion_id", criterion_id)
        child(c, "points", criterion["weight"])
        child(c, "description", criterion["criterion"])
        child(c, "long_description", f'Meets the goal: {criterion["meets"]}\nStronger evidence: {criterion["strong"]}')
        ratings = child(c, "ratings")
        for suffix, score, label in [("max", criterion["weight"], "Maximum available points"), ("zero", 0, "Zero points")]:
            rating = child(ratings, "rating")
            for key, value in [("id", f"{criterion_id}_{suffix}"), ("criterion_id", criterion_id),
                               ("description", label), ("points", score)]:
                child(rating, key, value)


def add_final_exam(files, resources, rubrics, org_module, items, requirements, exam):
    assignment_id, rubric_id, item_id = identifier("individual_exam"), identifier("individual_exam_rubric"), identifier("individual_exam_item")
    title, points = exam["title"], exam["max"]
    body = (exam["brief_html"] + '<h3>Before you submit</h3><ul>'
            + ''.join(f'<li>{escape(item)}</li>' for item in exam["checklist"]) + '</ul>'
            + '<h3>Individual assessment criteria</h3>' + render_criteria(exam["rubric"])
            + '<p>This individual response is 40 points within the same Milestone 5 group as '
            'the 60-point demonstration and handoff. Together they contribute 25% of the course. '
            'The instructor grades the two criteria; the exam is not automatically scored. '
            'Use Canvas submission history, comments, and rubric feedback for any revision.</p>')
    body = wrap_content(body, eyebrow="Milestone 5 · individual understanding", title=title)
    html_path = f"{assignment_id}/individual-case-exam.html"
    files[html_path] = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
                        f'<title>Assignment: {escape(title)}</title></head><body>{body}</body></html>').encode()
    settings = root("assignment", CANVAS, identifier=assignment_id)
    for key, value in [("title", title), ("assignment_group_identifierref", identifier("milestone_group", 5)),
                       ("workflow_state", "published"), ("has_group_category", False),
                       ("points_possible", points), ("grading_type", "points"), ("all_day", False),
                       ("submission_types", "online_upload,online_text_entry,online_url"), ("position", 6),
                       ("peer_reviews", False), ("omit_from_final_grade", False), ("post_to_sis", False),
                       ("allowed_attempts", -1), ("rubric_identifierref", rubric_id),
                       ("rubric_use_for_grading", True), ("rubric_hide_points", False), ("rubric_hide_score_total", False)]:
        child(settings, key, value)
    meta_path = f"{assignment_id}/assignment_settings.xml"
    files[meta_path] = xml(settings)
    res = child(resources, "resource", identifier=assignment_id, type=APP_TYPE, href=html_path)
    child(res, "file", href=html_path)
    child(res, "file", href=meta_path)
    add_rubric(rubrics, rubric_id, title, exam["rubric"], points)
    org_item = child(org_module, "item", identifier=item_id, identifierref=assignment_id)
    child(org_item, "title", title)
    item = child(items, "item", identifier=item_id)
    for key, value in [("content_type", "Assignment"), ("workflow_state", "active"),
                       ("title", title), ("identifierref", assignment_id), ("position", 5), ("indent", 0)]:
        child(item, key, value)
    requirement = child(requirements, "completionRequirement", type="must_submit")
    child(requirement, "identifierref", item_id)
    return {"title": title, "assignment_identifier": assignment_id, "points": points,
            "assignment_group_identifier": identifier("milestone_group", 5),
            "course_weight_percent": 10, "completion_requirement": "must_submit"}


def build():
    import async_content as async_source
    import async_guide as guide_source
    global VISUALS
    VISUALS = load_visuals()
    units, milestones = load_content()
    milestones = [{**m, "rubric": list(m["rubric"])} for m in milestones]
    milestones[-1]["_points"] = 60
    milestones[-1]["rubric"] = [c for c in milestones[-1]["rubric"] if not c["criterion"].startswith("Individual")]
    milestones[-1]["brief_html"] = (
        '<p>This is the 60-point demonstration and handoff portion of Milestone 5. '
        'Submit the individual 40-point case exam separately in this module. Both '
        'items are in the same 25% group; do not submit or score the individual work twice.</p>'
        + re.match(r"<p>[\s\S]*?</p>", milestones[-1]["brief_html"])[0]
    )
    by_unit = {m["unit"]: m for m in milestones}
    files = {}
    manifest = root("manifest", CC, identifier=identifier("cartridge"))
    manifest.set("xmlns:lomimscc", LOM)
    metadata = child(manifest, "metadata")
    child(metadata, "schema", "IMS Common Cartridge")
    child(metadata, "schemaversion", "1.1.0")
    lom = child(metadata, "lomimscc:lom")
    general = child(lom, "lomimscc:general")
    title = child(general, "lomimscc:title")
    child(title, "lomimscc:string", "Building AI Solutions — Canvas integration")
    orgs = child(manifest, "organizations")
    org = child(orgs, "organization", identifier="org_1", structure="rooted-hierarchy")
    learning = child(org, "item", identifier="LearningModules")
    resources = child(manifest, "resources")
    module_meta = root("modules", CANVAS)
    rubrics = root("rubrics", CANVAS)
    groups = root("assignmentGroups", CANVAS)
    # Retain the originally imported group's identity for formative check-ins;
    # each assessed milestone now has its user-authorized weighted group.
    checkin_group_id = identifier("milestone_group")
    group = child(groups, "assignmentGroup", identifier=checkin_group_id)
    child(group, "title", "Building AI Solutions — Formative practice")
    child(group, "position", 1)
    child(group, "group_weight", 0)
    for milestone in milestones:
        group = child(groups, "assignmentGroup", identifier=identifier("milestone_group", milestone["number"]))
        child(group, "title", f'Milestone {milestone["number"]} — {milestone["title"]}')
        child(group, "position", milestone["number"] + 1)
        child(group, "group_weight", milestone["weight"])
    mapping = {"course": "Building AI Solutions", "owner": "Majid Memari",
               "base_url": BASE, "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
               "grade_policy": "Milestones 1–4:100 points; Milestone5:60-point shared plus40-point individual exam. Group weights15/20/25/15/25. Formative quizzes3points omitted in0%group; no due dates",
               "progress_policy": "View guide/12lesson pages/completion; submit12practice quizzes,5milestone snapshots,individual exam. No hard prerequisites or sequential gates.",
               "lesson_delivery": "native_canvas_pages_with_course_iframes",
               "theme_version": THEME_VERSION,
               "source_fingerprints": {str(p.relative_to(COURSE)): hashlib.sha256(p.read_bytes()).hexdigest()
                                       for p in [SOURCE, COURSE / "site" / "visual_lessons.py",
                                                 COURSE / "site" / "assets" / "core.css",
                                                 SOURCE_DIR / "async_content.py", SOURCE_DIR / "async_guide.py",
                                                 SOURCE_DIR / "theme.py"] if p.exists()},
               "units": [], "practice_quizzes": [], "milestones": [], "discussions": [],
               "retired_checkins": [identifier("checkin", n) for n in range(1, 13)]}
    mapping["support_pages"] = []
    for kind, filename, title, body in [
        ("course_guide", "course-guide", "Course guide: start, submit, and get help", guide_source.GUIDE_HTML),
        ("templates", "case-and-project-templates", "Cedar Desk case and project templates", guide_source.TEMPLATES_HTML),
        ("completion", "course-completion", "Course completion and next steps", guide_source.COMPLETION_HTML),
    ]:
        page_id = identifier(kind)
        rendered = body if f'data-course-theme="{THEME_VERSION}"' in body else wrap_content(body, eyebrow="Building AI Solutions", title=title)
        add_page(files, resources, page_id, filename, title, rendered)
        mapping["support_pages"].append({"kind": kind, "identifier": page_id, "title": title})
    file_metadata = root("fileMeta", CANVAS)
    metadata_files = child(file_metadata, "files")
    for filename, text in guide_source.TEMPLATE_DOWNLOADS.items():
        assert Path(filename).name == filename and filename.endswith(".txt") and re.fullmatch(r"[a-zA-Z0-9_.-]+", filename)
        # Canvas's own converter imports only webcontent resources rooted in
        # web_resources/. It strips that prefix to obtain the course-file path.
        # The page token therefore remains $IMS-CC-FILEBASE$/templates/name.txt.
        path = f"web_resources/templates/{filename}"
        files[path] = text.encode("utf-8-sig")
        file_id = identifier("template", filename.removesuffix(".txt"))
        res = child(resources, "resource", identifier=file_id,
                    type="webcontent", href=path)
        child(res, "file", href=path)
        metadata_file = child(metadata_files, "file", identifier=file_id)
        child(metadata_file, "display_name", filename)
        child(metadata_file, "hidden", False)
        child(metadata_file, "locked", False)
    files["course_settings/files_meta.xml"] = xml(file_metadata)

    for unit in units:
        n = unit["number"]
        module_id, page_id = identifier("module", n), identifier("lesson_page", n)
        item_id = identifier("lesson_item", n)
        module_title = f'Unit {n:02d}: {unit["title"]}'
        url = f"{BASE}unit-{n:02d}.html?delivery=canvas"
        org_module = child(learning, "item", identifier=module_id)
        child(org_module, "title", module_title)
        page_title = f'Unit {n:02d} lesson: {unit["title"]}'
        mod = child(module_meta, "module", identifier=module_id)
        child(mod, "title", module_title)
        child(mod, "workflow_state", "active")
        child(mod, "position", n)
        child(mod, "require_sequential_progress", False)
        items = child(mod, "items")
        requirements = child(mod, "completionRequirements")
        if n == 1:
            add_page_item(org_module, items, requirements, identifier("course_guide"), identifier("course_guide_item"),
                          "Start here: course guide", 1, required=True)
            add_page_item(org_module, items, requirements, identifier("templates"), identifier("templates_item"),
                          "Cedar Desk case and editable templates (reference)", 2, required=False)
        org_page = child(org_module, "item", identifier=item_id, identifierref=page_id)
        child(org_page, "title", page_title)
        item = child(items, "item", identifier=item_id)
        for key, value in [("content_type", "WikiPage"), ("workflow_state", "active"),
                           ("title", page_title), ("identifierref", page_id),
                           ("position", 1), ("indent", 0)]:
            child(item, key, value)
        path = f"wiki_content/unit-{n:02d}-lesson.html"
        files[path] = lesson_page_html(unit, page_id)
        res = child(resources, "resource", identifier=page_id, type="webcontent", href=path)
        child(res, "file", href=path)
        mapping["units"].append({"number": n, "title": unit["title"], "url": url,
                                 "module_identifier": module_id, "page_identifier": page_id,
                                 "lesson_item_identifier": item_id,
                                 "lesson_completion_requirement": "must_view"})

        requirement = child(requirements, "completionRequirement", type="must_view")
        child(requirement, "identifierref", item_id)
        for exchange in async_source.DISCUSSIONS:
            if exchange["unit"] == n:
                mapping["discussions"].append(add_discussion(files, resources, org_module, items, exchange))
        quiz = normalize_practice(unit, async_source)
        description = wrap_content(
            '<p>Answer three short choice questions and add a concise project response in the final field. '
            'Choice questions give immediate explanatory feedback. You may retry and revisit the lesson. '
            'The three raw practice points contribute 0% to the course grade.</p>'
            '<p>The project response is zero points and is reviewed by the instructor. It is not '
            'automatically checked; comments or a pending review state may remain after the choice '
            'questions are scored. Module progress requires a submitted attempt, not a score or '
            'a completed essay review. Keep one continuing project record.</p>'
            '<p>After submitting, review the explanatory feedback and use Canvas Next. If the results '
            'screen does not show Next, choose Modules in the course navigation and open the next item. '
            'You can continue within Canvas while instructor feedback is pending.</p>',
            eyebrow=f"Unit {n:02d} · formative practice", title="Practice and project check-in")
        mapping["practice_quizzes"].append(add_practice_quiz(files, resources, org_module, items,
                                                           requirements, unit, checkin_group_id, quiz, description))
        if n == 1:
            mapping["discussion"] = add_discussion(files, resources, org_module, items)

        if n not in by_unit:
            continue
        m = by_unit[n]
        num = m["number"]
        assignment_id, rubric_id = identifier("milestone", num), identifier("rubric", num)
        assn_item_id = identifier("milestone_item", num)
        name = f'Milestone {num}: {m["title"]}'
        org_assn = child(org_module, "item", identifier=assn_item_id, identifierref=assignment_id)
        child(org_assn, "title", name)
        assn_item = child(items, "item", identifier=assn_item_id)
        for key, value in [("content_type", "Assignment"), ("workflow_state", "active"),
                           ("title", name), ("identifierref", assignment_id),
                           ("position", 3), ("indent", 0)]:
            child(assn_item, key, value)
        requirement = child(requirements, "completionRequirement", type="must_submit")
        child(requirement, "identifierref", assn_item_id)
        settings = root("assignment", CANVAS, identifier=assignment_id)
        for key, value in [("title", name), ("assignment_group_identifierref", identifier("milestone_group", num)),
                           ("workflow_state", "published"), ("has_group_category", False),
                           ("points_possible", m.get("_points", 100)), ("grading_type", "points"),
                           ("all_day", False), ("submission_types", "online_upload,online_text_entry,online_url"),
                           ("position", num), ("peer_reviews", False),
                           ("automatic_peer_reviews", False), ("omit_from_final_grade", False),
                           ("post_to_sis", False), ("allowed_attempts", -1),
                           ("rubric_identifierref", rubric_id), ("rubric_use_for_grading", True),
                           ("rubric_hide_points", False), ("rubric_hide_score_total", False)]:
            child(settings, key, value)
        html_path = f"{assignment_id}/milestone-{num}.html"
        settings_path = f"{assignment_id}/assignment_settings.xml"
        files[html_path], files[settings_path] = assignment_html(m), xml(settings)
        res = child(resources, "resource", identifier=assignment_id, type=APP_TYPE, href=html_path)
        child(res, "file", href=html_path)
        child(res, "file", href=settings_path)
        add_rubric(rubrics, rubric_id, name, m["rubric"], m.get("_points", 100))
        mapping["milestones"].append({"number": num, "title": m["title"], "after_unit": n,
                                      "assignment_identifier": assignment_id,
                                      "source_url": f'{BASE}project.html#milestone-{num}',
                                      "points": m.get("_points", 100), "omit_from_final_grade": False,
                                      "completion_requirement": "must_submit",
                                      "course_weight_percent": m["weight"],
                                      "effective_course_weight_percent": m["weight"] * m.get("_points", 100) / 100,
                                      "assignment_group_identifier": identifier("milestone_group", num)})

        if n == 12:
            mapping["individual_exam"] = add_final_exam(files, resources, rubrics, org_module, items,
                                                        requirements, async_source.FINAL_EXAM)
            add_page_item(org_module, items, requirements, identifier("completion"), identifier("completion_item"),
                          "Finish: course completion and next steps", 6, required=True)

    # Import order is authoritative; keep position metadata consistent with it.
    for mod in list(module_meta):
        for index, item in enumerate(mod.find("items"), 1):
            item.find("position").text = str(index)

    files["course_settings/module_meta.xml"] = xml(module_meta)
    files["course_settings/assignment_groups.xml"] = xml(groups)
    files["course_settings/rubrics.xml"] = xml(rubrics)
    files["course_settings/canvas_export.txt"] = b"Building AI Solutions by Majid Memari. Additive Canvas integration.\n"
    res = child(resources, "resource", identifier=identifier("canvas_metadata"),
                type=APP_TYPE, href="course_settings/canvas_export.txt")
    for path in sorted(files):
        if path.startswith("course_settings/"):
            child(res, "file", href=path)
    files["imsmanifest.xml"] = xml(manifest)
    with ZipFile(PACKAGE, "w", compression=ZIP_DEFLATED) as archive:
        for path, data in sorted(files.items()):
            info = ZipInfo(path, date_time=(2026, 11, 11, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, data)
    mapping["package_sha256"] = hashlib.sha256(PACKAGE.read_bytes()).hexdigest()
    (HERE / "mapping.json").write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n")
    validate(PACKAGE)
    print(f"Built {PACKAGE}: {len(files)} files, 12 modules, 15 pages, 12 practice quizzes, 5 milestone snapshots, individual exam, 6 rubrics, 4 discussions")


def validate(path):
    """Validate actual package references, assessment boundaries, and QTI feedback."""
    with ZipFile(path) as archive:
        names = set(archive.namelist())
        assert archive.testzip() is None
        assert all(not n.startswith("/") and ".." not in Path(n).parts for n in names)
        assert "course_settings/course_settings.xml" not in names
        assert "course_settings/syllabus.html" not in names
        docs = {n: ET.fromstring(archive.read(n)) for n in names if n.endswith((".xml", ".xml.qti"))}
        manifest = docs["imsmanifest.xml"]
        resources = manifest.findall(f"{{{CC}}}resources/{{{CC}}}resource")
        ids = {r.get("identifier") for r in resources}
        assert len(ids) == len(resources) == 60
        assert all(r.get("type") != "imswl_xmlv1p1" for r in resources)
        # Mirror the receiving Canvas converter's file-discovery contract, not
        # merely generic manifest validity: only web_resources/ is imported.
        canvas_files = {r.get("href").removeprefix("web_resources/"): r.get("identifier")
                        for r in resources if r.get("type") == "webcontent"
                        and (r.get("href") or "").startswith("web_resources/")}
        assert len(canvas_files) == 6
        assert all(path.startswith("templates/") and path.endswith(".txt") for path in canvas_files)
        assert all(archive.read(f"web_resources/{path}").startswith(b"\xef\xbb\xbf") for path in canvas_files)
        metadata_files = docs["course_settings/files_meta.xml"].findall(f"{{{CANVAS}}}files/{{{CANVAS}}}file")
        assert {f.get("identifier") for f in metadata_files} == set(canvas_files.values())
        assert all(f.findtext(f"{{{CANVAS}}}hidden") == "false" and f.findtext(f"{{{CANVAS}}}locked") == "false"
                   for f in metadata_files)
        for res in resources:
            for f in res.findall(f"{{{CC}}}file"):
                assert f.get("href") in names
            for dependency in res.findall(f"{{{CC}}}dependency"):
                assert dependency.get("identifierref") in ids
        for item in manifest.findall(f".//{{{CC}}}item[@identifierref]"):
            assert item.get("identifierref") in ids
        modules = docs["course_settings/module_meta.xml"].findall(f"{{{CANVAS}}}module")
        assert len(modules) == 12
        seen_pages, seen_quizzes, seen_assignments, seen_discussions = [], [], [], []
        requirement_count = 0
        for n, mod in enumerate(modules, 1):
            assert mod.get("identifier") == identifier("module", n)
            assert mod.findtext(f"{{{CANVAS}}}require_sequential_progress") == "false"
            assert mod.find(f"{{{CANVAS}}}prerequisites") is None
            item_ids, expected_requirements = set(), {}
            for index, item in enumerate(mod.findall(f"{{{CANVAS}}}items/{{{CANVAS}}}item"), 1):
                iid = item.get("identifier")
                assert iid not in item_ids
                item_ids.add(iid)
                assert int(item.findtext(f"{{{CANVAS}}}position")) == index
                content = item.findtext(f"{{{CANVAS}}}content_type")
                ref = item.findtext(f"{{{CANVAS}}}identifierref")
                assert ref in ids
                if content == "WikiPage":
                    seen_pages.append(ref)
                    if ref != identifier("templates"):
                        expected_requirements[iid] = "must_view"
                    if ref == identifier("lesson_page", n):
                        assert iid == identifier("lesson_item", n)
                elif content == "Quizzes::Quiz":
                    seen_quizzes.append(ref)
                    assert ref == identifier("practice_quiz", n)
                    assert iid == identifier("checkin_item", n)
                    expected_requirements[iid] = "must_submit"
                elif content == "Assignment":
                    seen_assignments.append(ref)
                    expected_requirements[iid] = "must_submit"
                else:
                    assert content == "DiscussionTopic"
                    seen_discussions.append(ref)
            requirements = mod.findall(f"{{{CANVAS}}}completionRequirements/{{{CANVAS}}}completionRequirement")
            actual = {r.findtext(f"{{{CANVAS}}}identifierref"): r.get("type") for r in requirements}
            assert len(requirements) == len(actual)
            assert actual == expected_requirements
            assert set(actual) <= item_ids
            requirement_count += len(requirements)
        assert requirement_count == 32
        assert len(seen_pages) == 15
        assert set(seen_pages) == {identifier("course_guide"), identifier("templates"), identifier("completion"),
                                  *(identifier("lesson_page", n) for n in range(1, 13))}
        first_items = modules[0].findall(f"{{{CANVAS}}}items/{{{CANVAS}}}item")
        assert [item.findtext(f"{{{CANVAS}}}identifierref") for item in first_items[:3]] == [
            identifier("course_guide"), identifier("templates"), identifier("lesson_page", 1)]
        assert seen_quizzes == [identifier("practice_quiz", n) for n in range(1, 13)]
        assert seen_assignments == [*(identifier("milestone", n) for n in range(1, 6)), identifier("individual_exam")]
        assert set(seen_discussions) == {identifier("course_questions"), *(identifier("exchange", n) for n in (3, 7, 12))}
        all_assignment_nodes = {}
        for assignment in seen_assignments:
            doc = docs[f"{assignment}/assignment_settings.xml"]
            all_assignment_nodes[assignment] = doc
            get = lambda tag: doc.findtext(f"{{{CANVAS}}}{tag}")
            assert get("omit_from_final_grade") == "false"
            expected_points = 40 if assignment == identifier("individual_exam") else 60 if assignment == identifier("milestone", 5) else 100
            assert float(get("points_possible")) == expected_points
            assert get("grading_type") == "points"
            assert get("submission_types") == "online_upload,online_text_entry,online_url"
            assert get("allowed_attempts") == "-1"
            assert all(doc.find(f"{{{CANVAS}}}{tag}") is None for tag in ["due_at", "unlock_at", "lock_at"])
        for n in range(1, 13):
            quiz_id = identifier("practice_quiz", n)
            meta = docs[f"{quiz_id}/assessment_meta.xml"]
            get = lambda tag: meta.findtext(f"{{{CANVAS}}}{tag}")
            assert get("quiz_type") == "assignment" and get("available") == "true"
            assert float(get("points_possible")) == 3
            assert get("allowed_attempts") == "-1" and get("show_correct_answers") == "true"
            assert get("hide_results") in (None, "")
            assignment = meta.find(f"{{{CANVAS}}}assignment")
            aid = assignment.get("identifier")
            all_assignment_nodes[aid] = assignment
            assert aid == identifier("practice_assignment", n)
            assert assignment.findtext(f"{{{CANVAS}}}omit_from_final_grade") == "true"
            assert assignment.findtext(f"{{{CANVAS}}}assignment_group_identifierref") == identifier("milestone_group")
            assert assignment.findtext(f"{{{CANVAS}}}submission_types") == "online_quiz"
            assert assignment.findtext(f"{{{CANVAS}}}points_possible") == "3"
            native = docs[f"non_cc_assessments/{quiz_id}.xml.qti"]
            questions = native.findall(f"{{{QTI}}}assessment/{{{QTI}}}section/{{{QTI}}}item")
            assert len(questions) == 4
            types, points = [], []
            for question in questions:
                fields = {f.findtext(f"{{{QTI}}}fieldlabel"): f.findtext(f"{{{QTI}}}fieldentry")
                          for f in question.findall(f"{{{QTI}}}itemmetadata/{{{QTI}}}qtimetadata/{{{QTI}}}qtimetadatafield")}
                types.append(fields["question_type"])
                points.append(float(fields["points_possible"]))
                if fields["question_type"] == "multiple_choice_question":
                    labels = question.findall(f"{{{QTI}}}presentation/{{{QTI}}}response_lid/{{{QTI}}}render_choice/{{{QTI}}}response_label")
                    choice_ids = {label.get("ident") for label in labels}
                    assert len(choice_ids) == len(labels) >= 3
                    feedback = {f.get("ident") for f in question.findall(f"{{{QTI}}}itemfeedback")}
                    assert feedback == {"correct_fb", "general_incorrect_fb", *(f"{c}_fb" for c in choice_ids)}
                    refs = question.findall(f".//{{{QTI}}}displayfeedback")
                    assert all(r.get("linkrefid") in feedback for r in refs)
                    conditions = question.findall(f"{{{QTI}}}resprocessing/{{{QTI}}}respcondition")
                    scored = [c for c in conditions if c.find(f"{{{QTI}}}setvar") is not None]
                    assert len(scored) == 2
                    correct = next(c for c in scored if c.findtext(f"{{{QTI}}}setvar") == "100")
                    assert correct.findtext(f"{{{QTI}}}conditionvar/{{{QTI}}}varequal") in choice_ids
                    wrong = next(c for c in scored if c.findtext(f"{{{QTI}}}setvar") == "0")
                    assert wrong.find(f"{{{QTI}}}conditionvar/{{{QTI}}}other") is not None
            assert types == ["multiple_choice_question"] * 3 + ["essay_question"]
            assert points == [1, 1, 1, 0]
            standard = docs[f"{quiz_id}/assessment_qti.xml"]
            assert len(standard.findall(f"{{{QTI}}}assessment/{{{QTI}}}section/{{{QTI}}}item")) == 4
        groups = docs["course_settings/assignment_groups.xml"].findall(f"{{{CANVAS}}}assignmentGroup")
        weights = {g.get("identifier"): float(g.findtext(f"{{{CANVAS}}}group_weight")) for g in groups}
        assert weights == {identifier("milestone_group"): 0,
                           **{identifier("milestone_group", n): w for n, w in enumerate([15, 20, 25, 15, 25], 1)}}
        m5_assignments = [node for node in all_assignment_nodes.values()
                          if node.findtext(f"{{{CANVAS}}}assignment_group_identifierref") == identifier("milestone_group", 5)]
        assert sorted(float(node.findtext(f"{{{CANVAS}}}points_possible")) for node in m5_assignments) == [40, 60]
        assert sum(weights.values()) == 100
        rubric_docs = docs["course_settings/rubrics.xml"].findall(f"{{{CANVAS}}}rubric")
        assert len(rubric_docs) == 6
        rubric_totals = {}
        for rubric in rubric_docs:
            criteria = rubric.findall(f"{{{CANVAS}}}criteria/{{{CANVAS}}}criterion")
            points = [float(c.findtext(f"{{{CANVAS}}}points")) for c in criteria]
            rubric_totals[rubric.get("identifier")] = sum(points)
            assert rubric.findtext(f"{{{CANVAS}}}free_form_criterion_comments") == "true"
            assert sum(points) == float(rubric.findtext(f"{{{CANVAS}}}points_possible"))
            for criterion, point in zip(criteria, points):
                ratings = [float(p.text) for p in criterion.findall(f"{{{CANVAS}}}ratings/{{{CANVAS}}}rating/{{{CANVAS}}}points")]
                assert ratings == [point, 0]
        assert rubric_totals == {**{identifier("rubric", n): 100 for n in range(1, 5)},
                                 identifier("rubric", 5): 60, identifier("individual_exam_rubric"): 40}
        for aid in seen_assignments:
            node = all_assignment_nodes[aid]
            rubric_id = node.findtext(f"{{{CANVAS}}}rubric_identifierref")
            assert rubric_totals[rubric_id] == float(node.findtext(f"{{{CANVAS}}}points_possible"))
        class InspectHTML(HTMLParser):
            def __init__(self):
                super().__init__()
                self.frames, self.meta, self.anchors = [], {}, []
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == "iframe": self.frames.append(attrs)
                elif tag == "meta" and attrs.get("name"): self.meta[attrs["name"]] = attrs.get("content")
                elif tag == "a": self.anchors.append(attrs)
                assert tag not in {"script", "style", "form", "input", "button", "textarea", "select"}
        page_ids = {identifier("course_guide"), identifier("templates"), identifier("completion"),
                    *(identifier("lesson_page", n) for n in range(1, 13))}
        def inspect(fragment):
            parser = InspectHTML(); parser.feed(fragment)
            for anchor in parser.anchors:
                href = anchor.get("href", "")
                assert anchor.get("target") in (None, "", "_self")
                if href.startswith("$WIKI_REFERENCE$/pages/"):
                    assert href.split("/", 2)[2].split("#", 1)[0] in page_ids
                elif href.startswith("$IMS-CC-FILEBASE$/"):
                    portable = urlsplit(href.removeprefix("$IMS-CC-FILEBASE$/"))
                    logical_path = portable.path
                    assert logical_path in canvas_files
                    assert f"web_resources/{logical_path}" in names
                    assert parse_qs(portable.query) == {"canvas_download": ["1"], "canvas_qs_download_frd": ["1"]}
                    assert anchor.get("download") == Path(logical_path).name
                    assert {"instructure_file_link", "inline_disabled"} <= set(anchor.get("class", "").split())
                else:
                    assert href.startswith(("#", "/conversations")), href
            return parser
        for n in range(1, 13):
            text = archive.read(f"wiki_content/unit-{n:02d}-lesson.html").decode()
            parser = inspect(text)
            assert parser.meta["identifier"] == identifier("lesson_page", n)
            assert parser.meta["editing_roles"] == "teachers"
            assert parser.meta["workflow_state"] == "active"
            assert len(parser.frames) == 2
            frame = parser.frames[0]
            assert frame["src"] == f"{BASE}unit-{n:02d}.html?delivery=canvas"
            assert frame.get("title") and frame["width"] == "100%" and frame["height"] == "1000"
            assistant = parser.frames[1]
            assert assistant["src"] == f"{BASE}assistant?lesson=unit-{n:02d}.html&embed=1&delivery=canvas"
            assert assistant.get("title") and assistant["width"] == "100%" and assistant["height"] == "760"
            assert text.index('data-course-ta="inline"') < text.index('Read the complete text lesson')
            assert "Required core reading" in text and "before printing" in text
            assert f'data-course-theme="{THEME_VERSION}"' in text
        for name in names:
            if name.endswith(".html"): inspect(archive.read(name).decode())
        for name, document in docs.items():
            if name.endswith(".xml.qti"):
                for node in document.findall(f".//{{{QTI}}}mattext"): inspect(node.text or "")
        for name in names:
            if name.startswith("discussions/") and "meta" not in name:
                topic = docs[name]
                inspect(topic.findtext(f"{{{DT}}}text") or "")
        all_text = b"\n".join(archive.read(n) for n in names).decode()
        for forbidden in ["UVU", "Ruggles", "BEI", "EdTech", "instructure.com/courses/", "RESEND_API_KEY", "instructor-exam-guide"]:
            assert forbidden not in all_text, forbidden


if __name__ == "__main__":
    build()
