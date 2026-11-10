# Building AI Solutions teaching assistant

This assistant follows the workshop TA architecture: local public course chunks → deterministic lexical retrieval → server teaching prompt → AI SDK/Gateway stream. It has no web browsing, external actions, private records, learner-workbook access, vector database or embedding service.

## Updating the course evidence

After syncing the course into `public/teaching/ai-solutions`, run:

```sh
node scripts/build-course-kb.mjs
node --test scripts/test-course-kb.mjs
```

The builder reads an explicit allowlist of public HTML lessons, assessments and course resources. It extracts main content, existing section anchors, table rows, rubrics and knowledge-check explanations. It excludes navigation, private note inputs and duplicate print pages. Simulation strings, controls and formulas come from the published `labs/app.js`, parsed as literal AST data without executing it. Symlinks and incomplete course snapshots fail the build. No private teaching directory or `AI_REVIEW_BRIEF` is read. The generated TypeScript corpus and its content digest are committed with the public snapshot. Regenerate before the Next.js build; retrieval never reads mutable files during a learner request.

The model sees at most six relevant chunks / 14,500 excerpt characters. Short conversational follow-ups include recent discussion as a retrieval query, not as trusted evidence. Explicit course-navigation questions have a local orientation route; unrelated questions receive an evidence-gap response without calling a model. Only server-selected course URLs appear as source parts. They are retrieved references; they do not guarantee that every generated sentence is correct.

## API contract

`POST /api/course-chat` accepts `{messages: UIMessage[]}`. User parts must be text. Assistant text is accepted for context; persisted `source-url` and `step-start` parts are discarded before generation. Client system/tool/file messages are rejected. Maximums: 16 messages, 4,000 characters per user message, 8,000 per assistant message, 20,000 total text characters, 48 KiB JSON body, 1,400 output tokens and 50 seconds of generation. The browser-safe `prepareCourseHistory` keeps a text-only suffix within all these limits (including UTF-8 serialized bytes), omits failed/source-only assistant messages, and leaves complete displayed messages and source citations in UI state. Responses use AI SDK 6 UI-message SSE, with native persistent `{type: 'source-url', sourceId, title, url}` parts. Input and gate errors return JSON `{error}`; provider stream errors use a sanitized generic message. No raw provider error or credential is returned or logged by this handler.

The assistant coaches students through their own work, uses business language and numerical examples, and does not fabricate interviews, testing, demand, grades or deployments. It cannot supply an entire assessed capstone for submission. Course excerpts are reference data beneath the server teaching rules.

## Configuration and cost controls

- `COURSE_TA_MODEL` overrides the course model; otherwise `WORKSHOP_TA_MODEL` is reused. The fallback is `anthropic/claude-haiku-5.5`, verified in the live Gateway model catalog at `https://ai-gateway.vercel.sh/v1/models` on 2026-11-10. Implementation and streaming tests use the installed AI SDK 6 bundled documentation/source and its `MockLanguageModelV3`; the lockfile records the installed patch version.
- Gateway credentials follow the existing workshop integration: server-side Vercel OIDC or `AI_GATEWAY_API_KEY`. No credential belongs in a browser variable.
- Optional `COURSE_TA_CODE` gates requests using the `x-course-code` header. If absent/empty, the assistant is public. The UI must not persist this code in long-lived local storage.
- Each function instance allows 8 requests per client hint per 10 minutes, 120 total requests per 10 minutes, four simultaneous generations and at most 1,000 remembered client entries. Expiring leases prevent an abandoned stream retaining a slot indefinitely. Same-origin browser requests are checked; clients without Origin are still allowed.

**These in-memory controls are best-effort per process.** Cold starts and parallel serverless instances have separate counters; a proxy IP is not verified identity. These controls are neither a distributed rate limit nor a hard spending ceiling. Use Gateway/platform budget controls or a shared limiter if stronger deployment-wide controls become necessary. An optional course code reduces casual access but is not individual authentication. No paid persistence dependency was added.

## Validation scope

Tests check complete generated coverage, table/anchor extraction, non-executing simulation parsing, relevant and irrelevant retrieval, follow-up resolution, source existence, prompt boundaries, malformed/oversized requests, role isolation, access/lease limits, and actual AI SDK streaming with mocked providers. The mock tests verify source persistence, output-token settings and sanitized failures without consuming paid generation. Production model availability and answer quality still require a live smoke test; deterministic tests do not prove a model will always follow the teaching prompt.
