# One visual language for Canvas and the course

Status: plan and initial helper implemented, 2026-11-11. The source audit and shared renderer change no live runtime, imported assignment, grade, submission, or Canvas setting by themselves. The user has requested a complete asynchronous course and consistent styling across Canvas and the personal website. This plan covers the authored course surfaces; the asynchronous learning design is a separate, coordinated content task.

**Current delivery refinement:** the user subsequently requested that the embedded lesson match Canvas's native white background and not appear as a separate page. Theme version `building-ai-solutions-2` therefore reads `paper` and `surface` overrides of `#ffffff` from the course's `delivery=canvas` CSS profile. The authored Canvas wrapper and embedded lesson share that white surface; navy, teal, type families, and meaningful figure colors remain consistent. The standalone website retains its warm-paper palette. The original palette observations below remain an audit trail, not an instruction to restore a cream Canvas panel. Final live verification is recorded separately.

## Outcome and boundaries

Use the existing **Building AI Solutions** visual language on every authored Canvas page, reading, assignment description, assessment explanation, and discussion introduction. A learner should recognize the same course before, inside, and after a simulation. Preserve the single ordered Canvas path and the lesson's Learn → Try → Build → Finish sequence.

Canvas keeps its own navigation, native submission editor, quiz controls, rubric interface, grades, feedback, and accessibility controls. No account-level theme change, global CSS injection, native-control imitation, or browser extension is needed. An embedded lesson retains the existing `?delivery=canvas` profile and integrated course TA. This profile already removes personal-site navigation and routes the learner to the Canvas check-in.

The audience remains everyone, from any discipline, with no prerequisites. The visible identity is **Building AI Solutions by Majid Memari**. Institutional policy content belongs to the receiving offering and is kept separate from the portable course identity.

## Evidence inspected and current gaps

| Surface | Observed source state | Required treatment |
|---|---|---|
| Vercel lesson and figures | [core.css](course-source/assets/core.css) defines the warm paper/navy/teal system; Canvas profile uses the same assets and a 960px lesson width. | Keep the existing palette, interactive semantics, four stages, and TA. Do not restyle or rebuild simulations for this task. |
| Canvas Home | [canvas-home.html](canvas/canvas-home.html) uses navy correctly but substitutes `#f7f4ec` and `#167d8d`; it has no explicit course body/heading font stack and largely unstyled tables. | Render the same tokens, typography, action treatment, spacing, and table pattern as the lesson. Keep one primary Start/Continue action. |
| Native lesson wrapper | `lesson_page_html()` in [build_package.py](canvas/build_package.py) emits unstyled introduction and closing paragraphs around the correctly embedded lesson. | Apply a compact shared wrapper; keep the lesson iframe visually continuous with the wrapper, rather than adding another large hero or duplicate navigation. |
| Twelve check-ins | `checkin_html()` emits default heading, paragraphs, and an ordered list. | Use a recognizable check-in header, concise task list, one submission explanation, and a clearly labeled formative-status note. Native submission fields remain below. |
| Five milestones | `assignment_html()` emits a default brief/checklist and a wide four-column rubric table. | Use the shared brief/checklist pattern and readable evidence criteria. Preserve all canonical wording, weights, and native rubric associations. |
| Optional discussion | `add_discussion()` emits three unstyled paragraphs. | Use the same wrapper and section hierarchy, while keeping optional/ungraded status prominent and Canvas's reply controls native. |
| Syllabus | [canvas-syllabus.html](canvas/canvas-syllabus.html) mixes default content, custom older sections, and repeated hard-coded table styles. | Render a common shell and section/table patterns. Reconcile old offering details with the new asynchronous design as a content change, not a cosmetic substitution. |
| Future reading / quiz introduction / feedback | No common native HTML renderer exists yet. | Use the same renderer for authored text. Native quiz and rubric widgets retain their platform presentation. |

The retained syllabus currently names an in-person modality and a weekly meeting time. The asynchronous authoring owner must reconcile those fields and any delivery-dependent promises before release. Existing policies, deadlines, grading rules, or required institutional notices must not silently change merely because the template changes.

