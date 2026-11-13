# Research backend: implemented capability, collection off by default

The dedicated research API is separate from ordinary course practice. It supplies durable local synthetic testing and a private PostgreSQL adapter. It does not establish institutional approval, consent, a reviewed instrument, an independently reviewed question pool or learner results. No database has been provisioned by this implementation.

## Runtime gates

With no configuration, `RESEARCH_MODE` is off and mutations are unavailable. Browser pages must not invent a consent check box as authorization to enroll. An independent coordinator attests an external reviewed consent/eligibility record using coordinator authentication. The software checks the declared configuration and versions; it cannot verify that institutional records are genuine.

Synthetic mode requires all of:

- `RESEARCH_MODE=synthetic`, `RESEARCH_SYNTHETIC_ENABLED=1` and `NODE_ENV=development` or `test`.
- No Vercel runtime marker, and a localhost/loopback request origin.
- An absolute private `RESEARCH_SYNTHETIC_STORE` path outside public files.
- Four distinct secrets, each at least 32 characters: `RESEARCH_COORDINATOR_TOKEN`, `RESEARCH_SCORER_TOKEN`, `RESEARCH_ANALYST_TOKEN`, `RESEARCH_PURGE_TOKEN`.
- Synthetic participant IDs; optional `RESEARCH_SYNTHETIC_MANIFEST_JSON` can choose fictional E1/E2/E3 configurations. The default fixture is E3 and is explicitly unvalidated.

Synthetic runtime dependencies make **no provider calls**, even when ordinary course provider credentials exist. Unit tests may inject a mocked selector. The synthetic file store uses a cross-process exclusive lock, atomic replacement, file/directory sync and private file permissions; a stale lock requires operator inspection, not automatic unsafe recovery. It is never used in Vercel/live mode.

Live collection also has a source-level `LIVE_RESEARCH_RELEASE = false` gate in `lib/research/config.ts`. It remains closed even if all environment variables are present. A later, separately reviewed code change is required after institutional determination/approval, approved storage and retention, independent staffing, consent procedures, private instruments and deployment verification. Local synthetic mode remains usable. Live mode would additionally require `RESEARCH_MODE=live`, `RESEARCH_ENABLED=reviewed-live-collection`, a private `RESEARCH_REVIEWED_MANIFEST_JSON`, `RESEARCH_DATABASE_URL`, `RESEARCH_MODEL` and the actual `VERCEL_GIT_COMMIT_SHA`. `ResearchManifest` defines approval/protocol/consent references, reviewed packet text, staff, retention, withdrawal, grading release, stage prerequisites and exact frozen artifacts. Do not put this private manifest or real assessment forms in Git/public content. E1 requires rehearsal/feedback plus E0 review; E2 requires E0/E1 and baseline/immediate/delayed forms/coders; E3 also requires E2 and the reviewed selection pool. Live E3 has an additional source-level block because the question pool is provisional. Editing environment flags cannot bypass these gates.

The freeze binds the actual course digest, activity fingerprint/revision, deployment commit, question cards/fixed lookup/selector prompt, selector version, model and complete supplied form text. Changes fail closed instead of silently reinterpreting existing records. Model identifiers may still be provider aliases; a matching string is not an immutable checkpoint guarantee.

Live manifests also require explicit ISO `studyEndsAt` and `recordsRetainUntil` dates. The record cutoff must follow study close and be within ten calendar years; the reviewed policy chooses the actual duration. Every participant receives that same absolute cutoff, regardless of enrollment date. `retentionDays` is only the synthetic-fixture fallback. A three-calendar-year-after-close proposal must be converted to an exact reviewed cutoff, not silently implemented as three years from individual enrollment. Earlier withdrawal still deletes content under the reviewed deletion policy. Identity linkage is external to this app, so any 90-day linkage schedule requires a separate coordinator procedure. No real cutoff or linkage schedule has been activated here.

## Local synthetic operator workflow

Use Node 22+ with `registerHooks` support. The CLI writes private results rather than printing tokens/data. Replace the example private directory and port as appropriate:

```sh
node scripts/research-admin.mjs synthetic-init /private/tmp/ai-research-local
node --env-file=/private/tmp/ai-research-local/synthetic.env node_modules/next/dist/bin/next dev --port 3197
```

In another shell, inspect status and enroll a fixture:

```sh
node --env-file=/private/tmp/ai-research-local/synthetic.env scripts/research-admin.mjs status
node --env-file=/private/tmp/ai-research-local/synthetic.env scripts/research-admin.mjs enroll /private/tmp/ai-research-local/synthetic-enrollment.json /private/tmp/ai-research-local/participant-token.json
```

