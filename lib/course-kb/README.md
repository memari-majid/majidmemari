# Building AI Solutions teaching assistant

This assistant follows the workshop TA architecture: local public course chunks → deterministic lexical retrieval → server teaching prompt → AI SDK/Gateway stream. It has no web browsing, external actions, private records, learner-workbook access, vector database or embedding service. Start with the [course source and review guide](../../docs/ai-solutions/README.md) for the relationship between editable curriculum, public output, and the live course.

## Updating the course evidence

After syncing the course into `public/teaching/ai-solutions`, run:

```sh
node scripts/build-course-kb.mjs
node --test scripts/test-course-kb.mjs
```

The builder reads an explicit allowlist of 24 public HTML pages: twelve units, five milestones, and seven supporting pages. It extracts main content, existing section anchors, table rows, rubrics, knowledge-check explanations, and the static worked explanations for the visual activities. It excludes navigation, note inputs, and retired redirect pages. Required simulation facts and reasoning must remain in the authored HTML.

`assets/practice.js` and `assets/lesson-figures.js` are included in the content digest for freshness. The builder does not execute these scripts or parse their models into retrieval chunks. It cannot observe a learner’s changed figure controls. Required public files must be regular files, and incomplete course snapshots fail the build. No private teaching directory or `AI_REVIEW_BRIEF` is read. Commit the generated TypeScript corpus and its digest with the public snapshot. Regenerate before the Next.js build; retrieval does not read mutable files during a learner request.

The model sees at most six relevant chunks / 14,500 excerpt characters. Short conversational follow-ups include recent discussion as a retrieval query, not as trusted evidence. Explicit course-navigation questions have a local orientation route; unrelated questions receive an evidence-gap response without calling a model. Only server-selected course URLs appear as source parts. They are retrieved references; they do not guarantee that every generated sentence is correct.

## API contract

`POST /api/course-chat` accepts `{ messages: UIMessage[], lesson?: string }`. The optional `lesson` field is a current-page filename such as `unit-06.html`; `normalizeCoursePage` accepts only the current unit, milestone, and supporting-page allowlist. The embedded UI supplies the open lesson, which guides retrieval and the teaching prompt without implying access to the learner’s private work. User parts must be text. Assistant text is accepted for context; persisted `source-url` and `step-start` parts are discarded before generation. Client system/tool/file messages are rejected. Maximums: 16 messages, 4,000 characters per user message, 8,000 per assistant message, 20,000 total text characters, 48 KiB JSON body, 3,000 output tokens and 50 seconds of generation. The prompt still requests concise 150–300-word explanations; the larger token ceiling leaves room for complete numerical tables and any provider reasoning tokens. The browser-safe `prepareCourseHistory` keeps a text-only suffix within all these limits (including UTF-8 serialized bytes), omits failed/source-only assistant messages, and leaves complete displayed messages and source citations in UI state. Responses use AI SDK 6 UI-message SSE, with native persistent `{type: 'source-url', sourceId, title, url}` parts. The final event adds native `messageMetadata.finishReason`; the UI shows a visible notice for a length limit, abnormal completion, abort or disconnect instead of silently presenting the partial answer as finished. Input and gate errors return JSON `{error}`; provider stream errors use a sanitized generic message. No raw provider error or credential is returned or logged by this handler.

The teaching prompt instructs the assistant to coach students through their own work, use business language and numerical examples, and avoid fabricating interviews, testing, demand, grades or deployments. It also instructs the assistant not to supply an entire assessed capstone for submission. Course excerpts are reference data beneath the server teaching rules.

## Conversation and workbook storage

The browser restores a bounded conversation from `sessionStorage` under `ai-solutions-ta-conversation`. A same-tab reload can retain messages, legitimate course citations, and completion metadata. Restoration finishes before an empty initial render may save. **New conversation** clears the saved conversation and displayed messages. If browser storage is blocked, the UI reports that reload restoration may be unavailable; this is not cross-device synchronization or an instructor transcript store.

The course workbook is separate: its notes and progress use local storage and its own backup/restore controls. The TA neither reads that workbook nor receives its notes automatically. Questions, the bounded recent conversation, the current lesson, and retrieved public excerpts are processed by the online service; provider processing and logs may apply. Do not enter confidential partner information or student records. The optional access code remains in memory rather than persisted conversation storage.

## Configuration and cost controls

- `COURSE_TA_MODEL` overrides the course model; otherwise `WORKSHOP_TA_MODEL` is reused. The fallback is `anthropic/claude-haiku-5.5`, verified in the live Gateway model catalog at `https://ai-gateway.vercel.sh/v1/models` on 2026-11-10. Implementation and streaming tests use the installed AI SDK 6 bundled documentation/source and its `MockLanguageModelV3`; the lockfile records the installed patch version.
- Gateway credentials follow the existing workshop integration: server-side Vercel OIDC or `AI_GATEWAY_API_KEY`. No credential belongs in a browser variable.
- Optional `COURSE_TA_CODE` gates requests using the `x-course-code` header. If absent/empty, the assistant is public. The UI must not persist this code in long-lived local storage.
- Each function instance allows 8 requests per client hint per 10 minutes, 120 total requests per 10 minutes, four simultaneous generations and at most 1,000 remembered client entries. Expiring leases prevent an abandoned stream retaining a slot indefinitely. Same-origin browser requests are checked; clients without Origin are still allowed.

**These in-memory controls are best-effort per process.** Cold starts and parallel serverless instances have separate counters; a proxy IP is not verified identity. These controls are neither a distributed rate limit nor a hard spending ceiling. Use Gateway/platform budget controls or a shared limiter if stronger deployment-wide controls become necessary. An optional course code reduces casual access but is not individual authentication. No paid persistence dependency was added.

## Validation scope

Tests check complete generated coverage, table/anchor extraction, retrieval of static visual explanations, relevant and irrelevant retrieval, follow-up resolution, current-lesson context, safe session restoration, source existence, prompt boundaries, malformed/oversized requests, role isolation, access/lease limits, and actual AI SDK streaming with mocked providers. The mock tests verify source persistence, output-token settings and sanitized failures without consuming paid generation. Production model availability and answer quality still require a live smoke test; deterministic tests do not prove a model will always follow the teaching prompt.
