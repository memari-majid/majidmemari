# Majid Memari — AI teaching, workshops and mentorship

Personal website for **Majid Memari**, presenting his independent AI courses, practical workshops, mentorship and professional background. The canonical public address is [www.majidmemari.com](https://www.majidmemari.com).

The site uses Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4 and Vercel AI SDK 6. Its current presentation uses a light background, dark typography and teal/blue accents. Building AI Solutions is the featured course. Public course identity does not depend on a university affiliation or historical course number. Exact dependency versions are recorded in the lockfile.

## Main experiences

| Path | Purpose |
| --- | --- |
| `/` | Courses, workshops, mentorship and contact |
| `/teaching` | Learning offerings and workshop overview |
| `/teaching/ai-solutions/index.html` | Complete Building AI Solutions course |
| `/teaching/ai-solutions/assistant` | Course AI teaching assistant |
| `/teaching/agentic-llm` | Separate NVIDIA DLI workshop and workshop assistant |
| `/about` | Professional background |
| `/publications` | Publications and research links |

The floating website assistant is a brief navigation/profile guide. The course assistant helps learners reason about Building AI Solutions. The workshop assistant uses separate notes and prerequisites. Their prompts and endpoints are distinct.

## Development

Use a supported Node.js version satisfying `package.json` (Node 20 or later). The test runners use Node's TypeScript hooks and require a recent Node 22 release or Node 24.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Public pages and the static course work without AI credentials or email delivery. Keep real credentials and access codes out of source control.

`npm run build` regenerates the course knowledge base through `prebuild`, then builds Next.js. `npm run start` serves the production build. `npm run vercel-build` uses the same build path.

## Course source and synchronization

Building AI Solutions is owned, created and taught by Majid Memari. Learners work from a partner or classroom-client need through discovery, a usable AI-assisted solution, a controlled pilot, evaluation, pitching, sales or internal adoption, and handoff. No student programming is required. Twelve units follow Learn → Try → Build → Finish, with one capstone and five milestones. Business cases, numerical tables, figures, and decision simulations are integrated into the lessons.

The curriculum is maintained in the sibling course repository. Start with the [course source and review guide](docs/ai-solutions/README.md) to locate the active source, design plan, review brief, and live pages. This site tracks only the course’s **public built output** in `public/teaching/ai-solutions/`. It does not deploy private instructor guides, partner records or learning-platform administration files.

```sh
# First build and check in the maintained course site's directory:
python3 build_site.py
python3 check_site.py
node --test test_workbook.cjs test_practice.cjs test_lesson_figures.cjs

# Then run from a clean, current personal-site checkout or isolated worktree:
node scripts/sync-ai-course.mjs /absolute/path/to/uvu_courses/courses/cs4720R/site/dist
node --test scripts/test-course-kb.mjs
npm run build
```

The historical source directory is repository organization, not public branding. The sync validates public file types, rejects hidden files and symlinks, replaces only the course's public directory, records checksums in `content/ai-solutions-release.json`, and regenerates the assistant knowledge base. Hosted HTML uses a same-origin assistant path; the portable ZIP retains its absolute online assistant link.

Commit the synchronized public output, checksum manifest and generated knowledge base together. Make lasting curriculum changes in the maintained course source, then synchronize again.

The short course address resolves to its directory or explicit `index.html`, preserving relative assets under Next.js. The retired labs entry and old module/assessment routes are compatibility redirects into the current path. Keep the generated snapshot intact. This site serves the complete course directly; it does not depend on a separate course deployment.

Core lessons, worked examples, lesson printing, and project templates have no account, backend or paid-service dependency. Interactive controls require JavaScript. Learner notes and progress stay in browser storage; they are not grades or submissions. Notes do not transfer automatically between hostnames: use the course workbook backup/restore controls. Guided practice has its own saved state and export, separate from the workbook. The ZIP remains portable; the online assistant is an optional service, not a running backend included in the archive.

## Course AI teaching assistant

The course TA follows the workshop TA's architecture: **local public chunks → deterministic retrieval → server teaching prompt → AI Gateway stream**.

- `scripts/build-course-kb.mjs` extracts 24 allowlisted public HTML pages, including lesson content, rubrics, table rows, source anchors, and static worked explanations for visual activities. It hashes `practice.js` and `lesson-figures.js` for freshness without executing or parsing their models into chunks.
- `lib/course-kb/retrieve.ts` selects relevant excerpts using lexical matching and recent conversational context. Unrelated questions receive an evidence-gap response without calling a model.
- `/api/course-chat` accepts messages and optional allowlisted current-page context in `lesson`, then streams an answer plus server-selected course source links using AI SDK 6 UI-message events.
- The browser keeps displayed sources attached to answers and restores a bounded conversation from session storage. A bounded text-only suffix is sent for follow-ups; empty assistant turns from failed streams are omitted. Markdown tables use GFM support.

There is no vector database, embedding service, browsing or external-action tool. The TA cannot access private instructor material, student records or local workbooks. It coaches learners through their own work and is instructed not to fabricate interviews, demand, tests, grades, deployments or complete assessed capstones. Learners should verify important explanations and calculations against the linked lessons.

The course TA conversation can survive a same-tab reload through `sessionStorage`; **New conversation** clears it. This is separate from the course workbook and does not synchronize across devices. Questions, recent conversation, the current lesson and relevant excerpts are sent to an AI service, whose processing and logs may still apply. Do not enter confidential partner information or student records. See the [TA implementation and maintenance notes](lib/course-kb/README.md) for source boundaries, limits and the API contract.

## Environment configuration

AI calls use Vercel AI Gateway with server-side Vercel OIDC or `AI_GATEWAY_API_KEY`, as appropriate for the environment. Do not expose credentials or access codes through `NEXT_PUBLIC_` variables.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL; defaults to `https://www.majidmemari.com` |
| `COURSE_TA_MODEL` | Optional Gateway `provider/model` override for the course TA |
| `COURSE_TA_CODE` | Optional course gate via `x-course-code`; absent/empty means public access |
| `WORKSHOP_TA_MODEL` | Workshop model override; also the course fallback when its own override is absent |
| `WORKSHOP_TA_CODE` | Separate optional workshop access code; absent/empty means public access in the current implementation |
| `AI_CHAT_MODEL` | Floating site guide model; default `openai/gpt-oss-20b` |
| `CONTACT_CLASSIFY_MODEL` | Contact classification/onscreen acknowledgment model; default `openai/gpt-oss-20b` |
| `AI_GATEWAY_API_KEY` | Server-only Gateway authentication when needed |
| `RESEND_API_KEY` | Enables email delivery for contact submissions |
| `RESEND_FROM_EMAIL` | Verified Resend sender |
| `CONTACT_TO_EMAIL` | Private recipient inbox; required and never rendered publicly |

The course model precedence is `COURSE_TA_MODEL` → `WORKSHOP_TA_MODEL` → `anthropic/claude-haiku-5.5`. The fallback was verified against the [Gateway catalog](https://ai-gateway.vercel.sh/v1/models) on November 10, 2026. The separate workshop endpoint currently defaults to `anthropic/claude-haiku-4.5`.

Course requests are bounded to 16 messages, 4,000 characters per user message, 8,000 per assistant message, 20,000 total text characters and 48 KiB JSON. Generation is capped at 3,000 output tokens and 50 seconds while the teaching prompt requests concise answers. Native finish-reason metadata and interruption callbacks show a visible notice when an answer reaches its length limit or does not finish normally. Best-effort per-process controls allow eight requests per client hint per ten minutes, 120 total per ten minutes and four concurrent generations. **Cold starts and parallel instances have separate counters: these are not a distributed quota or hard spending ceiling.** Use Gateway/platform budget controls when deployment-wide limits are needed. A shared code is an optional gate, not individual authentication; the UI keeps it only in memory.

The website chatbot contains the inquiry form. `GET /api/contact` reports delivery availability without exposing addresses. All three delivery variables are required. If unavailable, the form explicitly reports that inquiries cannot be sent; there is no log-only success or public email fallback. Only a provider-accepted response returns success. AI chat itself does not send an inquiry.

## Validation

```sh
node scripts/build-course-kb.mjs
node --test scripts/test-course-kb.mjs
node --test scripts/test-workshop-kb.mjs
npx tsc --noEmit --incremental false
npm run build
```

Course tests cover source completeness, table/rubric extraction, anchors, static visual explanations, retrieval relevance, current-lesson context, follow-ups, session restoration, request/history bounds, access controls and prompt boundaries. Actual AI SDK stream formatting is tested with mocked providers, including source events and sanitized failures, without paid generation. These tests do not verify live model access or guarantee answer quality.

Before release, check course redirects, a deep lesson, interactive figures and their matching tables, project-template/ZIP downloads, workbook backup/restore, and the assistant on desktop/mobile. Run a live question and follow-up; inspect current-lesson context, source links, reload restoration, New conversation, and error behavior. Check shared homepage, teaching, biography, publication and contact navigation.

## Deployment

Deploy this repository as one Next.js project from its root. `vercel.json` selects Next.js and the `iad1` region; the production build is `npm run vercel-build`. Configure the canonical domain, server variables and Gateway access, then use the project's existing Git or CLI deployment workflow. Course content and its generated TA knowledge base should travel in the same release.
