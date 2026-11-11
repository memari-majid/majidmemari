"""Assigned-reading scope, free-source and embedded-navigation contracts."""
from html.parser import HTMLParser
import unittest

import textbook_readings as readings


class Reader(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.frames, self.links, self.rows, self.text = [], [], 0, []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'iframe': self.frames.append(attrs)
        if tag == 'a': self.links.append(attrs.get('href'))
        if tag == 'tr': self.rows += 1

    def handle_data(self, value): self.text.append(value)


def example_plan():
    return {unit: [{
        'book': 'cambridge-ai', 'section': '1.1', 'title': 'What is Artificial Intelligence?',
        'url': 'https://artint.info/3e/html/ArtInt3e.Ch1.S1.html',
        'scope': 'Read the introductory explanation before subsection 1.1.1.',
        'purpose': 'Connect a task and its limits to an AI capability.',
        'bridge': 'A useful candidate output still needs a task-specific check.',
        'prompt': 'Name one input, useful output, and human check for your task.',
        'minutes': 8,
    }] for unit in range(1, 13)}


class AssignedReadingTests(unittest.TestCase):
    def test_validation_requires_complete_named_scopes_and_official_free_sources(self):
        plan = example_plan()
        self.assertEqual(readings.validate_readings(plan), plan)
        del plan[12]
        with self.assertRaises(AssertionError): readings.validate_readings(plan)
        for invalid in ('javascript:alert(1)', 'https://unverified.example/section',
                        'https://openstax.org/books/introductory-statistics-2e/pages/1-introduction',
                        'https://user@artint.info/3e/html/ArtInt3e.Ch1.S1.html'):
            plan = example_plan(); plan[1][0]['url'] = invalid
            with self.subTest(url=invalid), self.assertRaises(AssertionError):
                readings.validate_readings(plan)
        plan = example_plan(); del plan[1][0]['scope']
        with self.assertRaises(AssertionError): readings.validate_readings(plan)

    def test_embedded_official_reader_cannot_open_popups_or_navigate_canvas_top(self):
        html = readings.render_required_reading(1, plan=example_plan())
        parsed = Reader(html)
        self.assertEqual(len(parsed.frames), 1)
        frame = parsed.frames[0]
        self.assertNotIn('src', frame, 'Opening a lesson must not fetch the textbook')
        self.assertEqual(frame['data-textbook-src'], example_plan()[1][0]['url'])
        self.assertEqual(set(frame['sandbox'].split()), {'allow-scripts', 'allow-same-origin'})
        self.assertEqual(frame['loading'], 'lazy')
        self.assertEqual(frame['height'], '600')
        self.assertEqual(frame['referrerpolicy'], 'no-referrer')
        self.assertIn('Unit 1 textbook reading 1', frame['title'])
        self.assertIn('Required textbook reading', html)
        self.assertLess(html.index('Apply one idea:'), html.index('<details'))

    def test_native_canvas_variant_has_the_assignment_without_extra_frames_or_external_links(self):
        html = readings.render_required_reading(1, delivery='canvas', plan=example_plan())
        parsed = Reader(html); text = ' '.join(parsed.text)
        self.assertEqual(parsed.frames, [])
        self.assertEqual(parsed.links, [])
        self.assertIn('1.1: What is Artificial Intelligence?', text)
        self.assertIn('Cambridge University Press', text)
        self.assertIn('Read the introductory explanation', text)
        self.assertIn('Stay on this Canvas page', text)
        self.assertIn(example_plan()[1][0]['url'], text)
        self.assertIn('not another assignment', text)
        self.assertIn('do not claim to have read an unavailable text', text)

    def test_reading_plan_keeps_twelve_units_one_project_and_no_purchase_requirement(self):
        html = readings.render_reading_plan(delivery='canvas', plan=example_plan())
        parsed = Reader(html); text = ' '.join(parsed.text)
        self.assertEqual(parsed.rows, 13)
        self.assertEqual(parsed.frames, [])
        self.assertEqual(parsed.links, [])
        self.assertIn('No book purchase', text)
        self.assertIn('project update you already submit', text)
        self.assertIn('complete textbook text', text)
        self.assertIn('OpenStax, Rice University', text)

    def test_current_plan_matches_the_single_course_path_and_workload(self):
        readings.validate_readings()
        self.assertEqual(sorted(readings.READING_PLAN), list(range(1, 13)))
        self.assertTrue(all(1 <= len(rs) <= 2 for rs in readings.READING_PLAN.values()))
        workload = readings.reading_workload()
        self.assertEqual(workload['total_minutes'], sum(workload['per_unit_minutes'].values()))
        self.assertGreaterEqual(workload['minimum_minutes'], 10)
        self.assertLessEqual(workload['maximum_minutes'], 20)
        import build_core
        guide = build_core.readings()
        self.assertIn('Your free textbook reading plan', guide)
        self.assertNotIn('[[', guide)
        self.assertEqual(build_core.workload_estimate(), ('77–135', '40–67'))
        for unit in build_core.UNITS:
            html = build_core.lesson(unit)
            assignment = html.index(f'data-required-reading="{unit["number"]}"')
            self.assertLess(html.index('id="step-0"'), assignment)
            self.assertLess(assignment, html.index('id="step-1"'))
            self.assertNotIn('[[', html)
            self.assertIn('Optional further reading', html)

    def test_metadata_is_escaped_and_unknown_delivery_is_rejected(self):
        plan = example_plan(); plan[1][0]['prompt'] = '<script>bad()</script> & "quotes"'
        html = readings.render_required_reading(1, plan=plan)
        self.assertNotIn('<script>', html)
        self.assertIn('&lt;script&gt;bad()&lt;/script&gt; &amp; &quot;quotes&quot;', html)
        with self.assertRaises(ValueError): readings.render_required_reading(1, delivery='other', plan=plan)
        with self.assertRaises(ValueError): readings.render_reading_plan(delivery='other', plan=plan)


if __name__ == '__main__': unittest.main()
