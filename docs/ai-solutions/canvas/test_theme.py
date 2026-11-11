"""Content-preservation and safe integration checks for the Canvas theme renderer."""

import importlib.util
from html.parser import HTMLParser
from pathlib import Path
import tempfile
import unittest

from theme import COURSE_CSS, THEME, load_course_theme, primary_link, render_criteria, style_fragment, wrap_content


class TextReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []

    def handle_data(self, data):
        self.text.append(data)


def text_content(html):
    parser = TextReader()
    parser.feed(html)
    return " ".join(" ".join(parser.text).split())


class CanvasThemeTests(unittest.TestCase):
    def test_missing_source_token_fails_instead_of_silently_drifting(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "colors.css"
            path.write_text(COURSE_CSS.read_text().replace("--teal:", "--removed-teal:"))
            with self.assertRaisesRegex(ValueError, "teal"):
                load_course_theme(path)

    def test_plain_text_headers_are_escaped_and_accessible_small_text_is_dark(self):
        result = wrap_content("<p>Body</p>", title="Need < evidence", eyebrow="A & B", lead="Don't guess")
        self.assertIn("Need &lt; evidence", result)
        self.assertIn("A &amp; B", result)
        self.assertIn("color:#086b73", result)
        self.assertIn("background-color:" + THEME["paper"], result)
        self.assertNotIn("<style", result)

    def test_content_and_table_semantics_survive_inline_styling(self):
        body = '<h3>Evidence</h3><table><caption>Same 12 cases</caption><thead><tr><th scope="col">Minutes</th></tr></thead><tbody><tr><td>84 &lt; 86.4</td></tr></tbody></table><p>Not cash savings.</p>'
        result = style_fragment(body)
        self.assertEqual(text_content(body), text_content(result))
        self.assertIn('scope="col"', result)
        self.assertIn("<caption", result)
        self.assertEqual(style_fragment(result), result)

    def test_heading_emphasis_preserves_children_and_is_idempotent_without_markers(self):
        body = '<h2>Evidence &amp; <em>uncertainty</em></h2><h3><strong>Already emphasized</strong></h3><h4>A <a href="/courses/123/modules">source</a><br>and a decision</h4>'
        result = style_fragment(body)
        self.assertEqual(text_content(result), text_content(body))
        self.assertEqual(result.count("<strong>"), 3)
        self.assertEqual(result.count("</strong>"), 3)
        self.assertIn("<strong>Evidence &amp; <em>uncertainty</em></strong>", result)
        self.assertIn('href="/courses/123/modules"', result)
        self.assertEqual(style_fragment(result), result)
        without_markers = result.replace(' data-course-heading="true"', '')
        self.assertEqual(style_fragment(without_markers), result)
        titled = wrap_content('<h3>Next action</h3>', title='My < title')
        self.assertIn('<strong>My &lt; title</strong>', titled)
        self.assertEqual(style_fragment(titled), titled)

    def test_iframe_and_canvas_navigation_context_survive(self):
        body = '<iframe src="https://www.majidmemari.com/teaching/ai-solutions/unit-06.html?delivery=canvas&amp;canvasLesson=6" title="Lesson and course TA" width="100%" height="1000"></iframe><p><a href="/courses/123/modules" target="_self">Continue in Canvas</a></p>'
        result = wrap_content(body, compact=True)
        self.assertIn('height="1000"', result)
        self.assertIn('title="Lesson and course TA"', result)
        self.assertIn('delivery=canvas&amp;canvasLesson=6', result)
        self.assertIn('href="/courses/123/modules"', result)

    def test_primary_action_keeps_white_text_and_canvas_destination_when_wrapped(self):
        action = primary_link("/courses/123/modules/items/456", "Start Unit 1 →")
        result = wrap_content(action)
        self.assertIn("background-color:#182a46", result)
        self.assertIn("color:#ffffff", result)
        self.assertIn("padding:13px 23px", result)
        self.assertNotIn("min-height:", result)
        self.assertNotIn("box-sizing:", result)
        self.assertIn("max-width:912px", result)
        self.assertIn("font-weight:bold", result)
        self.assertEqual(text_content(result), "Start Unit 1 →")
        with self.assertRaises(ValueError):
            primary_link("https://example.org/", "Leave Canvas")

    def test_scripts_forms_handlers_and_escape_navigation_are_rejected(self):
        for body in ('<script>alert(1)</script>', '<button>Submit</button>', '<p onclick="bad()">No</p>', '<a href="javascript:bad()">Bad</a>', '<a href="/next" target="_blank">Leave</a>'):
            with self.subTest(body=body), self.assertRaises(ValueError):
                wrap_content(body)

    def test_real_milestone_briefs_and_criteria_keep_all_evidence_text(self):
        path = COURSE_CSS.parents[1] / "course_content.py"
        spec = importlib.util.spec_from_file_location("canonical_course_theme_test", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for milestone in module.MILESTONES:
            with self.subTest(milestone=milestone["number"]):
                self.assertEqual(text_content(milestone["brief_html"]), text_content(style_fragment(milestone["brief_html"])))
                result = text_content(render_criteria(milestone["rubric"]))
                for criterion in milestone["rubric"]:
                    for key in ("criterion", "meets", "strong"):
                        self.assertIn(criterion[key], result)
                    self.assertIn(f'{criterion["weight"]} points', result)


if __name__ == "__main__":
    unittest.main()
