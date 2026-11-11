# Course source for local review

Public maintained source/test snapshots from canonical commit `2401790fb5c85435461268af9e780ee975126d12`. Canonical ownership: `/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/site/`. These copies support reading and review from the hosting repository; they are not inputs to its runtime build, public course snapshot, or TA corpus. Edit and run the full course/Canvas release workflow in the canonical checkout.

- [build_core.py](build_core.py)
- [build_site.py](build_site.py)
- [check_site.py](check_site.py)
- [course_content.py](course_content.py)
- [ta_activities.json](ta_activities.json)
- [test_delivery.cjs](test_delivery.cjs)
- [test_lesson_figures.cjs](test_lesson_figures.cjs)
- [test_practice.cjs](test_practice.cjs)
- [test_textbook_readers.cjs](test_textbook_readers.cjs)
- [test_textbook_readings.py](test_textbook_readings.py)
- [test_workbook.cjs](test_workbook.cjs)
- [textbook_readings.py](textbook_readings.py)
- [visual_lessons.py](visual_lessons.py)

`assets/` supplies the maintained public JavaScript/CSS dependencies, including `assets/site.js` for the reader-loading tests. `test-fixtures/` contains only fictional source fixtures. Generated `dist/`, archives, private data, credentials, instructor-only marking material, and learner notes are excluded.

The required-textbook metadata and tests contain original directions and bibliographic links, never publisher chapters. See [textbook plan](../textbook-recommendation.md), [academic source policy](../academic-source-policy.md), and [claim/source map](../claim-source-map.md). Source inspection is distinct from production and native Canvas verification.
