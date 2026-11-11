# Canvas handoff artifacts

This documentation and public-artifact mirror is maintained from canonical commit `0c6ae40ccd53af9cfe096adf54d4a62768482078` at `/private/tmp/verified-textbook-source-0c6ae40c/courses/cs4720R/integrations/canvas/`. It is not an input to the personal website build, public course snapshot, or TA corpus. Edit canonical source first; do not maintain another course generator here.

- [Integration guide](../canvas-integration.md), [asynchronous design](../canvas-async-design.md), [theme plan](../canvas-theme-plan.md), and [live installation record](../canvas-live-integration.md) describe source intent and actual receiving-instance evidence separately.
- [Required textbook plan](../textbook-recommendation.md), [academic source policy](../academic-source-policy.md), and [claim/source map](../claim-source-map.md) document the free AI/business/quantitative foundation, exact scopes, and limits.
- [Cartridge](building-ai-solutions-canvas.imscc), [mapping](mapping.json), and [verification metadata](live-verification.json) accompany the native structure: twelve modules, twelve quizzes with choice questions and an existing zero-point project response, milestone assignments and individual exam, discussions, editable templates, and progress requirements. Consult the current live record for exact counts and receiving IDs.
- Source-reference copies: [builder](build_package.py), [public questions/exam case](async_content.py), [guide/templates renderer](async_guide.py), and [theme renderer](theme.py). [Theme tests](test_theme.py), [guide tests](test_async_guide.py), and [package tests](test_package.py) are each linked once. These are byte-for-byte source snapshots; their canonical layout dependencies mean the full Canvas workflow must run in the owning course checkout.
- [Required-reading source](../course-source/textbook_readings.py), [reading tests](../course-source/test_textbook_readings.py), and [reader-loading tests](../course-source/test_textbook_readers.cjs) are mirrored under [course-source](../course-source/README.md), with their local JavaScript dependency. These documentation snapshots are not runtime assets.
- [Spring 2027 offering](offerings/spring-2027/README.md) keeps dated schedule sources separate from the undated course runtime. [Saved Home](canvas-home.html) and [Syllabus](canvas-syllabus.html) are receiving-specific source fragments; they are not proof of a live UI save.
- Public UI/evidence files in `evidence/` are dated instructor or approved test-session records, not real learner submissions. Instructor-only marking material, account evidence, private operations, and learner data are excluded.

## Current reusable package

The package copied with this mirror has SHA-256 `cd5dbe6c8a62a490d3845ca3e6eacfc7b3fefc9e40b8f7e2dbd74e3804e544c6`. Its source commit and checksum identify the portable artifact; they do not establish import, a native UI update, grading behavior, or a production release. Use the [live record](../canvas-live-integration.md) for whether the package was imported or native content was updated in place, historical import notices, preserved grades and settings, current release identities, and the limits of actual tests.

## Textbook delivery evidence

- [canvas-ai-textbook-reader.png](evidence/canvas-ai-textbook-reader.png)
- [canvas-ai-textbook-student-view.png](evidence/canvas-ai-textbook-student-view.png)
- [canvas-business-textbook-reader.png](evidence/canvas-business-textbook-reader.png)
- [canvas-statistics-textbook-reader.png](evidence/canvas-statistics-textbook-reader.png)
- [canvas-textbook-ta.png](evidence/canvas-textbook-ta.png)
- [canvas-textbook-verification.json](evidence/canvas-textbook-verification.json)
- [textbook-public-release.json](evidence/textbook-public-release.json)
- [textbook-source-reproducibility.json](evidence/textbook-source-reproducibility.json)

The official books remain on author/publisher servers. Assignment metadata, course connections, and application prompts belong to this course. Do not copy textbook chapters into the TA or portable package. Browser/source checks do not establish learner effectiveness.
