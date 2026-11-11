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

    def test_complete_decision_lab_is_available_in_every_native_text_fallback(self):
        units, _ = package.load_content()
        package.VISUALS = package.load_visuals()
        for unit, activity in zip(units, package.DECISION_LABS):
            with self.subTest(unit=unit["number"]):
                rendered = package.lesson_body_html(unit)
                lab = package.decision_lab_reading_html(unit["number"])
                reader = Reader(); reader.feed(lab)
                text = " ".join(reader.text)
                marker = f'data-decision-lab-text="{unit["number"]}"'
                self.assertIn(marker, rendered)
                for field in ("title", "goal", "role", "scenario", "challenge", "worked", "transfer"):
                    self.assertIn(activity[field], text)
                for choice in activity["choices"]:
                    self.assertIn(choice["label"], text)
                for item in activity["evidence"]:
                    self.assertIn(item["detail"], text)
                self.assertFalse(reader.frames or reader.links)
                self.assertIn("no AI service or interactive frame needed", text)
                self.assertIn("project update you already submit", text)
                self.assertLess(rendered.index(marker), rendered.index('Build the same project'))
                whole = Reader(); whole.feed(rendered)
                self.assertEqual(len(whole.frames), 2)
                self.assertTrue(all(not href.startswith(("http:", "https:")) for href in whole.links))

    def test_final_lab_does_not_assume_omitted_quality_results(self):
        activity = package.DECISION_LABS[11]
        self.assertIn("acceptable-output counts are not provided", activity["worked"])
        self.assertIn("confirming that both methods met the same quality threshold", activity["worked"])


if __name__ == "__main__": unittest.main()
