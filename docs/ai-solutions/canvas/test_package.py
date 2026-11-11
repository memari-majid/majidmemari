"""Check the native reading boundary without weakening package navigation rules."""
from html.parser import HTMLParser
import unittest

import build_package as package
import async_content as assessments


class Reader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.text, self.frames = [], [], []

    def handle_starttag(self, tag, attrs):
        if tag == "a": self.links.append(dict(attrs).get("href"))
        elif tag == "iframe": self.frames.append(dict(attrs))

    def handle_data(self, text): self.text.append(text)


class NativeReferenceTests(unittest.TestCase):
    def test_reference_conversion_retains_labels_urls_and_internal_navigation(self):
        source = ('<p><a href="https://example.org/?a=1&amp;b=2"><strong>Source</strong> &amp; context</a> '
                  '<a href="#task">Task</a> <a href="/conversations">Inbox</a><br/><!--note--></p>')
        rendered = package.native_reading_references(source)
        reader = Reader(); reader.feed(rendered)
        self.assertEqual(reader.links, ["#task", "/conversations"])
        self.assertIn("Source & context (https://example.org/?a=1&b=2)", ''.join(reader.text))
        self.assertIn("<strong>Source</strong>", rendered)
        self.assertIn("<br/><!--note-->", rendered)

    def test_real_capability_map_is_readable_without_external_click_targets(self):
        units, _ = package.load_content()
        package.VISUALS = package.load_visuals()
        rendered = package.lesson_body_html(units[0])
        reader = Reader(); reader.feed(rendered)
        self.assertTrue(all(not href.startswith(("http:", "https:")) for href in reader.links))
        self.assertIn("https://learn.microsoft.com/en-us/training/modules/fundamentals-generative-ai/", ''.join(reader.text))
        self.assertIn("generative AI and agents", ''.join(reader.text))
        self.assertIn("?delivery=canvas", rendered)
        self.assertIn('data-course-ta="inline"', rendered)

    def test_every_required_reading_stays_inside_the_existing_native_delivery_boundary(self):
        readings = package.TEXTBOOK_READINGS.validate_readings()
        units, _ = package.load_content()
        package.VISUALS = package.load_visuals()
        for unit in units:
            with self.subTest(unit=unit["number"]):
                rendered = package.lesson_body_html(unit)
                reader = Reader(); reader.feed(rendered)
                text = " ".join(reader.text)
                self.assertEqual(len(reader.frames), 2)
                self.assertTrue(all(f["src"].startswith(package.BASE) for f in reader.frames))
                self.assertTrue(all(not href.startswith(("http:", "https:")) for href in reader.links))
                self.assertIn("Required free textbook reading", text)
                self.assertIn("access alternative", text)
                for reading in readings[unit["number"]]:
                    for field in ("section", "scope", "prompt", "bridge", "url"):
                        self.assertIn(reading[field], text)

    def test_reading_connection_uses_the_existing_formative_response_not_an_extra_question(self):
        units, _ = package.load_content()
        for unit in units:
            with self.subTest(unit=unit["number"]):
                quiz = package.normalize_practice(unit, assessments)
                self.assertEqual(len(quiz["questions"]), 3)
                reader = Reader(); reader.feed(quiz["evidence_prompt_html"])
                original = Reader(); original.feed(assessments.UNIT_EVIDENCE[unit["number"]])
                text = " ".join(reader.text)
                self.assertIn(" ".join(original.text), text)
                self.assertIn("Reading connection:", text)
                self.assertIn("same project response", text)
                self.assertIn("do not claim", text)
                self.assertFalse(reader.frames or reader.links)
                for reading in package.TEXTBOOK_READINGS.READING_PLAN[unit["number"]]:
                    self.assertIn(reading["section"], text)
        self.assertEqual(assessments.FINAL_EXAM["max"], 40)


if __name__ == "__main__": unittest.main()
