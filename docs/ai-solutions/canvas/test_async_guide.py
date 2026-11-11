"""Check the async guide's portable resources and assessment/access contracts."""

from html.parser import HTMLParser
import unittest

import async_guide as guide


class FragmentReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.links = []
        self.tags = []

    def handle_data(self, data):
        self.text.append(data)

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        if tag == "a":
            self.links.append(dict(attrs).get("href"))


def read(value):
    result = FragmentReader()
    result.feed(value)
    return result


class AsyncGuideTests(unittest.TestCase):
    def test_six_downloads_are_complete_editable_text_with_matching_portable_links(self):
        self.assertEqual(len(guide.TEMPLATE_DOWNLOADS), 6)
        links = read(guide.TEMPLATES_HTML).links
        for filename, text in guide.TEMPLATE_DOWNLOADS.items():
            with self.subTest(filename=filename):
                self.assertTrue(filename.endswith(".txt"))
                self.assertNotIn("/", filename)
                self.assertIn("[ ]", text)
                self.assertGreater(len(text.encode("utf-8")), 1000)
                self.assertIn("$IMS-CC-FILEBASE$/templates/" + filename + "?canvas_download=1&canvas_qs_download_frd=1", links)

    def test_complete_case_text_is_preserved_with_its_source_and_evidence_boundaries(self):
        original = " ".join(" ".join(read(guide.COURSE_CASE_HTML).text).split())
        rendered = " ".join(" ".join(read(guide.TEMPLATES_HTML).text).split())
        self.assertIn(original, rendered)
        for label in ("S1", "S2", "S3", "S4", "S5", "S6"):
            self.assertIn(label, rendered)

    def test_guide_explains_first_setup_without_an_ai_account_and_core_terms(self):
        text = " ".join(read(guide.GUIDE_HTML).text)
        for required in ("seven steps", "without creating an account", "no previous AI", "Denominator", "Baseline", "Capacity value", "Cash change", "Core reading and text alternative"):
            self.assertIn(required, text)

    def test_assessment_and_feedback_are_not_misrepresented_as_automatic_grades(self):
        text = " ".join(read(guide.GUIDE_HTML + guide.COMPLETION_HTML).text)
        for required in ("60-point", "40-point", "same 25% group", "0%", "pending manual review", "two working days", "five working days", "37–63 learner hours including the guided units", "not automatically evaluated by AI"):
            self.assertIn(required, text)
        self.assertIn("No live class attendance is required", text)
        self.assertIn("Lesson → Exchange when listed → Practice quiz and project update → Milestone when due", text)
        self.assertIn("make a forum post to unlock progress", text)

    def test_home_uses_only_receiving_canvas_routes_and_themed_primary_action(self):
        result = guide.render_home(123, {"start": "/courses/123/modules/items/456", "guide": "/courses/123/pages/course-guide"})
        parsed = read(result)
        self.assertIn("/courses/123/modules/items/456", parsed.links)
        self.assertTrue(all(link.startswith("/courses/123/") or link == "/conversations" for link in parsed.links))
        self.assertIn("data-course-action", result)
        self.assertIn("font-weight:bold", result)
        for routes in ({"start": "https://example.org/"}, {"start": "/courses/999/modules"}):
            with self.assertRaises(ValueError):
                guide.render_home(123, routes)

    def test_syllabus_preserves_supplied_policy_without_inventing_physical_meetings(self):
        result = guide.render_syllabus(123, "<p>Approved receiving-offering policy.</p>")
        self.assertIn("Approved receiving-offering policy.", result)
        self.assertNotIn("In-Person", result)
        self.assertNotIn("5:30", result)
        self.assertNotIn("UVU", result)
        self.assertIn("37–63 total learner hours", result)
        self.assertIn("final reviewed submission counts", result)

    def test_all_portable_fragments_share_theme_and_contain_no_native_control_imitation(self):
        for value in (guide.GUIDE_HTML, guide.TEMPLATES_HTML, guide.COMPLETION_HTML):
            parsed = read(value)
            self.assertIn('data-course-theme="building-ai-solutions-2"', value)
            self.assertIn('background-color:#ffffff', value)
            self.assertFalse(set(parsed.tags) & {"script", "style", "form", "button", "input"})
            self.assertNotIn("/courses/644965", value)
            self.assertFalse(any(link.startswith("http") for link in parsed.links))


if __name__ == "__main__":
    unittest.main()
