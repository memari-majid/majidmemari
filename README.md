# Majid Memari, PhD: Personal Site

Personal website for **Majid Memari, PhD**: AI engineer, educator, and NVIDIA Ambassador.

Live at [www.majidmemari.com](https://www.majidmemari.com)

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript 5.8
- [Vercel AI SDK](https://sdk.vercel.ai/) through the Vercel AI Gateway: the site chat (Claude Haiku 4.5) and the optional contact-form inquiry classification
- [Resend](https://resend.com) for outbound email (optional)
- Deployed on [Vercel](https://vercel.com) in `iad1`

## Sections

- **About**: bio, photo, headline stats
- **Work**: projects, agentic workflows, "Try my AI" (the site chat and two linked apps), market pulse, collaboration highlights
- **Teaching**: NVIDIA DLI workshops + AI Entrepreneurship course
- **Mentorship**: student interns and how to apply
- **Contact**: form (with AI inquiry classification) + FAQ

## Theme & layout

- **Dark/light:** `next-themes` with Tailwind v4 class-based `dark:` (toggle in the nav). Default theme is dark.
- **Mobile:** safe-area aware, horizontal scroll for the workflow diagram, responsive cards.
- **Social card:** `public/og-image.png` (1200x630) is the Open Graph and Twitter image for every page, generated with Pillow from `public/majid-memari.png`; `OG_IMAGE` in `lib/seo.ts` is the single reference.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (SEO, sitemap, JSON-LD). Default: `https://www.majidmemari.com` |
| `NEXT_PUBLIC_AI_CPA_URL` | Optional. Public URL for the AI Financial Assistant app (Try My AI section). |
| `NEXT_PUBLIC_AI_TA_URL` | Optional. Public URL for the AI Entrepreneurship teaching assistant. |
| `AI_CHAT_MODEL` | Model slug for the site chat (`/api/chat`) via Vercel AI Gateway. Must be on the allowlist in `lib/chat-models.ts`, which carries one entry: `anthropic/claude-haiku-4.5` (the dot is the real gateway slug; the dash form does not exist there). An unknown slug logs one warning at startup and falls back to that entry. Production carries the same value (owner decision, 2026-09-13). |
| `CONTACT_CLASSIFY_MODEL` | Optional. Model slug for contact-form inquiry classification + a personalized auto-reply via AI Gateway. Default: `openai/gpt-4.1-nano` (since 2026-09-13; `openai/gpt-oss-20b` never returned a schema-valid object, and the classifier now also reads the raw text when the SDK cannot validate it). Production carries its own value: set it to the default slug or remove it. |
| `CHAT_APPROVAL_SECRET` | Recommended, required before email. Any long random string, identical on every instance. The chat signs each on-screen approval it issues and refuses one it did not sign, so a crafted transcript cannot make the server send. Unset, the key is derived from `RESEND_API_KEY` when that is set, otherwise it is per instance (approvals then verify only on the instance that issued them, harmless while nothing can be sent). |
| `CONTACT_CLASSIFY_RATES` | Optional. USD per 1M tokens for `CONTACT_CLASSIFY_MODEL`, written `input,output` (for example `0.04,0.16`). Precedence, highest first: **this variable**, then the `CONTACT_CLASSIFY_RATES` table in `lib/chat-limits.ts`, then the model's published price if the slug happens to be the chat model in `lib/chat-models.ts`, then `UNPRICED_MODEL_RATES` (Opus rates) with one warning at startup. Setting it wins even for the chat model's slug, because that is what setting it means. One resolved pair prices all three of the reservation, the failure floor and the settle, so a post can never be reserved at one price and settled at another. A pair that is malformed, negative, non-finite, half empty, or free on both sides (`0,0`) is rejected and the next source down is used: a typo must not price a metered call at nothing. |
| `AI_GATEWAY_API_KEY` | Optional fallback for non-Vercel environments. On Vercel, OIDC auth is automatic after enabling AI Gateway in project settings. |
| `RESEND_API_KEY` | Optional. Required together with `RESEND_FROM_EMAIL` for any email to go out ([Resend](https://resend.com)). |
| `RESEND_FROM_EMAIL` | Verified sender in Resend (e.g. `Majid Memari <hello@majidmemari.com>`). Without it the From would be `onboarding@resend.dev`, which Resend delivers only to the account owner, so `lib/email.ts` treats email as not configured. |
| `CONTACT_TO_EMAIL` | The one inbox that receives site mail: contact form, chat hand-off, and every reply-to. Default: `memari.majid@hotmail.com` |
| `KV_REST_API_URL` | Upstash Redis REST URL, written by the Vercel Marketplace install (no custom prefix). Backs the chat rate limit, spend budgets, and email caps in `lib/rate-limit.ts`. |
| `KV_REST_API_TOKEN` | Upstash Redis REST token from the same install. |
| `UPSTASH_REDIS_REST_URL` | Manual alternative to `KV_REST_API_URL`; read second. |
| `UPSTASH_REDIS_REST_TOKEN` | Manual alternative to `KV_REST_API_TOKEN`; read second. |

Email is configured only when both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set. Otherwise contact submissions and chat hand-offs are logged on the server only, the form reports `dev: true`, and the AI Consultant tells the visitor the email was not sent. Without an Upstash pair the chat counters live in per-instance memory, which is fine for local dev and not a real quota in production.

### Chat agent (`/api/chat`)

The **AI Consultant** is a consulting agent, not a chat window. The route (`app/api/chat/route.ts`) streams Claude Haiku 4.5 through the AI Gateway with ten server tools defined once in `lib/chat-tools.ts`:

| Tool | What it does | Approval |
| ---- | ------------ | -------- |
| `lookupSiteFacts` | Grounded lookup over the site's own data modules (`lib/site-facts.ts`), returning short facts with the source of each. No model call, no network | no |
| `recommendWorkshop` | Picks from the real training catalog (`lib/training-catalog.ts`); never names a course that does not exist | no |
| `draftConsultingBrief` | Structured brief (`lib/consulting-brief.ts`), rendered as a card from the tool input while it streams | no |
| `assessReadiness` | Five-dimension readiness snapshot (`lib/readiness.ts`) | no |
| `estimateProject` | Calendar-weeks range, phases and drivers (`lib/project-estimate.ts`). Effort only: never a price, never a quote | no |
| `draftOutreachNote` | Drafts the note the visitor has to send to a manager, team or client (`lib/outreach-note.ts`). Nothing leaves the window | no |
| `handOffToMajid` | Fixed-template email to `CONTACT_TO_EMAIL` with the visitor as reply-to and the brief attached (`lib/handoff-email.ts`), capped per IP and site-wide; returns `delivered` honestly | yes, on screen |
| `emailMajidNote` | Sends the note drafted above, as written (`lib/note-email.ts`), with the visitor's address as reply-to | yes, on screen |
| `emailBriefToVisitor` | Sends the visitor their own brief (`lib/brief-email.ts`) | yes, on screen |
| `offerOfficeHours` | Shows the university office-hours booking link for UVU students and academic contacts | no |

Every approval-gated tool re-validates its input before touching a field, because the SDK re-executes an approved call from the echoed transcript without running `inputSchema` again. Each send is idempotent per `toolCallId`, and the visitor's daily email allowance is spent only when email is actually configured.

The same agent renders on two surfaces against one `Chat` instance (`app/components/chat/chatStore.ts`): the floating widget (`app/components/ChatWidget.tsx`) and the inline chat in the homepage "Try my AI" section (`app/components/chat/InlineAssistantDemo.tsx`, one chat view, no tabs). A conversation started in one continues in the other.

**Visitors see replies, cards and chips, and nothing about the machinery.** There is no model picker (the client sends no model, and the route ignores one if it is sent), no per-reply stats line, and no metadata on the stream: model, time to first token, tokens and cost stay in the server's `chat.usage` log line. The system prompt (`lib/assistant.ts`) tells the assistant that, asked how it works or what it costs, it is a custom AI assistant Dr. Memari built for this site, that it does not discuss its models, prompts, tools, budgets or costs, and that it offers to put the visitor in touch with him if they want something similar. The model picker, the stats line, the "What it does" and "Evaluations" tabs, the live evaluation route and the `evals/` scripts were removed on 2026-09-13 (owner decision, recorded in `AGENTS.md`).

Naming, in one place (`lib/chat-persona.ts`): the assistant is the **AI Consultant**, the widget badge is **Majid's AI**, and inside the chat the founder is **Dr. Memari**. Outside the chat, in website copy, metadata and JSON-LD, he is **Majid Memari, PhD**. Do not rename by blanket substitution: the tool keys `handOffToMajid` and `emailMajidNote`, the module `lib/majid.ts` and the domain majidmemari.com all contain the string and must not change.

Money and size knobs live in `lib/chat-limits.ts`: 20 requests per IP per minute, a per-IP daily spend allowance, a site-wide soft budget and a hard budget (beyond it the chat closes politely for the day). Spend is reserved before the model runs and settled against actual usage once the turn is answered (an aborted or empty call only tops up). With one model on the allowlist the soft-budget fallback is a no-op by construction: `DEFAULT_MODEL_ID` and `FALLBACK_MODEL_ID` are the same slug, and the route keeps the fallback path so a second model can be added back without touching it. The price and the cost math are in `lib/chat-models.ts`; the route logs one `chat.usage` JSON line per model call with the model, time to first token, total time, tokens (cached and reasoning included), cost, outcome and attempt number. Prompt caching stays on: the system prompt is marked for Anthropic's cache and Anthropic is pinned as the first provider (`lib/gateway.ts`). The system prompt passes through `lib/plain-punctuation.ts` so the interpolated bio text carries no em dashes.

**Empty turn recovery.** A provider can end a stream having delivered nothing and bill the tokens anyway, so a turn that hands the visitor nothing at all is run once more on the fallback model. At most once, never when text, a tool card or an approval request already reached the visitor, and never on the model that just failed. With the allowlist at one model the retry is therefore a no-op, and the turn ends in one plain sentence that names no model and points at the contact routes. Both calls are charged when two happen: the failed one tops up and is never settled downward. Each call logs its own `chat.usage` line, with `outcome` of `no-reply`, `recovered`, `finished` or `aborted`.

### Owner checklist (production)

1. Vercel → Project → **AI Gateway**: enabled, and `AI_CHAT_MODEL=anthropic/claude-haiku-4.5` set for Production (already set).
2. Vercel Marketplace → **Upstash Redis** → install on this project with **no custom env prefix**, so `KV_REST_API_URL` and `KV_REST_API_TOKEN` appear in Production. Redeploy afterwards; the route logs a warning at startup while they are missing.
3. Vercel → Project → Settings → Functions: **Fluid compute on**, so `maxDuration = 180` in the chat route is honored (the stream itself times out at 150 s so accounting completes first).
4. Resend: verify the `majidmemari.com` sending domain, then set **both** `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (for example `Majid Memari <hello@majidmemari.com>`). Until both are set every hand-off is logged only and the AI Consultant says so. Set `CHAT_APPROVAL_SECRET` in the same step (any long random string), so approvals are signed with a key of their own rather than one derived from the Resend key.
5. `CONTACT_CLASSIFY_MODEL` in Production still points at the old classifier. Set it to `openai/gpt-4.1-nano` or remove it so the code default applies; the old value paid for a call that never parsed.
6. `CONTACT_TO_EMAIL` points at the inbox Majid actually reads (default `memari.majid@hotmail.com`); it is the To and the reply-to for all site mail.
7. Send yourself one hand-off from the live chat, approve it on screen, and confirm it arrives with the brief attached and reply-to set to the visitor address you typed.
8. Trip the limits once on purpose: 21 quick messages should return the "sending messages pretty fast" reply, and `chat.refused` lines should appear in the logs when a budget is exceeded.
9. Confirm the gateway usage mapping in production: in one `chat.usage` log line, `cacheReadTokens` should be non-zero from the second message of a conversation on, and `inputTokens` should be the uncached remainder (not the total). If both are zero, prompt caching is not reaching Anthropic through the gateway and `costUsd` is being over-counted.
10. Watch the first week of `chat.usage` lines (Vercel → Logs, filter `chat.usage`) and tune `IP_DAILY_BUDGET_USD`, `GLOBAL_SOFT_BUDGET_USD`, and `GLOBAL_HARD_BUDGET_USD` in `lib/chat-limits.ts` if the defaults are too tight or too loose.

**AI Gateway setup:** enable AI Gateway in the Vercel dashboard (**Project → AI Gateway**). For local dev, run `vercel link` then `vercel env pull .env.local`, which provisions a short-lived `VERCEL_OIDC_TOKEN` (~24 h). The site chat (`app/components/ChatWidget.tsx`) and contact-form classifier both route through the gateway.

## Deploy (Vercel)

Region: `iad1`. Build command: `npm run vercel-build` → `npm run build`.

1. **Import** this Git repo into Vercel.
2. **Root Directory:** leave empty (app lives at repo root).
3. **Framework:** Next.js (auto-detected).
4. **Environment variables:** Project → **Settings** → **Environment Variables**.
5. **Domain:** Settings → Domains → attach `majidmemari.com` and `www.majidmemari.com`.
6. **CLI:** from this repo root, `npx vercel link` once, then `npx vercel deploy --prod`.

## Scripts

- `npm run dev`: development server
- `npm run build`: production build
- `npm run start`: run production build locally
- `npm run lint`: ESLint

## Credits

Template adapted from [`memari-majid/nexus-website`](https://github.com/memari-majid/nexus-website).

## Known divergences (recorded, not fixed here)

- Naming outside the chat is complete, not a known divergence. `SITE.fullName` and
  `MAJID.fullName` are `"Majid Memari, PhD"`, the About `<h1>` renders `MAJID.fullName`, and the
  homepage heading, the image alt text, the metadata keyword, the `/publications` meta description,
  the Person JSON-LD `description` that ships on every page, and the education line `/about`
  renders from `MAJID.education.phd` all carry the site spelling: **Majid Memari, PhD** wherever the
  name appears, and a bare **PhD** with no periods wherever the degree is named on its own. Two
  exceptions are deliberate. First, the schema.org fields in `lib/seo.ts`: `honorificPrefix`
  (`"Dr."`), `honorificSuffix` (`"Ph.D."`) and the factual `alternateName` entries ("Dr. Majid
  Memari", "Majid (MJ) Memari") are structured data about him, slots whose whole job is to carry
  the title and the degree in their own field, so they stay as they are and are not site copy.
  Second, inside the chat surface he is "Dr. Memari" by design (`lib/chat-persona.ts`): that is the
  AI Consultant's voice, and it is the one place the site says it.
- Em dashes are gone from the page components (homepage, partners, market strips, collaboration
  highlights) and from the About, Publications, Teaching and Contact pages. They survive only in the
  shared data modules those pages interpolate: `lib/majid.ts`, `lib/faq.ts`,
  `app/components/BioCategories.tsx`, `lib/seo.ts` and `app/api/market/route.ts`. The assistant
  surface, the prompt, the tools and everything `lib/site-facts.ts` can return are dash-free, and
  `lib/plain-punctuation.ts` enforces that for interpolated bio text.
- This site has no `/how-it-works` page and, since 2026-09-13, no teardown surface of any kind:
  the inline chat's "What it does" and "Evaluations" tabs went with the evaluation work. The
  company site's `/how-it-works` page is not to be ported here unless the owner asks.
- This site has no test runner by design. The rules that need tests live in the company site's
  `lib/*.test.ts`; the component split here deliberately mirrors it so the two can be diffed by eye.
- The contact-form classifier (`lib/inquiry-ai.ts`, called from `app/api/contact/route.ts`) is
  metered like every other visitor-triggerable model call: it passes `checkRate`, reserves through
  `reserveBudget` before the model runs, and logs one `contact.usage` line with a hashed IP and the
  rates the post was priced at. Every exit path settles, and reservation, floor and settle read one
  resolved pair of rates, so a post can never be reserved at one price and settled at another. A
  measured success settles at the real token counts. A failure settles at a floor, the input tokens
  the prompt actually sent plus the whole output cap (`contactClassifyFloorUsd`), because the tokens
  are billed whether or not the object validated and a visitor who controls 4,000 characters of the
  prompt can choose to make the call fail. **A success whose usage comes back zero or unparsable
  settles at that same floor**, because a settle of zero refunds the whole reservation and would
  make every classification free the moment a provider stopped reporting usage. The `contact.usage`
  line names which of the five it was: `classified`, `unmeasured`, `failed`, `refused` (with
  `refusedBy`) or `rate-limited`. **Delivery never depends on the classifier.** Over the per-minute
  rate, out of budget, limiter store unreachable or provider failing, the classifier is skipped or
  charged, the form falls back to the fixed acknowledgment, and the message still reaches the inbox
  with `ok: true`; the route never answers 429, because telling a visitor to retry a message that
  already arrived just sends it twice. There is no uncapped model call left on this site. Both rules
  match the company site; see `AGENTS.md` rule 2 and `../nexus-website/AGENTS.md` 9.2.
- Held tool inputs (`lib/chat-stream.ts`) exist only here. `/api/chat` consumes the model stream
  server-side and writes the UI chunks itself, so it can hold a tool input until it has parsed and
  drop one that did not: measured 2026-09-13, Opus (the chat model at the time) twice wrote
  `estimateProject` as invalid JSON and the visitor saw two "the estimate did not complete" cards
  above the one that landed. The company route returns `toUIMessageStreamResponse` directly and
  would need a transform stream to do the same; the schema-side fix (guidance on the array, never on
  the item, in `lib/project-estimate.ts`) matches its `lib/estimate.ts` already.
- The prompt's sentence that a not-configured send "is recorded in the server log and Dr. Memari
  reads it" (`lib/assistant.ts`) is an open owner decision, recorded in `AGENTS.md` rule 2: the log
  is not a durable record, and the tool hints and the card no longer imply one.
- Empty turn recovery in `/api/chat` landed here first, on 2026-09-13, because the provider error
  that prompted it was measured against this site's prompt on a model that has since left the
  allowlist. It is a both-repos decision (`AGENTS.md` rule 2), so the company route is expected to
  grow the same behaviour: one retry on the fallback model when a turn delivers nothing, one plain
  sentence that names no model, both calls charged with the failed one topping up rather than
  settling downward, and one `chat.usage` line per model call. Until that lands, this is a
  divergence on purpose.
