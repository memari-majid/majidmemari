#!/usr/bin/env python3
"""Render this offering's dated Canvas fragments; keep the reusable core undated."""
from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
from html import escape
import json
from pathlib import Path
import re
import sys
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
CANVAS = HERE.parents[1]
sys.path.insert(0, str(CANVAS))
from theme import THEME, style_fragment

SCHEDULE = HERE / 'schedule.json'
HOME = CANVAS / 'canvas-home.html'
SYLLABUS = CANVAS / 'canvas-syllabus.html'


def day(value, weekday=False):
    d = date.fromisoformat(value)
    return (d.strftime('%a. ') if weekday else '') + d.strftime('%b. ') + str(d.day)


def period(start, end):
    a, b = date.fromisoformat(start), date.fromisoformat(end)
    if a == b:
        return day(start)
    if a.month == b.month:
        return f'{a.strftime("%b.")} {a.day}–{b.day}'
    return f'{day(start)}–{day(end)}'


def validate(data):
    zone = ZoneInfo(data['timeZone'])
    assert data['timeZone'] == 'America/Denver'
    assert [u['number'] for u in data['units']] == list(range(1, 13))
    assert len(data['milestones']) == 5 and len(data['projectExchanges']) == 3
    assert [m['groupWeightPercent'] for m in data['milestones']] == [15, 20, 25, 15, 25]
    assert [m['points'] for m in data['milestones']] == [100, 100, 100, 100, 60]
    assert data['individualExam']['points'] == 40
    assert sum(m['componentCourseWeightPercent'] for m in data['milestones']) + data['individualExam']['componentCourseWeightPercent'] == 100
    for row in data['units'] + data['milestones']:
        assert row['availableFrom'] is None and row['lockAt'] is None
        local = datetime.fromisoformat(row['dueAt']['local'])
        utc = datetime.fromisoformat(row['dueAt']['utc'].replace('Z', '+00:00'))
        assert local.astimezone(zone).isoformat(timespec='minutes') == row['dueAt']['local']
        assert local.astimezone(timezone.utc) == utc
        assert local.weekday() == 6 and (local.hour, local.minute) == (23, 59)
        assert not '2027-03-15' <= local.date().isoformat() <= '2027-03-21'
    for unit in data['units']:
        assert unit['startDate'] <= unit['endDate']
        assert unit['dueAt']['local'].startswith(unit['endDate'] + 'T')
    for milestone in data['milestones']:
        assert milestone['dueAt'] == data['units'][milestone['afterUnit'] - 1]['dueAt']
    exam = data['individualExam']
    for field in ('availableFrom', 'dueAt', 'optionalInitialSubmissionAt'):
        local = datetime.fromisoformat(exam[field]['local'])
        utc = datetime.fromisoformat(exam[field]['utc'].replace('Z', '+00:00'))
        assert local.astimezone(zone).isoformat(timespec='minutes') == exam[field]['local']
        assert local.astimezone(timezone.utc) == utc
    assert exam['lockAt'] is None
    assert exam['availableFrom']['local'] == '2027-04-29T00:00-06:00'
    assert exam['dueAt']['local'] == '2027-05-05T23:59-06:00'
    assert data['units'][6]['dueAt']['utc'].endswith('06:59:00Z')
    assert data['units'][7]['dueAt']['utc'].endswith('05:59:00Z')
    for row in data['projectExchanges']:
        assert row['nativeDueAt'] is None and not row['graded']
        local = datetime.fromisoformat(row['suggestedInitialPostAt']['local'])
        assert local.weekday() == 4
        assert local.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z') == row['suggestedInitialPostAt']['utc']