The initial observations above are a source audit. The root agent's subsequent November 11 Home preflight retained the palette, system/Georgia font stacks, 17px body, 1.7 line height, and primary action colors, but stripped both numeric `font-weight:600` and `font-weight:bold`, as well as `box-sizing` and `overflow-wrap`. The root verified that the revised 912px content maximum plus 48px horizontal padding produces an actual 960px outer width. A direct saved-HTML test also verified that semantic `<strong>` inside a heading survives and provides the intended emphasis. The helper therefore wraps all h2/h3/h4 contents, including the course title, in one semantic strong envelope; it preserves child markup and detects an existing envelope so repeat rendering does not accumulate wrappers, even without its data marker. Complete package rendering and learner flows still need the release checks below. Earlier screenshots in [LIVE_INTEGRATION.md](canvas-live-integration.md) demonstrate the previous installation, not the complete proposed theme.

## Exact shared tokens

`site/assets/core.css` is the current source of visual truth. Do not invent a second palette or use institution colors. These are the actual current tokens, with two existing supporting colors used by the course:

| Token / existing value | Meaning and allowed use in authored Canvas content |
|---|---|
| Base `paper` — `#f7f6f2`; Canvas override `#ffffff` | Standalone warm background; native and embedded Canvas reading surfaces use white. |
| Base `surface` — `#fffefb`; Canvas override `#ffffff` | Standalone warm cards; native and embedded Canvas cards/table cells use the white profile. |
| `ink` — `#243249` | Main explanatory text, calculations, labels. |
| `navy` — `#182a46` | Headings and primary action backgrounds. |
| `muted` — `#536176` | Secondary explanations, captions, metadata; not disabled or hidden content. |
| `line` — `#d8dfe7` | Dividers and card/table borders; never the only cue for a required action. |
| `teal` — `#007f7a` | Course accent, guidance border, and figure treatment already established by the course. |
| Existing link color — `#086b73` | Underlined text links and small accent text on paper. |
| `blue` — `#2563eb` | Existing interactive/focus color inside the lesson. Do not remove native Canvas focus styling. |
| `amber` — `#c98316` | Uncertainty / caution marker with an explicit text label; not ordinary text on paper. |
| `loss` — `#b42318` | Material error or loss when relevant, with an explicit label; not a generic decorative accent. |
| Existing guidance tint — `#edf5f2` | Brief project/help note background, already present in Canvas-mode lesson styling. |

Do not imply that a teal box means a learner passed an assessment. Simulation colors continue to identify baseline, changed case, current selection, decision boundary, error, or uncertainty according to their visible legends. Every meaning needs words, symbols, or line/shape differences as well as color.

Calculated sRGB contrast against the original standalone `paper` is 11.93:1 for ink, 13.31:1 for navy, 5.82:1 for muted, 5.78:1 for the existing link color, and 6.08:1 for loss. The exact teal/standalone-paper ratio is **4.4986:1**, just below the normal-text 4.5:1 threshold; the darker link color remains the consistent small-label treatment in both profiles. Teal/base-surface is 4.82:1. Amber/base-paper is 2.88:1; pair an amber accent with ink text and do not use amber as normal-text color. These original palette calculations are not a complete accessibility audit or a measured contrast report for every current Canvas surface.

## Typography and spacing contract

Use explicit inline values within the authored content container so Canvas's surrounding type styles do not accidentally change the course. Values are adapted to the embedded reading context; the website's large homepage hero does not need to be repeated inside Canvas.

