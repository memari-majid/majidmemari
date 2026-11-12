# Building AI Solutions AI Learning Companion

The Learning Companion supports exploration, practice and reflection. It follows the existing workshop retrieval architecture: local public course chunks → deterministic lexical retrieval → server teaching prompt → AI SDK/Gateway stream. It has no web browsing, external actions, private records, learner-workbook access, vector database or embedding service. Start with the [course source and review guide](../../docs/ai-solutions/README.md) for the relationship between editable curriculum, public output, and the live course.

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

The course workbook is separate: its notes and progress use local storage and its own backup/restore controls. The Learning Companion neither reads that workbook nor receives its notes automatically. Questions, the bounded recent conversation, the current lesson, and retrieved public excerpts are processed by the online service; provider processing and logs may apply. Do not enter confidential partner information or student records. The optional access code remains in memory rather than persisted conversation storage.

## Configuration and cost controls

- `COURSE_TA_MODEL` overrides the course model; otherwise `WORKSHOP_TA_MODEL` is reused. The fallback is `anthropic/claude-haiku-5.5`, verified in the live Gateway model catalog at `https://ai-gateway.vercel.sh/v1/models` on 2026-11-10. Implementation and streaming tests use the installed AI SDK 6 bundled documentation/source and its `MockLanguageModelV3`; the lockfile records the installed patch version.
- Gateway credentials follow the existing workshop integration: server-side Vercel OIDC or `AI_GATEWAY_API_KEY`. No credential belongs in a browser variable.
- Optional `COURSE_TA_CODE` gates requests using the `x-course-code` header. If absent/empty, the assistant is public. The UI must not persist this code in long-lived local storage.
- Each function instance allows 8 requests per client hint per 10 minutes, 120 total requests per 10 minutes, four simultaneous generations and at most 1,000 remembered client entries. Expiring leases prevent an abandoned stream retaining a slot indefinitely. Same-origin browser requests are checked; clients without Origin are still allowed.

**These in-memory controls are best-effort per process.** Cold starts and parallel serverless instances have separate counters; a proxy IP is not verified identity. These controls are neither a distributed rate limit nor a hard spending ceiling. Use Gateway/platform budget controls or a shared limiter if stronger deployment-wide controls become necessary. An optional course code reduces casual access but is not individual authentication. No paid persistence dependency was added.

## Validation scope

Tests check complete generated coverage, table/anchor extraction, retrieval of static visual explanations, relevant and irrelevant retrieval, follow-up resolution, current-lesson context, safe session restoration, source existence, prompt boundaries, malformed/oversized requests, role isolation, access/lease limits, and actual AI SDK streaming with mocked providers. The mock tests verify source persistence, output-token settings and sanitized failures without consuming paid generation. Production model availability and answer quality still require a live smoke test; deterministic tests do not prove a model will always follow the teaching prompt.


## Unit 4 workflow-run mode

The authored activity snapshot now has an explicit mode union. Eleven activities
retain the classic `decision-lab` mode (including the existing undefined-mode
compatibility), phase-safe coaching and their storage behavior. Unit 4 revision
2 is a `shift-run`: write at most six nonempty steps / 1,200 characters, rehearse
the same process against the supplied A/B requests, revise once with a reason of
at most 200 characters, then run the frozen second mapping against held-back C.
The ShiftRun panel has no conversational coach. The separate Course questions
mode remains available; structured classic-lab coaching requests for a shift
activity are rejected instead of interpreting fields from the wrong mode.

`POST /api/course-shift` receives only `{workflow, activityRevision: 2}` and the
optional in-memory `x-course-code` header. It classifies the written steps; it
does not rewrite them, generate a project answer or execute real actions. The
server's validated mapping feeds the pure `shift-run.ts` authored rehearsal.
There is no client-selected model, case, source card, grading setting or outcome
in that request. Source references and quoted wording remain visible for review.
Missing action categories are neutral interpretation information, not a required
checklist. Provider errors and invalid classifications offer an explicit student
classification route, labeled **steps classified by student**. The same engine
then applies the supplied consequences. No AI call is made for C.

The UI permits one online classification request for each of the two workflow
versions, persists that attempted marker before fetching, never retries
automatically and does not clear it when returning to the written draft. A 401
access-code rejection releases that marker because it occurs before generation.
On an interrupted/failed request, the written workflow and self-classification
route survive reload. API access/rate controls remain separate; the three-run
practice episode is a browser learning constraint, not identity verification, a
distributed quota or a spending ceiling.

The current revision uses the existing `learningStorageKeys(activity).record`
namespace with a separate strict `ShiftSession` wrapper. It stores its mode,
revision/page, validated immutable engine record, unsent workflow/reason,
self-classification draft and online-request markers. The first read does not
write an empty record. Unrecognized current-key data remain read-only and are not
automatically overwritten; starting over requires the learner to keep a copy and
explicitly confirm replacement. Every revision-1 Unit 4 record and conversation
is preserved as its original raw text in separate read-only copy/download views;
it is never copied into the new workflow, mapping or AI context. The other eleven
units retain the earlier pristine-record filtering and classic session behavior.

Every simulated result, draft, reaction and tally carries the authored
**Simulated — Cedar Desk — practice, not evidence** stamp. Counters are not a
score; sent and routed can overlap when a customer receives an acknowledgement
and an owner receives the request. Export includes each frozen version, reason,
quoted mapping, classification provenance and model identifier where present, authored consequences and
debrief, plus clearly labeled unrun drafts. A full selectable record is always
shown because a download request does not prove a file was received. None of
this record is automatically submitted to Canvas or evidence that another person
tried a learner's project.

A new practice episode replaces only the current revision's record after an
export/copy warning; previous-activity records and conversations are retained.
Changing view or unmounting aborts an in-flight client request and stale callbacks
cannot append a result to a different episode. The UI has no animated essential
content, uses ordinary labels/native controls and exposes readable results and
copyable text. Type and pure-engine tests do not establish keyboard, narrow-screen,
reload/export or live-provider usability; verify those separately before release.


Local Phase 1 verification (November 12, 2026): the isolated hosting branch
`course/workplace-unit4-20261112` passed 95 TA/workshop/shift tests, targeted
ESLint, TypeScript and an optimized Next build. The canonical implementation
record and screenshots are in the isolated course worktree:
`/Users/majid/Documents/GitHub/.worktrees/uvu_courses-workplace-unit4-20261112/courses/cs4720R/docs/UNIT4_SHIFT_RUN_IMPLEMENTATION.md`.
Live-provider understanding and token use remain unmeasured; injected fixtures
are not a provider evaluation. Nothing was pushed, merged or deployed, and no
live Canvas change or package import was performed. Keep this local branch
separate until Majid explicitly approves publication.