The coordinator receives a cryptographically random token once. Only its hash is stored. Retrying the same enrollment request creates no second participant and returns no raw token again. A fresh request ID with the same opaque coordinator consent-record reference also resolves to the existing participant without returning the original token; this covers a lost response followed by a page reload. The reference is never returned in the participant/session response. Recover a lost delivery with an explicit coordinator `rotate` request `{version:1,action:"rotate-token",participantId:"synthetic-demo-001"}` in a private input file; rotation invalidates the old token. A withdrawn, expired or different-protocol record requires coordinator review rather than automatic re-enrollment. Never put participant credentials in URLs, browser storage, screenshots or Git. The dedicated frontend uses memory-only authentication and reload requires re-entry.

The CLI also supports `observe`, `export-scoring`, `export-analysis`, `purge-expired`, and `delete-participant`. Enrollment/rotation/observations use the coordinator credential; the independent coordinator may also act as facilitator under the reviewed role plan. Scoring, unmasked analysis and destructive purge use separate credentials. For exports/purge, pass a private output path as the argument; commands with an input payload also take a separate private output path. Existing outputs are not overwritten.

`freeze <private-manifest.json> <private-freeze.json>` requires `RESEARCH_MODEL` and `RESEARCH_FREEZE_ENGINE_COMMIT` and produces version metadata without enabling collection. `migrate` requires `RESEARCH_ALLOW_MIGRATION=explicit-private-db-migration` and a configured private database URL; it executes `lib/research/migration.sql`. Neither command provisions a database or activates collection. The application does not auto-migrate. Use a restricted database account and provider connection pooling; TLS certificate verification is required. Hosted PostgreSQL connectivity/permissions remain unverified until an authorized environment is configured and tested.

Before using the freeze command for a live manifest, include the institutionally reviewed `studyEndsAt` and `recordsRetainUntil` values in that private input. The helper does not choose those dates, create an approval reference or activate the retention plan. New enrollment is refused after the configured study-close date.

## HTTP contract and durable sequence

All endpoints are under `/api/research/`; requests use `Authorization: Bearer ...`, never cookies/query tokens. Responses use no-store/noindex headers. POSTs use bounded JSON; schemas reject unknown fields. `lib/research/types.ts` is the browser-safe contract.

| Endpoint | Role | Purpose |
|---|---|---|
| `GET session` | Public status or participant | No-token status; explicit authenticated entry/resume returns only the current eligible packet. |
| `POST session` | Coordinator | External consent/adult-eligibility attestation, one-time participant token. |
| `POST response` | Participant | Immutable stage response and receipt; identical request-ID retries are safe. |
| `POST checkpoint` | Participant | Explicit validated Unit 4 save, canonical recomputation, immutable earlier runs/explanations and timestamped checkpoint receipt. |
| `POST proposal` | Participant | One bounded interpretation attempt per workflow version; no synthetic provider call. |
| `POST question` | Participant | Durable `start`, awaited `select`, independent `release`, `respond`, or explicit `skip`. |
| `POST withdraw` | Participant | Explicit deletion of response/checkpoint/question content; minimal withdrawn token tombstone blocks future writes. |
| `POST admin` | Separate roles | Rotation, structured facilitator observation, scoped export or explicit purge. |

E1 follows rehearsal → feedback, with structured observations as its usability evidence. Its study view ends after one confirmed A+B run and a committed explanation; the participant can download or copy the local rehearsal record before finishing. It does not require version 2, C or the evidence-question opportunity. E2/E3 follow baseline → rehearsal → immediate → delayed → feedback. Their common evidence-question opportunity occurs after version 1 and before version 2; an explicit skip records a declined opportunity and permits continuation. Explicit missing assessments use `{answer:null,missingReason:...}`; incomplete rehearsal uses `{completed:false,reason:...}`. Allowed reasons are declined, time-limit, technical and other. These advance follow-ups without fabricating responses or scoring failures as zero. Missing-answer rows are omitted from masked scoring, but participants remain in the export denominator; analysis retains declared missingness.

E3 allocation occurs once on explicit authenticated Day 0 entry, before the baseline packet, and remains concealed. Enrolled nonstarters have no allocation and are separately visible. The default is independent 1:1 random assignment; it does not implement a concealed permuted-block schedule. A future approved protocol requiring blocks needs that explicit allocator before activation. Nonreachers/refusals/fallbacks stay assigned.