| Element | Shared Canvas value | Relationship to Vercel |
|---|---|---|
| Content width | `max-width:912px; margin:0 auto`, with 24px padding on each side | Effective maximum 960px, matching the current lesson width without relying on stripped `box-sizing`. |
| Outer padding | `24px`, with simple fluid width and no fixed minimum width | Matches Canvas-mode header and guidance padding; test at narrow width. |
| Body | `font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:17px; line-height:1.7; color:#243249` | Exact body family, size, and rhythm in core.css. |
| Main authored section heading | Georgia/Times serif; `2rem`; semantic `<strong>` around the contents; line height `1.2`; navy; margin `0 0 16px` | Existing serif heading family, compact scale. Emphasis survives the receiving sanitizer through semantic markup rather than a font-weight declaration. |
| Subsequent section heading | Georgia/Times serif; `1.7rem`; semantic strong contents; line height `1.2`; margin `32px 0 16px` | Within the existing responsive h2 scale. |
| Task subheading | System stack, `1.15rem`, semantic strong contents, line height `1.35`, navy, margin `24px 0 12px` | Existing h3 scale with verified semantic emphasis. |
| Metadata / caption | System stack, `0.9rem`, line height `1.6`, muted | Readable secondary text rather than miniature labels. |
| Paragraph | `margin:0 0 1.15em` | Exact paragraph rhythm. |
| Spacing steps | `4 / 8 / 12 / 16 / 24 / 32px` | Reuses course dimensions; avoids one-off decorative gaps. |
| Card | Surface fill; `1px solid #d8dfe7`; `border-radius:10px`; `padding:20px`; no required shadow | Matches the Canvas Finish card. |
| Primary course link | Navy fill, white text, `13px 23px` padding, `9px` radius, inline-block, clear label; no fixed height | About 48px at the standard type size, without `min-height` unexpectedly adding another padding-height increment when `box-sizing` is stripped. A genuine Canvas link, not a simulated button. |
| Ordinary links | `#086b73`, underlined; no `target="_blank"` | Keeps recognizable links and stays in Canvas. |
| Table | Full available width, collapsed borders, captions and scoped headers, `12px` cells, left-aligned descriptions, numbers right-aligned where useful | Same readable data-first approach; no tables for general page layout. |

Canvas supplies the page title as its own heading. Begin the authored body with a short unit/type label and `h2` sections, then `h3`/`h4` as needed. Avoid a duplicate large page title or a second `h1`. On Home, the authored hero can supply the distinctive course statement as `h2`. A native rubric's criterion text is still platform text; only the authored explanation around it uses this typography.

Use a single-column reading layout. Do not require CSS grid, fixed heights for prose, absolute positioning, remote web fonts, or custom scripts in Canvas HTML. Keep the existing iframe title and responsive 100% width. The current 1000px iframe height remains an implementation constraint to test for nested scrolling; do not conceal overflow or clip simulation/TA content to imitate a seamless page.

## Common authored components

1. **Course panel.** White Canvas outer container, system text, one content-width constraint. No redundant logo, university name, course number, personal-site navigation, or website chatbot.
2. **Context line.** For example, “Unit 06 · Check-in” or “Milestone 3 · After Unit 7,” with optional verified duration only. Completion claims never come from a colored badge.
3. **Purpose.** One short sentence explaining what the learner will decide or produce. Do not repeat the full page title or fill the screen with administration.
4. **Task section.** Plain numbered steps or a short checklist. Use real headings and lists so the content remains meaningful without styling.
5. **Evidence/example block.** Surface card with an explicit label such as “Worked example,” “Your evidence,” or “Evidence limit.” Figures require caption, key numbers/table, and explanatory takeaway. Preserve original/supplied/observed labels.
6. **Submission note.** One bounded note explaining where to submit, what to include, and how feedback is returned. Canvas remains authoritative; a simulation export alone does not submit work.
7. **Continue cue.** Text stating the next Canvas item. The native Canvas Next button controls the path. Home's Start/Continue action may use the current native module item URL; generated portable pages do not hard-code a receiving course ID.

Specific applications:

