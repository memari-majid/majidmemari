# Building AI Solutions review and maintenance guide

The live course is [Building AI Solutions](https://www.majidmemari.com/teaching/ai-solutions/), owned and taught by Majid Memari. It follows twelve units, one capstone, five milestones, and Learn → Try → Build → Finish. Students use business evidence and existing AI tools; programming is not required.

## For an AI reviewer

Start with the [review brief](review-brief.md). Inspect the live learner path before relying on previous judgments. Then use the [instructional design](instructional-design.md), [source map](source-map.md), [site maintenance guide](site-maintenance.md), and [validation record](development-and-validation.md) to compare intent, source, and observed behavior. Return prioritized findings with exact locations, learner consequences, proposed changes, and acceptance checks.

[Reference analysis](reference-analysis.md), the [complete simulation study](reference-study/README.md), [textbook research](textbook-selection.md), and [independent visual QA](visual-qa-review.md) provide supporting evidence. They do not prove current availability or learning effectiveness. Historical source directories and private records are not required review inputs.

## Applying the simulation study

The [simulation application plan](simulation-application-plan.md) maps the reference patterns into five existing Try activities: discovery evidence, human authority, fair testing, pilot denominators, and capacity versus cash. Learners predict, explore linked evidence, commit a recommendation, inspect a challenge, and retain or revise the decision before transferring the result to their capstone. Complete worked comparisons remain in authored HTML for reading, printing, and the course TA. The plan describes intended behavior; the [validation record](development-and-validation.md) records the checks actually completed.

The [reference-study directory](reference-study/README.md) preserves six original case-study analyses, a build handbook, visual conventions, a worked example, review instructions, and explicit coverage ledgers. It is independent research documentation, not a copy of the reference application's source or question bank, not required student reading, and not an input to the course TA. Its manifest hashes the mirrored artifacts after link adaptation.

## Source and mirror ownership

This directory mirrors course documentation so the hosting repository can be understood on its own. The canonical course source and documents are maintained at:

```text
/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/
```

The directory name is historical and does not define the public course identity. Consult the dated validation record and current Git history for the source and release being reviewed. If that local path is unavailable, request the current course source from the owner; do not infer it from historical generated pages. Edit canonical documents first, then refresh these mirrors and their relative links. This directory does not contain the editable lesson generator.

The personal-site repository owns the hosting application and online TA:

- [Course synchronization](../../scripts/sync-ai-course.mjs) validates and copies built public files, records checksums, and rebuilds the TA corpus.
- [Public course snapshot](../../public/teaching/ai-solutions/) is generated from the canonical course; do not edit it as the lesson source.
- [Release manifest](../../content/ai-solutions-release.json) records public file hashes.
- [TA maintenance guide](../../lib/course-kb/README.md) documents retrieval, the API, storage, limits, and tests.
- [KB builder](../../scripts/build-course-kb.mjs) extracts public course HTML. It does not ingest these review instructions or private records.

Use a clean checkout or worktree for a release. Inspect current Git status and remote history before publishing; preserve concurrent personal-site work. The dated validation record identifies the tested course release. Future production changes must be checked separately.

The course TA, general website chatbot, and workshop TA are separate services. The static course and workbook can be used without the online course TA.