The common gate reserves one opportunity before any selection call. `start` returns promptly; a separate `select` HTTP handler awaits the provider outside the database transaction. The learner can complete inspection/release concurrently. A valid selection must arrive by the absolute 30-second deadline and before release. Release occurs on explicit inspection completion or the 60-second boundary, regardless of model readiness. No retry/extra question follows failure. Planned fixed delivery is distinct from adaptive fallback. The response opportunity expires after 180 seconds; the server records timed-out, never a fabricated learner response. `skip` records a declined opportunity without claiming inspection or displaying an unseen card. Both arms receive the same neutral projection without selected-quote/model labels.

Delayed packets are withheld server-side until available. Assessment views exclude previous rehearsal/checkpoint/question content; fresh supplied task sources/traces remain permitted. Assessments never enter the interpretation or selection service. Schema separation cannot detect every inappropriate passage a user might paste into a permitted workflow field; the disclosure and approved protocol still matter.

## Privacy, exports and verification limits

No name, email, student ID, roster, grade, journal or identity-key field exists in these schemas. Free-text answers still require permitted private processing; pseudonyms are not anonymity. Tokens/configuration/provider errors are not logged by this code. Hosting/provider infrastructure logging and retention need separate institutional review.

Masked scoring exports contain study/protocol/experiment/freeze metadata and participant pseudonyms plus baseline/immediate/delayed answer packets only. They exclude arm, model use, prior practice and facilitator notes. Unmasked analysis requires the separate analyst credential and the reviewed grading-release date; it includes actual missingness, allocation, process and observation records. Mixed frozen versions are rejected rather than relabeled. Withdrawal deletes content, expiry stops access/writes, and the explicit purge command removes expired/tombstone records; an approved operator must actually schedule/run retention purges.

Tests use temporary durable files, mocked selectors and a mocked PostgreSQL client. They do not enroll people, contact a provider, verify a real PostgreSQL deployment, independently validate the provisional question pool or establish learning. Keep actual approval, private instruments, staffed coordination/scoring, deployment verification and research activation distinct from passing software checks.

## Local validation — November 12, 2026

The final collector revision, including the absolute retention cutoff, passed these checks before the local commit:

| Check | Observed result | Boundary |
| --- | --- | --- |
| Eleven hosting test harnesses | **204 tests passed** | Includes 18 service tests, including lost-response enrollment recovery, and four browser-transport tests; synthetic/mocked inputs only. |
| Source ESLint, TypeScript and formatting | Passed | Lint covered `app`, `lib`, `scripts` and source configuration. Temporary Prettier 3.6.2 formatted the new research files without adding a project dependency. |
| Optimized production build | Passed | Regenerated the public knowledge base, then built Next.js with research off. |
| Compiled-server smoke checks | Eight requests passed | Home, course, lesson, assistant and both study pages returned 200; study status was off/unavailable with no-store, and a write returned 404. |
| Browser receipt and resume | Passed in Chrome | A fictional baseline submission received a receipt; reload required token re-entry and restored the current rehearsal plus the same receipt, without reopening the prior assessment packet. |
| Browser question opportunity | Passed in Chrome | A separately seeded synthetic checkpoint exercised explicit start/save, common inspection, early release, neutral source tags, response save and revision unlock. No provider call occurred. |
| Narrow view | Inspected at 375 CSS pixels | The evidence-question and recorded-response cards wrapped without visible horizontal clipping. This was not a full mobile-device audit. |
| Process restart | Passed | After stopping and restarting the local server, authenticated retrieval preserved the same synthetic participant, rehearsal stage, exact receipt and timestamp. |

Run the maintained test harnesses with a supported recent Node version:

```sh
for harness in scripts/test-*.mjs; do
  node "$harness" || exit 1
done
node node_modules/eslint/bin/eslint.js app lib scripts next.config.ts eslint.config.mjs postcss.config.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/build-course-kb.mjs
node node_modules/next/dist/bin/next build
```

The build commands are the same prebuild/build steps used by `npm run vercel-build`. Broad `eslint .` also traverses generated `.next` files and archived CommonJS course snapshots; that is not the source-lint scope above.

The browser check did not complete the entire second-run/C/immediate/delayed sequence; the separate synthetic HTTP checks covered the stage flow. Safari, Firefox, a screen reader, live PostgreSQL, real provider calls and deployed custom-domain origin handling remain unverified. No live research collection, deployment or learning-effectiveness claim follows from these results.