- **Lesson:** a compact purpose/sequence note, existing iframe, then one short Canvas continuation note. No duplicate Learn/Try/Build/Finish controls outside the iframe.
- **Check-in:** purpose, three existing response prompts, submission note, clear zero-point/Complete-Incomplete status. Preserve the explanatory evidence requirement.
- **Milestone:** purpose, artifact/brief, checklist, evidence criteria, submission note. For long criteria, prefer a linear list of criterion cards: heading with points, “Meets the goal,” and “Stronger evidence.” This retains all content without forcing a four-column reading table onto a phone. Native scored rubric and points stay unchanged.
- **Reading:** purpose, original explanatory text or permitted material, figure/table when useful, short interpretation prompt, source label, next Canvas action. Do not reproduce unlicensed full text, add an external-navigation dependency, or introduce a separate reading dashboard.
- **Quiz/feedback introduction:** concise purpose, attempt/feedback instructions supplied by the assessment owner, and the same evidence-limit note where relevant. Native questions and controls remain native. Do not infer quiz policy from color or invent grade rules.
- **Discussion:** purpose, what to include, constructive reply structure, and optional/ungraded label. Keep the existing privacy and Canvas Inbox guidance.
- **Syllabus:** shared heading/table system with compact course path, assessment, communication, materials, accessibility, and current-offering policy sections. The content owner resolves asynchronous delivery details before upload.

## Implementation proposal and source ownership

The Python-standard-library helper [theme.py](canvas/theme.py) is implemented for use by the package builder and Home/Syllabus generation. Its eight focused [tests](canvas/test_theme.py) cover source-token drift, header escaping, semantic/table and iframe preservation, rejected scripts/forms/escape links, the primary action's contrast, all current milestone briefs and evidence criteria, and idempotent heading emphasis with child markup and missing data markers. Package adoption, remaining live sanitizer retention, mobile layout, and actual Canvas appearance still require the release checks below.

Implemented interface:

```python
theme = load_course_theme(course_root / "site/assets/core.css")
wrap_content(body, eyebrow=None, title=None, lead=None, compact=False, theme=theme)
style_fragment(body, theme=theme)
primary_link("/courses/123/modules/items/456", "Start Unit 1 →", theme=theme)
render_criteria(criteria, theme=theme)  # readable static anchors; no grade changes
```

`body` is trusted authored HTML; header strings and action labels are escaped plain text. `wrap_content` returns a body fragment, not a full document. The existing package builder remains responsible for document/title/metadata envelopes. Use `compact=True` around embedded lessons. `primary_link` supplies the navy action with white text and remains correct when passed through `wrap_content`; ordinary links keep the darker underlined link treatment. The helper exports `THEME`, `THEME_VERSION`, `BODY_FONT`, and `HEADING_FONT` for source-owned rendering when needed.

- Read the named colors from the single `:root` token block in canonical `core.css`, then apply its `delivery=canvas` profile overrides, validate required names and hex values, and emit literal inline CSS values. A missing or renamed required token fails the build. The existing dark link color and guidance tint are explicit shared supporting constants checked against core.css until promoted into its token block in a separately scoped runtime change.
- Keep typography/spacing in one helper structure with a theme version. A future common token file can generate both CSS and Canvas HTML, but migrating the website theme is unnecessary for this release.
- Escape plain text and attributes. For trusted canonical brief HTML, use a deterministic HTML parser to apply the component's inline styles to supported elements; do not perform blanket regular-expression replacements or strip semantic attributes. Preserve lists, mathematical content, captions, and heading order.
- Emit fragments for discussion/assignment descriptions and complete documents for cartridge resources as required by the existing builder. Never include a `style`, `script`, or external stylesheet element in an authored Canvas description.
- Apply through `lesson_page_html`, `checkin_html`, `assignment_html`, and `add_discussion`. New readings/quiz feedback must call the same helper instead of duplicating style strings.
- Keep native rubric criterion descriptions plain and meaningful. Canvas may render these in separate widgets and restrict markup; their visual presentation cannot be guaranteed by a body wrapper. The matching authored criteria explanation uses the shared component.
- Keep source templates for Home and Syllabus alongside the helper or add explicit helper calls to a source-owned render step. Preserve current destination-specific IDs outside the portable package. Do not include institution-specific homepage/syllabus overrides in the cartridge.
- Preserve all migration identifiers, module positions, requirement types, points, grade weights, allowed submission types, rubric associations, optional discussion status, and absence of dates. A theme change must not alter assessment semantics.
- Rebuild the cartridge, update its mapping/hash and evidence record, and mirror documents to the hosting repository only after source validation. No TA corpus refresh is needed solely for color/spacing changes; content changes may require the usual curriculum/TA synchronization.