def schedule_html(data):
    milestones = {m['afterUnit']: m for m in data['milestones']}
    exchanges = {x['unit']: x for x in data['projectExchanges']}
    rows = []
    for u in data['units']:
        n = u['number']
        focus = f'<strong>Unit {n:02d}: {escape(u["title"])}</strong>'
        due = f'Practice quiz and project update: <strong>{day(u["endDate"], True)}, 11:59 p.m.</strong>'
        if n in exchanges:
            post = exchanges[n]['suggestedInitialPostAt']['local'][:10]
            focus += f'<br>Suggested initial project-exchange post: {day(post, True)}. The supplied-sample alternative remains available.'
        if n in milestones:
            m = milestones[n]
            due += f'<br><strong>{escape(m["title"])}</strong> is due at the same time. Feedback target: {day(m["feedbackTargetDate"], True)}.'
        rows.append((u['startDate'], period(u['startDate'], u['endDate']), focus, due))
    for block in data['additionalBlocks']:
        rows.append((block['startDate'], period(block['startDate'], block['endDate']), f'<strong>{escape(block["title"])}</strong>', escape(block['notes'])))
    rows += [
        ('2027-03-15', 'Mar. 15–21', '<strong>Spring break</strong>', 'No new unit, quiz, milestone, or exchange deadline.'),
        ('2027-04-28', 'Apr. 28', '<strong>Interim day</strong>', 'No classes or due item.'),
        ('2027-04-29', 'Apr. 29–May 5', '<strong>Individual case exam and final completion</strong>',
         'Exam available <strong>Thu. Apr. 29, 12:00 a.m.</strong> Final response and any revision due <strong>Wed. May 5, 11:59 p.m.</strong> Use the completion checklist after submitting. The exam is 40 points in the existing Milestone 5 group.'),
    ]
    rows.sort(key=lambda row: row[0])
    table = '<table><caption>Spring 2027: one chronological path through twelve units and the capstone</caption><thead><tr><th scope="col">Dates</th><th scope="col">Focus</th><th scope="col">Submission or next action</th></tr></thead><tbody>'
    table += ''.join(f'<tr><th scope="row">{escape(dates)}</th><td>{focus}</td><td>{due}</td></tr>' for _, dates, focus, due in rows)
    table += '</tbody></table>'
    body = (
        f'<section id="spring-2027-schedule" data-offering="spring-2027" style="background-color:{THEME["paper"]};margin:24px 0">'
        '<h3>Spring 2027 schedule</h3>'
        '<p><strong>January 11–May 5, 2027 · Asynchronous · Mountain Time (America/Denver)</strong></p>'
        '<p>Follow the same twelve units and one continuing project in Canvas Modules. Weekly quiz/project updates and milestone snapshots are due on the listed Sunday at <strong>11:59 p.m. Mountain Time</strong>. The individual exam has its own final-period deadline. No live attendance is required.</p>'
        + table +
        '<h4>Feedback, holidays, and the final exam</h4><ul>'
        '<li>Use the two project-clinic weeks for actual user attempts, feedback, revision, and retesting. Keep an observation pending until it has occurred.</li>'
        '<li>January 18 and February 15 are holidays. No live class or holiday response is expected. The listed Sunday deadlines remain; February 14 milestone feedback is targeted for February 22 because February 15 is excluded from working days.</li>'
        '<li>Project exchanges are formative. The Friday initial-post dates are suggestions for allowing useful peer feedback, not extra graded deadlines. You can critique the supplied sample in the quiz project update instead.</li>'
        '<li>For optional early exam feedback, submit an initial response by <strong>Sunday, May 2, 11:59 p.m.</strong>; the feedback target is <strong>May 4</strong>. Revise in the same assignment through the actual <strong>May 5, 11:59 p.m.</strong> deadline. May 2 is not an additional Canvas due date or a late-work boundary.</li>'
        '<li>For this offering, feedback on on-time final exam submissions is targeted for <strong>May 10</strong>, replacing the general five-working-day exam target at term end. Native Canvas Grades and submission comments remain the feedback record.</li>'
        '</ul><p>This schedule adds no lock dates and changes no grading weights, submission requirements, or late-work penalty. Follow the existing offering policies below and ask private schedule/access questions through Canvas Inbox.</p></section>'
    )
    return style_fragment(body)


def home_snippet(data):
    course_id = data['canvasCourseId']
    return style_fragment(
        '<p id="spring-2027-offering"><strong>Spring 2027 · January 11–May 5 · Asynchronous</strong><br>'
        f'<a href="/courses/{course_id}/assignments/syllabus#spring-2027-schedule">View the Spring 2027 schedule and deadlines</a> · All times are Mountain Time.</p>'
    )


def patch_home(text, snippet):
    pattern = r'<p\b[^>]*\bid="spring-2027-offering"[^>]*>[\s\S]*?</p>'
    if re.search(pattern, text):
        return re.sub(pattern, lambda _: snippet, text, count=1)
    anchor = re.search(r'<p\b[^>]*><strong>Majid Memari · All disciplines · No prerequisites</strong></p>', text)
    if anchor is None:
        raise ValueError('Expected Home instructor/audience paragraph is missing; inspect before patching')
    return text[:anchor.end()] + snippet + text[anchor.end():]


def patch_syllabus(text, fragment):
    pattern = r'<section\b[^>]*\bid="spring-2027-schedule"[^>]*>[\s\S]*?</section>'
    if re.search(pattern, text):
        return re.sub(pattern, lambda _: fragment, text, count=1)
    anchor = re.search(r'<h3\b[^>]*><strong>Asynchronous course path</strong></h3>', text)
    if anchor is None:
        raise ValueError('Expected asynchronous path heading is missing; inspect before patching')
    return text[:anchor.start()] + fragment + text[anchor.start():]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Also update the maintained, destination-specific Home and syllabus HTML')
    args = parser.parse_args()
    data = json.loads(SCHEDULE.read_text())
    validate(data)
    fragment, snippet = schedule_html(data), home_snippet(data)
    home_source, syllabus_source = HOME.read_text(), SYLLABUS.read_text()
    home, syllabus = patch_home(home_source, snippet), patch_syllabus(syllabus_source, fragment)
    assert home.count('id="spring-2027-offering"') == 1
    assert syllabus.count('id="spring-2027-schedule"') == 1
    assert patch_home(home, snippet) == home and patch_syllabus(syllabus, fragment) == syllabus
    # Schedule insertion leaves the existing authored/policy HTML byte-for-byte intact.
    assert home.replace(snippet, '', 1) == re.sub(r'<p\b[^>]*\bid="spring-2027-offering"[^>]*>[\s\S]*?</p>', '', home_source, count=1)
    assert syllabus.replace(fragment, '', 1) == re.sub(r'<section\b[^>]*\bid="spring-2027-schedule"[^>]*>[\s\S]*?</section>', '', syllabus_source, count=1)
    (HERE / 'spring-2027-schedule.html').write_text(fragment)
    (HERE / 'spring-2027-home-snippet.html').write_text(snippet)
    Path('/tmp/spring-2027-home.html').write_text(home)
    Path('/tmp/spring-2027-syllabus.html').write_text(syllabus)
    if args.apply:
        HOME.write_text(home); SYLLABUS.write_text(syllabus)
    print('Validated Spring 2027: 12 quiz deadlines, 5 milestones, 3 suggested exchanges, exam window and DST offsets')
    print('Rendered /tmp/spring-2027-home.html and /tmp/spring-2027-syllabus.html' + ('; maintained HTML updated' if args.apply else ''))


if __name__ == '__main__':
    main()
