# Building AI Solutions review and maintenance guide

The live course is [Building AI Solutions](https://www.majidmemari.com/teaching/ai-solutions/), owned and taught by Majid Memari. It follows twelve units, one capstone, five milestones, and Learn → Try → Build → Finish. Students use business evidence and existing AI tools; programming is not required.

## For an AI reviewer

Start with the [review brief](review-brief.md). Inspect the live learner path before relying on previous judgments. Then use the [instructional design](instructional-design.md), [source map](source-map.md), [site maintenance guide](site-maintenance.md), and [validation record](development-and-validation.md) to compare intent, source, and observed behavior. Return prioritized findings with exact locations, learner consequences, proposed changes, and acceptance checks.

[Reference analysis](reference-analysis.md), [textbook research](textbook-selection.md), and [independent visual QA](visual-qa-review.md) provide supporting evidence. They do not prove current availability or learning effectiveness. Historical source directories and private records are not required review inputs.

## Source and mirror ownership

This directory mirrors course documentation so the hosting repository can be understood on its own. The canonical course source and documents are maintained at:

```text
/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/
```

The organized canonical source and review documents are recorded in local course-repository commit `8860406`. The directory name is historical and does not define the public course identity. If that local path is unavailable, request the current course source from the owner; do not infer it from historical generated pages. Edit canonical documents first, then refresh these mirrors and their relative links. This directory does not contain the editable lesson generator.

The personal-site repository owns the hosting application and online TA:

- [Course synchronization](../../scripts/sync-ai-course.mjs) validates and copies built public files, records checksums, and rebuilds the TA corpus.
- [Public course snapshot](../../public/teaching/ai-solutions/) is generated from the canonical course; do not edit it as the lesson source.
- [Release manifest](../../content/ai-solutions-release.json) records public file hashes.
- [TA maintenance guide](../../lib/course-kb/README.md) documents retrieval, the API, storage, limits, and tests.
- [KB builder](../../scripts/build-course-kb.mjs) extracts public course HTML. It does not ingest these review instructions or private records.

Use a clean checkout or worktree for a release. Inspect current Git status and remote history before publishing; preserve concurrent personal-site work. The dated validation record identifies the tested course release. Future production changes must be checked separately.

The course TA, general website chatbot, and workshop TA are separate services. The static course and workbook can be used without the online course TA.
