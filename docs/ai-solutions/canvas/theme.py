"""Shared, inline-only presentation for authored Canvas course content.

Canvas owns native controls and assessment state. This renderer handles trusted
course-authored HTML fragments; it is not a general untrusted-HTML sanitizer.
The canonical course stylesheet owns the palette. No CSS/JS is injected into
Canvas's surrounding interface.
"""

from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re


THEME_VERSION = "building-ai-solutions-2"
COURSE_CSS = Path(__file__).resolve().parents[2] / "site" / "assets" / "core.css"
BODY_FONT = "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
HEADING_FONT = "Georgia,'Times New Roman',serif"
REQUIRED_TOKENS = (
    "paper", "surface", "ink", "navy", "muted", "line", "teal", "blue", "amber", "loss"
)


def load_course_theme(path=COURSE_CSS):
    """Read the single canonical palette and fail clearly if its contract drifts."""
    css = Path(path).read_text(encoding="utf-8")
    root = re.search(r":root\s*\{([^}]+)\}", css)
    if root is None:
        raise ValueError("Course theme requires a :root token block")
    values = dict(re.findall(r"--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*(?=[;}])", root[1] + "}"))
    missing = set(REQUIRED_TOKENS) - values.keys()
    if missing:
        raise ValueError(f"Missing course color tokens: {', '.join(sorted(missing))}")
    theme = {key: values[key].lower() for key in REQUIRED_TOKENS}
    # Canvas has a white native content canvas. Read the same delivery-profile
    # overrides used by the embedded website rather than presenting a cream
    # rectangle inside Canvas or maintaining a second independent palette.
    profile = re.search(r'html\[data-delivery="canvas"\]\s*\{([^}]+)\}', css)
    if profile:
        overrides = dict(re.findall(r"--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*(?=[;}])", profile[1] + "}"))
        theme.update({key: value.lower() for key, value in overrides.items() if key in REQUIRED_TOKENS})
    # Existing supporting colors are not yet named CSS variables. Check their
    # canonical presence rather than quietly creating another source of truth.
    for key, value in (("link", "#086b73"), ("guidance", "#edf5f2")):
        if value not in css.lower():
            raise ValueError(f"Canonical supporting color changed: {key} {value}")
        theme[key] = value
    return theme


THEME = load_course_theme()


def _style(**values):
    return ";".join(f"{key.replace('_', '-')}:{value}" for key, value in values.items())


def _element_styles(theme):
    heading = dict(font_family=HEADING_FONT, font_weight="bold", line_height="1.2", color=theme["navy"])
    return {
        "h2": _style(**heading, font_size="1.7rem", margin="32px 0 16px"),
        "h3": _style(font_family=BODY_FONT, font_size="1.15rem", font_weight="bold", line_height="1.35", color=theme["navy"], margin="24px 0 12px"),
        "h4": _style(font_family=BODY_FONT, font_size="1.05rem", font_weight="bold", line_height="1.35", color=theme["navy"], margin="20px 0 10px"),
        "p": "margin:0 0 1.15em",
        "ul": "margin:0 0 24px;padding-left:1.4em",
        "ol": "margin:0 0 24px;padding-left:1.4em",
        "li": "margin:0 0 8px",
        "dl": "margin:16px 0 24px",
        "dt": _style(font_weight="bold", color=theme["navy"], margin="16px 0 4px"),
        "dd": "margin:0 0 12px",
        "a": _style(color=theme["link"], text_decoration="underline", text_underline_offset="4px"),
        "table": _style(width="100%", max_width="100%", border_collapse="collapse", margin="16px 0 24px", background_color=theme["surface"]),
        "caption": _style(text_align="left", font_size="0.9rem", line_height="1.6", color=theme["muted"], padding="0 0 12px"),
        "th": _style(padding="12px", border=f"1px solid {theme['line']}", text_align="left", vertical_align="top", color=theme["navy"], background_color=theme["paper"]),
        "td": _style(padding="12px", border=f"1px solid {theme['line']}", text_align="left", vertical_align="top"),
        "figure": "margin:24px 0",
        "figcaption": _style(font_size="0.9rem", line_height="1.6", color=theme["muted"], margin="12px 0 0"),
        "blockquote": _style(margin="24px 0", padding="16px 20px", border_left=f"3px solid {theme['teal']}", background_color=theme["guidance"]),
        "details": _style(margin="20px 0", padding="16px 20px", border=f"1px solid {theme['line']}", border_radius="10px", background_color=theme["surface"]),
        "summary": _style(color=theme["navy"], font_weight="bold", padding="4px 0"),
        "iframe": "width:100%;border:0;display:block",
        "img": "max-width:100%;height:auto",
        "hr": _style(border="0", border_top=f"1px solid {theme['line']}", margin="24px 0"),
    }