Canvas accepts selected HTML elements and inline style properties, and can remove unsupported content on save. The current official allowlist includes the semantic elements, iframe attributes, font/color/spacing/border properties used here. This supports the proposal, but does not prove the receiving instance will retain every value. Save, reopen the HTML editor, and compare the retained content before broad import. [Official Canvas HTML Editor Allowlist](https://community.instructure.com/en/kb/articles/387066-canvas-html-editor-allowlist) (checked 2026-11-11).

The design intentionally depends on a conservative subset: `div`, `p`, headings, semantic lists, `strong`/`em`, links, captions/tables, and the existing iframe; color/background, font, spacing, width/max-width, border/radius, and text alignment. Native rubrics and platform controls are outside that subset and outside this theme helper's authority.

## Release sequence and acceptance checks

| Step | Deliverable | Approximate focused effort |
|---|---|---:|
| 1. Implement tokens and reusable renderer | One helper; theme application to four existing resource functions; portable output preserved | 45–75 minutes |
| 2. Author Home/Syllabus and asynchronous surfaces | Shared wrappers for owner-approved content, reading and quiz intro fragments | 30–60 minutes for templates, plus separately scoped content authoring |
| 3. Validate generated outputs | Source checks, HTML preservation, content/ID/grade parity, deterministic cartridge rebuild | 30–45 minutes |
| 4. Pilot save/import and inspect | One check-in/milestone/lesson, sanitized HTML, desktop and narrow browser inspection | 30–60 minutes, depending on Canvas response |
| 5. Apply and verify course-wide | Safe reimport/update, representative Student View flow, screenshots and record | 30–60 minutes |

Estimated template implementation and verification: **about 3–5 focused hours**, excluding substantive asynchronous course writing, quiz development, institutional policy decisions, and learner testing. This is a planning range, not a deadline or evidence that the course is ready to teach asynchronously.

Required source/package checks:

- Every authored resource uses the same theme version and required wrapper; all expected resource types are covered.
- Generated colors match canonical tokens; no old `#167d8d`/`#f7f4ec` palette remains in newly rendered content.
- Captions, table scopes, headings, source labels, and criteria text remain present. Check content text parity, not exact HTML byte parity, when replacing the wide rubric explanation with cards.
- No external new-tab navigation, script/style tags, event handlers, forms, fake submit controls, fixed-position overlays, or instruction to leave Canvas appears in the wrapper.
- Existing structural checks still pass: 12 modules/pages, 12 formative check-ins, 5 milestones and rubrics, 29 requirements, correct weights, no dates or course-settings override, and safe deterministic ZIP output. Adjust counts only if the separately authorized asynchronous assessment design intentionally adds resources, then document that change.
- Root's public runtime and course TA remain untouched unless a separately scoped content update requires synchronization.

Required live checks after implementation:

- Canvas retains the intended inline colors/fonts/spacing after save and reopen; no text, criteria, or iframe is removed by sanitization.
- Home → lesson → Canvas Next → check-in → milestone is visually coherent, with one obvious next action and working native controls.
- Inspect a long rubric/assignment, a reading, optional discussion, syllabus, and any new quiz introduction. Native rubric scores and completion semantics remain unchanged.
- At 375px and desktop widths and at 200% zoom, text wraps, tables/criteria remain readable, and no card clips content. Check keyboard access to the iframe, lesson stage controls, TA dialog, and native submission controls; keep native focus indicators.
- Test sufficient text contrast, labels beyond color, high-contrast behavior where available, print readability, and reduced-motion lesson behavior. If the Canvas mobile app is not tested, document that limit.
- Observe a permitted fictional test submission/feedback flow only under the approved testing arrangement; do not manufacture or alter a real student's response or grade. Viewing styled pages does not verify grading or learner outcomes.

Record the actual results and remaining limits in [LIVE_INTEGRATION.md](canvas-live-integration.md) and [DEVELOPMENT_AND_VALIDATION.md](development-and-validation.md). Keep prior screenshots as dated evidence rather than presenting them as proof of the new theme.
