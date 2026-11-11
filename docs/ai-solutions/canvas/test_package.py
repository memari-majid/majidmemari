"""Check the native reading boundary without weakening package navigation rules."""
from html.parser import HTMLParser
import unittest

import build_package as package


class Reader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.text = [], []

    def handle_starttag(self, tag, attrs):
        if tag == "a": self.links.append(dict(attrs).get("href"))

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


if __name__ == "__main__": unittest.main()