def _primary_link_style(theme):
    return _style(display="inline-block", padding="13px 23px", border=f"1px solid {theme['navy']}", border_radius="9px", background_color=theme["navy"], color="#ffffff", text_decoration="none", font_size="0.9rem", font_weight="bold", line_height="1.4")


def _merge_styles(existing, authored):
    """Keep useful authored exceptions, with shared component values consistent."""
    styles = {}
    for value in (existing or "", authored or ""):
        for declaration in value.split(";"):
            if ":" in declaration:
                key, item = declaration.split(":", 1)
                styles[key.strip().lower()] = item.strip()
    return ";".join(f"{key}:{value}" for key, value in styles.items())


def _title_style(theme):
    return _style(font_family=HEADING_FONT, font_size="2rem", font_weight="bold", line_height="1.2", color=theme["navy"], margin="0 0 16px")


class _StrongEnvelope(HTMLParser):
    """Recognize a complete strong envelope, even if Canvas removes data markers."""
    VOID_TAGS = {"br", "hr", "img", "source", "track", "wbr", "col"}

    def __init__(self):
        super().__init__()
        self.depth = 0
        self.seen = False
        self.closed = False
        self.valid = True

    def handle_starttag(self, tag, attrs):
        if self.depth == 0:
            if tag != "strong" or self.seen:
                self.valid = False
            self.seen = True
        if tag not in self.VOID_TAGS:
            self.depth += 1

    def handle_startendtag(self, tag, attrs):
        if self.depth == 0:
            self.valid = False

    def handle_endtag(self, tag):
        self.depth -= 1
        if self.depth == 0:
            self.closed = True
            if tag != "strong":
                self.valid = False
        elif self.depth < 0:
            self.valid = False

    def handle_data(self, data):
        if self.depth == 0 and data.strip():
            self.valid = False


def _semantic_heading(content):
    probe = _StrongEnvelope()
    probe.feed(content)
    probe.close()
    if probe.valid and probe.seen and probe.closed and probe.depth == 0:
        return content
    return f"<strong>{content}</strong>"


class _InlineThemeParser(HTMLParser):
    VOID_TAGS = {"br", "hr", "img", "source", "track", "wbr", "col"}
    PROHIBITED_TAGS = {"script", "style", "link", "form", "input", "button", "textarea", "select", "option", "html", "head", "body"}

    def __init__(self, theme):
        super().__init__(convert_charrefs=False)
        self.theme = theme
        self.styles = _element_styles(theme)
        self.parts = []
        self.headings = []

    def _start(self, tag, attributes, closed=False):
        if tag in self.PROHIBITED_TAGS:
            raise ValueError(f"Canvas authored fragment cannot contain <{tag}>")
        attrs = dict(attributes)
        for name, value in attributes:
            if name.lower().startswith("on"):
                raise ValueError("Canvas authored fragments cannot contain event handlers")
            if name in ("href", "src") and value and re.match(r"\s*(?:javascript|data|vbscript):", value, re.I):
                raise ValueError("Unsupported URL protocol in Canvas fragment")
            if name == "target" and value not in (None, "", "_self"):
                raise ValueError("Course navigation must remain inside Canvas")
        if tag in self.styles:
            attrs["style"] = _merge_styles(attrs.get("style"), self.styles[tag])
        if tag in {"h2", "h3", "h4"}:
            if tag == "h2" and attrs.get("data-course-heading") == "title":
                attrs["style"] = _merge_styles(attrs.get("style"), _title_style(self.theme))
            attrs.setdefault("data-course-heading", "true")
        if tag == "a" and attrs.get("data-course-action") == "primary":
            attrs["style"] = _merge_styles(attrs.get("style"), _primary_link_style(self.theme))
        serialized = "".join(
            f' {name}' if value is None else f' {name}="{escape(str(value), quote=True)}"'
            for name, value in attrs.items()
        )
        self.parts.append(f"<{tag}{serialized}{' /' if closed else ''}>")
        if tag in {"h2", "h3", "h4"} and not closed:
            self.headings.append((tag, len(self.parts)))

    def handle_starttag(self, tag, attrs):
        self._start(tag, attrs)

    def handle_startendtag(self, tag, attrs):
        self._start(tag, attrs, closed=True)

    def handle_endtag(self, tag):
        if tag in self.PROHIBITED_TAGS:
            raise ValueError(f"Canvas authored fragment cannot contain </{tag}>")
        if self.headings and self.headings[-1][0] == tag:
            _, start = self.headings.pop()
            self.parts[start:] = [_semantic_heading("".join(self.parts[start:]))]
        self.parts.append(f"</{tag}>")

    def handle_data(self, data):
        self.parts.append(data)

    def handle_entityref(self, name):
        self.parts.append(f"&{name};")

    def handle_charref(self, name):
        self.parts.append(f"&#{name};")

    def handle_decl(self, decl):
        raise ValueError("Pass a body fragment, not a complete HTML document")


