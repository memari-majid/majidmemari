#!/usr/bin/env python3
"""Build an additive Canvas cartridge from the maintained public curriculum.

Python standard library only. Canvas extension structures follow Instructure's
own exporter/importer; see README.md for source links and operational limits.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import xml.etree.ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
COURSE = HERE.parents[1]
SOURCE = COURSE / "site" / "course_content.py"
BASE = "https://www.majidmemari.com/teaching/ai-solutions/"
CC = "http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"
CANVAS = "http://canvas.instructure.com/xsd/cccv1p0"
DT = "http://www.imsglobal.org/xsd/imsccv1p1/imsdt_v1p1"
LOM = "http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest"
XSI = "http://www.w3.org/2001/XMLSchema-instance"
APP_TYPE = "associatedcontent/imscc_xmlv1p1/learning-application-resource"
PACKAGE = HERE / "building-ai-solutions-canvas.imscc"


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


def assignment_html(milestone):
    title = f'Milestone {milestone["number"]}: {milestone["title"]}'
    rows = "".join(
        "<tr>"
        f'<th scope="row">{escape(c["criterion"])}</th>'
        f'<td>{c["weight"]}</td><td>{escape(c["meets"])}</td>'
        f'<td>{escape(c["strong"])}</td></tr>'
        for c in milestone["rubric"]
    )
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
        '<h3>Assessment criteria</h3><p>The points below divide this 100-point '
        'milestone. Course-level weights and deadlines are set by the instructor.</p>'
        '<table><caption>Milestone criteria and evidence anchors</caption><thead><tr>'
        '<th scope="col">Criterion</th><th scope="col">Points</th>'
        '<th scope="col">Meets the goal</th><th scope="col">Stronger evidence</th>'
        f'</tr></thead><tbody>{rows}</tbody></table>'
        '<p>Use approved or fictional information. Label supplied facts, observations, '
        'role-play, assumptions, and AI assistance accurately. A defensible decision to '
        'revise, narrow, or stop can demonstrate sound business judgment.</p>'
    )
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Assignment: {escape(title)}</title></head><body>{body}</body></html>').encode()


def lesson_page_html(unit, page_id):
    n = unit["number"]
    title = f'Unit {n:02d} lesson: {unit["title"]}'
    frame_title = f'Unit {n:02d}: {unit["title"]} — interactive lesson and course AI TA'
    body = (
        '<p>Work through <strong>Learn → Try → Build → Finish</strong> in the lesson below. '
        'Use the course AI TA inside the lesson when you need help explaining a concept. '
        'Then use <strong>Canvas Next</strong> to continue through this module and submit '
        'your unit check-in. Keep improving the same project record.</p>'
        f'<iframe src="{BASE}unit-{n:02d}.html?delivery=canvas" '
        f'title="{escape(frame_title, quote=True)}" width="100%" height="1000" '
        'style="border: 0;"></iframe>'
        '<p>Your check-in, submission history, instructor feedback, and module progress '
        'are recorded in Canvas. Opening this page records a visit; it does not confirm '
        'that you completed the lesson or mastered its concepts.</p>'
    )
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>{escape(title)}</title><meta name="identifier" content="{page_id}">'
            '<meta name="editing_roles" content="teachers">'
            '<meta name="workflow_state" content="active"></head>'
            f'<body>{body}</body></html>').encode()


def checkin_html(unit):
    n = unit["number"]
    title = f'Unit {n:02d} check-in: {unit["title"]}'
    milestone_note = (
        '<p>A milestone follows this check-in. Keep this response brief and use the '
        'milestone assignment for the cumulative project snapshot. The individual '
        'explanations near Milestones 3 and 5 inform the final milestone’s individual '
        'component; this check-in does not add a second numerical grade.</p>'
        if unit.get("milestone") else ""
    )
    body = (
        f'<h2>{escape(title)}</h2>'
        '<p>Use the same continuing project record. Submit a short response below, '
        'or upload/link the relevant part of your record with a brief explanation. '
        'This is a formative checkpoint, not a new paper or a separate project.</p>'
        '<ol><li><strong>Project update.</strong> '
        f'{escape(unit["project_prompt"])} '
        'Identify what changed, the evidence or approved source you used, and any '
        'requirement still pending.</li>'
        f'<li><strong>Explain your reasoning.</strong> {escape(unit["finish_check"]["question"])} '
        'Answer in your own words. Show the calculation, units, and denominator '
        'where applicable; explain why your conclusion follows.</li>'
        '<li><strong>Next decision.</strong> State one limitation or uncertainty '
        'and the next action or test it calls for.</li></ol>'
        '<p>Submit your response in Canvas. Use only fictional or approved information '
        'and label observations, assumptions, role-play, and AI assistance honestly. '
        'If you use an activity export, attach it here as supporting evidence; an export '
        'alone is not a substitute for explaining the decision.</p>'
        + milestone_note +
        '<p>This check-in is zero points and does not count toward the final grade. '
        'Canvas records the received submission and supports instructor comments and '
        'Complete/Incomplete feedback. Module progress requires a submission, not a '
        'particular grade. A received submission does not establish correctness or mastery.</p>'
    )
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Assignment: {escape(title)}</title></head><body>{body}</body></html>').encode()


def add_checkin(files, resources, org_module, items, requirements, unit, group_id):
    n = unit["number"]
    assignment_id, item_id = identifier("checkin", n), identifier("checkin_item", n)
    title = f'Unit {n:02d} check-in: {unit["title"]}'
    org_item = child(org_module, "item", identifier=item_id, identifierref=assignment_id)
    child(org_item, "title", title)
    item = child(items, "item", identifier=item_id)
    for key, value in [("content_type", "Assignment"), ("workflow_state", "active"),
                       ("title", title), ("identifierref", assignment_id),
                       ("position", 3 if n == 1 else 2), ("indent", 0)]:
        child(item, key, value)
    requirement = child(requirements, "completionRequirement", type="must_submit")
    child(requirement, "identifierref", item_id)
    settings = root("assignment", CANVAS, identifier=assignment_id)
    for key, value in [("title", title), ("assignment_group_identifierref", group_id),
                       ("workflow_state", "published"), ("has_group_category", False),
                       ("points_possible", 0), ("grading_type", "pass_fail"),
                       ("all_day", False), ("submission_types", "online_upload,online_text_entry,online_url"),
                       ("position", n), ("peer_reviews", False),
                       ("automatic_peer_reviews", False), ("omit_from_final_grade", True),
                       ("post_to_sis", False), ("allowed_attempts", -1)]:
        child(settings, key, value)
    html_path = f"{assignment_id}/unit-{n:02d}-checkin.html"
    settings_path = f"{assignment_id}/assignment_settings.xml"
    files[html_path], files[settings_path] = checkin_html(unit), xml(settings)
    res = child(resources, "resource", identifier=assignment_id, type=APP_TYPE, href=html_path)
    child(res, "file", href=html_path)
    child(res, "file", href=settings_path)
    return {"unit": n, "title": title, "assignment_identifier": assignment_id,
            "points": 0, "grading_type": "pass_fail", "omit_from_final_grade": True,
            "completion_requirement": "must_submit"}


def add_discussion(files, resources, org_module, items):
    """Add one ungraded optional forum, with no announcement or forced-post rule."""
    topic_id = identifier("course_questions")
    meta_id = identifier("course_questions_meta")
    item_id = identifier("course_questions_item")
    title = "Course questions and project exchange"
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
    return {"title": title, "after_unit_lesson": 1, "identifier": topic_id,
            "graded": False, "required_for_completion": False}


def build():
    units, milestones = load_content()
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
    child(group, "title", "Building AI Solutions — Unit check-ins")
    child(group, "position", 1)
    child(group, "group_weight", 0)
    for milestone in milestones:
        group = child(groups, "assignmentGroup", identifier=identifier("milestone_group", milestone["number"]))
        child(group, "title", f'Milestone {milestone["number"]} — {milestone["title"]}')
        child(group, "position", milestone["number"] + 1)
        child(group, "group_weight", milestone["weight"])
    mapping = {"course": "Building AI Solutions", "owner": "Majid Memari",
               "base_url": BASE, "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
               "grade_policy": "Five 100-point milestones count in weighted groups 15/20/25/15/25; zero-point Complete/Incomplete check-ins omitted; no due dates",
               "progress_policy": "View each native Canvas lesson page; submit each check-in and milestone. No hard prerequisites or sequential gates.",
               "lesson_delivery": "native_canvas_pages_with_course_iframes",
               "units": [], "checkins": [], "milestones": []}

    for unit in units:
        n = unit["number"]
        module_id, page_id = identifier("module", n), identifier("lesson_page", n)
        item_id = identifier("lesson_item", n)
        module_title = f'Unit {n:02d}: {unit["title"]}'
        url = f"{BASE}unit-{n:02d}.html?delivery=canvas"
        org_module = child(learning, "item", identifier=module_id)
        child(org_module, "title", module_title)
        page_title = f'Unit {n:02d} lesson: {unit["title"]}'
        org_page = child(org_module, "item", identifier=item_id, identifierref=page_id)
        child(org_page, "title", page_title)
        mod = child(module_meta, "module", identifier=module_id)
        child(mod, "title", module_title)
        child(mod, "workflow_state", "active")
        child(mod, "position", n)
        child(mod, "require_sequential_progress", False)
        items = child(mod, "items")
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

        requirements = child(mod, "completionRequirements")
        requirement = child(requirements, "completionRequirement", type="must_view")
        child(requirement, "identifierref", item_id)
        if n == 1:
            mapping["discussion"] = add_discussion(files, resources, org_module, items)
        mapping["checkins"].append(add_checkin(files, resources, org_module, items,
                                              requirements, unit, checkin_group_id))

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
                           ("points_possible", 100), ("grading_type", "points"),
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
        rubric = child(rubrics, "rubric", identifier=rubric_id)
        for key, value in [("title", f"Building AI Solutions — {name}"), ("read_only", False),
                           ("reusable", True), ("public", False), ("points_possible", 100),
                           ("hide_score_total", False), ("free_form_criterion_comments", True)]:
            child(rubric, key, value)
        criteria = child(rubric, "criteria")
        for index, criterion in enumerate(m["rubric"], 1):
            c = child(criteria, "criterion")
            criterion_id = identifier(f"criterion_{num}", index)
            child(c, "criterion_id", criterion_id)
            child(c, "points", criterion["weight"])
            child(c, "description", criterion["criterion"])
            child(c, "long_description", f'Meets the goal: {criterion["meets"]}\nStronger evidence: {criterion["strong"]}')
            # Canvas's rubric editor derives criterion maxima from ratings even
            # for a free-form rubric. Preserve technical 0/max bounds without
            # inventing intermediate achievement thresholds or scoring anchors.
            ratings = child(c, "ratings")
            for suffix, points, description in [("max", criterion["weight"], "Maximum available points"),
                                                 ("zero", 0, "Zero points")]:
                rating = child(ratings, "rating")
                child(rating, "id", f"{criterion_id}_{suffix}")
                child(rating, "criterion_id", criterion_id)
                child(rating, "description", description)
                child(rating, "points", points)
        mapping["milestones"].append({"number": num, "title": m["title"], "after_unit": n,
                                      "assignment_identifier": assignment_id,
                                      "source_url": f'{BASE}project.html#milestone-{num}',
                                      "points": 100, "omit_from_final_grade": False,
                                      "completion_requirement": "must_submit",
                                      "course_weight_percent": m["weight"],
                                      "assignment_group_identifier": identifier("milestone_group", num)})

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
    print(f"Built {PACKAGE}: {len(files)} files, 12 modules, 12 pages, 12 check-ins, 5 milestones, 5 rubrics, 1 discussion")


def validate(path):
    """Check package integrity and the high-consequence integration invariants."""
    with ZipFile(path) as archive:
        names = set(archive.namelist())
        assert archive.testzip() is None
        assert all(not n.startswith("/") and ".." not in Path(n).parts for n in names)
        assert "course_settings/course_settings.xml" not in names
        assert "course_settings/syllabus.html" not in names
        docs = {n: ET.fromstring(archive.read(n)) for n in names if n.endswith(".xml")}
        manifest = docs["imsmanifest.xml"]
        resources = manifest.findall(f"{{{CC}}}resources/{{{CC}}}resource")
        ids = {r.get("identifier") for r in resources}
        assert len(ids) == len(resources) == 32
        assert all(r.get("type") != "imswl_xmlv1p1" for r in resources)
        for res in resources:
            for f in res.findall(f"{{{CC}}}file"):
                assert f.get("href") in names
            for dependency in res.findall(f"{{{CC}}}dependency"):
                assert dependency.get("identifierref") in ids
        for item in manifest.findall(f".//{{{CC}}}item[@identifierref]"):
            assert item.get("identifierref") in ids
        modules = docs["course_settings/module_meta.xml"].findall(f"{{{CANVAS}}}module")
        assert len(modules) == 12
        unit_pages, assignments, discussion_items = [], [], []
        requirement_count = 0
        for n, mod in enumerate(modules, 1):
            assert mod.findtext(f"{{{CANVAS}}}require_sequential_progress") == "false"
            assert mod.find(f"{{{CANVAS}}}prerequisites") is None
            item_ids = set()
            expected_requirements = {}
            for item in mod.findall(f"{{{CANVAS}}}items/{{{CANVAS}}}item"):
                item_ids.add(item.get("identifier"))
                content = item.findtext(f"{{{CANVAS}}}content_type")
                if content == "WikiPage":
                    unit_pages.append(item.findtext(f"{{{CANVAS}}}identifierref"))
                    assert item.get("identifier") == identifier("lesson_item", n)
                    expected_requirements[item.get("identifier")] = "must_view"
                elif content == "Assignment":
                    assignments.append(item.findtext(f"{{{CANVAS}}}identifierref"))
                    expected_requirements[item.get("identifier")] = "must_submit"
                else:
                    assert content == "DiscussionTopic"
                    discussion_items.append(item.findtext(f"{{{CANVAS}}}identifierref"))
            requirements = mod.findall(f"{{{CANVAS}}}completionRequirements/{{{CANVAS}}}completionRequirement")
            actual_requirements = {r.findtext(f"{{{CANVAS}}}identifierref"): r.get("type") for r in requirements}
            assert len(requirements) == len(actual_requirements)
            assert actual_requirements == expected_requirements
            assert set(actual_requirements) <= item_ids
            requirement_count += len(requirements)
            assert identifier("checkin_item", n) in actual_requirements
        assert requirement_count == 29
        assert unit_pages == [identifier("lesson_page", n) for n in range(1, 13)]
        assert len(assignments) == 17
        checkins = {identifier("checkin", n) for n in range(1, 13)}
        assert checkins <= set(assignments)
        milestones = [a for a in assignments if a not in checkins]
        assert milestones == [identifier("milestone", n) for n in range(1, 6)]
        assert discussion_items == [identifier("course_questions")]
        discussion = docs[f'discussions/{identifier("course_questions_meta")}.xml']
        assert discussion.findtext(f"{{{CANVAS}}}type") == "topic"
        assert discussion.findtext(f"{{{CANVAS}}}workflow_state") == "active"
        assert discussion.findtext(f"{{{CANVAS}}}require_initial_post") == "false"
        assert discussion.find(f"{{{CANVAS}}}assignment") is None
        assert all(discussion.find(f"{{{CANVAS}}}{tag}") is None for tag in ["posted_at", "delayed_post_at", "lock_at"])
        for assignment in assignments:
            doc = docs[f"{assignment}/assignment_settings.xml"]
            get = lambda tag: doc.findtext(f"{{{CANVAS}}}{tag}")
            assert get("omit_from_final_grade") == ("true" if assignment in checkins else "false")
            assert get("points_possible") == ("0" if assignment in checkins else "100")
            assert get("grading_type") == ("pass_fail" if assignment in checkins else "points")
            assert get("submission_types") == "online_upload,online_text_entry,online_url"
            assert get("allowed_attempts") == "-1"
            assert all(doc.find(f"{{{CANVAS}}}{tag}") is None for tag in ["due_at", "unlock_at", "lock_at"])
        groups = docs["course_settings/assignment_groups.xml"].findall(f"{{{CANVAS}}}assignmentGroup")
        group_weights = {g.get("identifier"): float(g.findtext(f"{{{CANVAS}}}group_weight")) for g in groups}
        assert group_weights == {identifier("milestone_group"): 0,
                                 **{identifier("milestone_group", n): w for n, w in enumerate([15, 20, 25, 15, 25], 1)}}
        for assignment in assignments:
            group = docs[f"{assignment}/assignment_settings.xml"].findtext(f"{{{CANVAS}}}assignment_group_identifierref")
            expected = identifier("milestone_group") if assignment in checkins else identifier("milestone_group", int(assignment.rsplit("_", 1)[1]))
            assert group == expected
        class InspectHTML(HTMLParser):
            def __init__(self):
                super().__init__()
                self.frames, self.meta, self.anchors = [], {}, []

            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == "iframe":
                    self.frames.append(attrs)
                elif tag == "meta" and attrs.get("name"):
                    self.meta[attrs["name"]] = attrs.get("content")
                elif tag == "a":
                    self.anchors.append(attrs)

        for n in range(1, 13):
            parser = InspectHTML()
            parser.feed(archive.read(f"wiki_content/unit-{n:02d}-lesson.html").decode())
            assert parser.meta["identifier"] == identifier("lesson_page", n)
            assert parser.meta["editing_roles"] == "teachers"
            assert parser.meta["workflow_state"] == "active"
            assert not parser.anchors
            assert len(parser.frames) == 1
            frame = parser.frames[0]
            assert frame["src"] == f"{BASE}unit-{n:02d}.html?delivery=canvas"
            assert frame.get("title") and frame["width"] == "100%" and frame["height"] == "1000"
        for name in names:
            if name.endswith(".html"):
                parser = InspectHTML()
                parser.feed(archive.read(name).decode())
                assert not parser.anchors, f"Unexpected navigation link in {name}"
        rubric_docs = docs["course_settings/rubrics.xml"].findall(f"{{{CANVAS}}}rubric")
        assert len(rubric_docs) == 5
        for rubric in rubric_docs:
            criteria = rubric.findall(f"{{{CANVAS}}}criteria/{{{CANVAS}}}criterion")
            points = [float(c.findtext(f"{{{CANVAS}}}points")) for c in criteria]
            assert sum(points) == 100
            assert rubric.findtext(f"{{{CANVAS}}}free_form_criterion_comments") == "true"
            for criterion, point in zip(criteria, points):
                rating_points = [float(p.text) for p in criterion.findall(f"{{{CANVAS}}}ratings/{{{CANVAS}}}rating/{{{CANVAS}}}points")]
                assert rating_points == [point, 0]
        all_text = b"\n".join(archive.read(n) for n in names).decode()
        for forbidden in ["UVU", "Ruggles", "BEI", "EdTech", "instructure.com/courses/", "RESEND_API_KEY"]:
            assert forbidden not in all_text, forbidden


if __name__ == "__main__":
    build()
