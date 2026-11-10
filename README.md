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

Building AI Solutions is owned, created and taught by Majid Memari. Learners work from a partner or classroom-client need through discovery, a usable AI-assisted solution, a controlled pilot, evaluation, pitching, sales or internal adoption, and handoff. No student programming is required. Lessons use business cases, numerical tables, figures, interactive concept studios and decision simulations.

The curriculum is maintained in the sibling course repository. This site tracks only its **public built output** in `public/teaching/ai-solutions/`. It does not deploy private instructor guides, partner records or learning-platform administration files.

```sh
# First build and check in the maintained course site's directory:
python3 build_site.py
python3 check_site.py

# Then run from this personal-site repository:
node scripts/sync-ai-course.mjs ../uvu_courses/courses/cs4720R/site/dist
node --test scripts/test-course-kb.mjs
npm run build
```

The historical source directory is repository organization, not public branding. The sync validates public file types, rejects hidden files and symlinks, replaces only the course's public directory, records checksums in `content/ai-solutions-release.json`, and regenerates the assistant knowledge base. Hosted HTML uses a same-origin assistant path; the portable ZIP retains its absolute online assistant link.

Commit the synchronized public output, checksum manifest and generated knowledge base together. Make lasting curriculum changes in the maintained course source, then synchronize again.

The short course and labs addresses redirect to their explicit `index.html` documents, preserving relative assets under Next.js. Keep `assets/`, `labs/` and `downloads/` together. This site serves the complete course directly; it does not depend on a separate course deployment.

Core lessons, simulations, printable readers and worksheets have no account, backend or paid-service dependency. Learner notes and progress stay in browser storage; they are not grades or submissions. Notes do not transfer automatically between hostnames: use the course workbook backup/restore controls. The ZIP remains portable; the online assistant is an optional service, not a running backend included in the archive.

## Course AI teaching assistant

The course TA follows the workshop TA's architecture: **local public chunks → deterministic retrieval → server teaching prompt → AI Gateway stream**.

- `scripts/build-course-kb.mjs` extracts public lesson content, rubrics, table rows and source anchors. Simulation strings, controls and formulas are parsed as literal data without executing the app.
- `lib/course-kb/retrieve.ts` selects relevant excerpts using lexical matching and recent conversational context. Unrelated questions receive an evidence-gap response without calling a model.
- `/api/course-chat` streams an answer plus server-selected course source links using AI SDK 6 UI-message events.
- The browser keeps displayed sources attached to answers. A bounded text-only suffix is sent for follow-ups; empty assistant turns from failed streams are omitted. Markdown tables use GFM support.

There is no vector database, embedding service, browsing or external-action tool. The TA cannot access private instructor material, student records or local workbooks. It coaches learners through their own work and is instructed not to fabricate interviews, demand, tests, grades, deployments or complete assessed capstones. Learners should verify important explanations and calculations against the linked lessons.

The page does not persist conversations; reloading clears them. Questions, recent conversation and relevant excerpts are sent to an AI service, whose processing and logs may still apply. Do not enter confidential partner information or student records. See the [TA implementation and maintenance notes](lib/course-kb/README.md) for source boundaries, limits and the API contract.

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
| `CONTACT_TO_EMAIL` | Contact inbox; defaults to the address in `lib/site.ts` |

The course model precedence is `COURSE_TA_MODEL` → `WORKSHOP_TA_MODEL` → `anthropic/claude-haiku-5.5`. The fallback was verified against the [Gateway catalog](https://ai-gateway.vercel.sh/v1/models) on November 10, 2026. The separate workshop endpoint currently defaults to `anthropic/claude-haiku-4.5`.

Course requests are bounded to 16 messages, 4,000 characters per user message, 8,000 per assistant message, 20,000 total text characters and 48 KiB JSON. Generation is capped at 1,400 output tokens and 50 seconds. Best-effort per-process controls allow eight requests per client hint per ten minutes, 120 total per ten minutes and four concurrent generations. **Cold starts and parallel instances have separate counters: these are not a distributed quota or hard spending ceiling.** Use Gateway/platform budget controls when deployment-wide limits are needed. A shared code is an optional gate, not individual authentication; the UI keeps it only in memory.

Without `RESEND_API_KEY`, the contact endpoint logs a preview on the server and does not deliver email. Configure and verify delivery before relying on the form for production inquiries. Its AI acknowledgment is displayed on the website, not automatically emailed to the sender.

## Validation

```sh
node scripts/build-course-kb.mjs
node --test scripts/test-course-kb.mjs
node --test scripts/test-workshop-kb.mjs
npx tsc --noEmit --incremental false
npm run build
```

Course tests cover source completeness, table/rubric extraction, anchors, non-executing simulation parsing, retrieval relevance, follow-ups, request/history bounds, access controls and prompt boundaries. Actual AI SDK stream formatting is tested with mocked providers, including source events and sanitized failures, without paid generation. These tests do not verify live model access or guarantee answer quality.

Before release, check course redirects, a deep lesson, JavaScript-module responses, simulations, worksheet/ZIP downloads, workbook backup/restore, and the assistant on desktop/mobile. Run a live question and follow-up; inspect source links and error behavior. Check shared homepage, teaching, biography, publication and contact navigation.

## Deployment

Deploy this repository as one Next.js project from its root. `vercel.json` selects Next.js and the `iad1` region; the production build is `npm run vercel-build`. Configure the canonical domain, server variables and Gateway access, then use the project's existing Git or CLI deployment workflow. Course content and its generated TA knowledge base should travel in the same release.