def style_fragment(body, *, theme=None):
    """Apply inline component styles without changing trusted semantic content."""
    parser = _InlineThemeParser(THEME if theme is None else theme)
    parser.feed(body)
    parser.close()
    return "".join(parser.parts)


def wrap_content(body, *, eyebrow=None, title=None, lead=None, compact=False, theme=None):
    """Return a complete themed body fragment, never a document or native form.

    Header values are plain text and escaped. ``body`` is trusted source HTML.
    Use compact=True for the thin wrapper around an embedded lesson.
    """
    theme = THEME if theme is None else theme
    outer = _style(max_width="912px", margin="0 auto", padding="16px 24px" if compact else "24px", background_color=theme["paper"], color=theme["ink"], font_family=BODY_FONT, font_size="17px", line_height="1.7", word_wrap="break-word")
    header = []
    if eyebrow:
        label_style = _style(font_size="0.9rem", font_weight="bold", color=theme["link"], margin="0 0 12px")
        header.append(f'<p style="{escape(label_style, quote=True)}">{escape(str(eyebrow))}</p>')
    if title:
        title_style = _title_style(theme)
        header.append(f'<h2 style="{escape(title_style, quote=True)}" data-course-heading="title"><strong>{escape(str(title))}</strong></h2>')
    if lead:
        lead_style = _style(font_size="1.05rem", line_height="1.6", color=theme["muted"], margin="0 0 24px")
        header.append(f'<p style="{escape(lead_style, quote=True)}">{escape(str(lead))}</p>')
    return (f'<div data-course-theme="{THEME_VERSION}" style="{escape(outer, quote=True)}">'
            + "".join(header) + style_fragment(body, theme=theme) + "</div>")


def primary_link(href, label, *, theme=None):
    """The course's one primary action as a real, same-Canvas navigation link."""
    if not (href.startswith("/") and not href.startswith("//")) and not href.startswith("#"):
        raise ValueError("Primary course action must use a Canvas-relative path or anchor")
    return style_fragment(
        f'<a data-course-action="primary" href="{escape(href, quote=True)}">{escape(str(label))}</a>',
        theme=theme,
    )


def render_criteria(criteria, *, theme=None):
    """Readable evidence anchors, separate from Canvas's native scored rubric."""
    theme = THEME if theme is None else theme
    card = _style(margin="16px 0", padding="20px", border=f"1px solid {theme['line']}", border_radius="10px", background_color=theme["surface"])
    parts = []
    for criterion in criteria:
        parts.append(
            f'<section style="{escape(card, quote=True)}">'
            f'<h4>{escape(str(criterion["criterion"]))} · {escape(str(criterion["weight"]))} points</h4>'
            f'<p><strong>Meets the goal:</strong> {escape(str(criterion["meets"]))}</p>'
            f'<p><strong>Stronger evidence:</strong> {escape(str(criterion["strong"]))}</p></section>'
        )
    return style_fragment("".join(parts), theme=theme)
