# Majid Memari — Personal Site

Personal website for **Dr. Majid Memari** — AI engineer, educator, and NVIDIA Ambassador.

Live at [www.majidmemari.com](https://www.majidmemari.com)

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript 5.8
- [Vercel AI SDK](https://sdk.vercel.ai/) + OpenAI (optional contact-form inquiry classification)
- [Resend](https://resend.com) for outbound email (optional)
- Deployed on [Vercel](https://vercel.com) in `iad1`

## Sections

- **About** — bio, photo, headline stats
- **Work** — projects, agentic workflows, "Try my AI" apps, market pulse, collaboration highlights
- **Teaching** — NVIDIA DLI workshops + AI Entrepreneurship course
- **Mentorship** — student interns and how to apply
- **Contact** — form (with AI inquiry classification) + FAQ

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
| `AI_CHAT_MODEL` | Default model slug for the site chatbot (`/api/chat`) via Vercel AI Gateway. Must be on the allowlist in `lib/chat-models.ts`; an unknown slug logs one warning at startup and falls back to `anthropic/claude-opus-5`. Production and code default: `anthropic/claude-opus-5` (chosen 2026-09-12 after a bake-off; see `AI-WEBSITES-HANDOFF.md`). |
| `CONTACT_CLASSIFY_MODEL` | Optional. Model slug for contact-form inquiry classification + a personalized auto-reply via AI Gateway. Default: `openai/gpt-oss-20b` |
| `AI_GATEWAY_API_KEY` | Optional fallback for non-Vercel environments. On Vercel, OIDC auth is automatic after enabling AI Gateway in project settings. |
| `RESEND_API_KEY` | Optional. Required together with `RESEND_FROM_EMAIL` for any email to go out ([Resend](https://resend.com)). |
| `RESEND_FROM_EMAIL` | Verified sender in Resend (e.g. `Majid Memari <hello@majidmemari.com>`). Without it the From would be `onboarding@resend.dev`, which Resend delivers only to the account owner, so `lib/email.ts` treats email as not configured. |
| `CONTACT_TO_EMAIL` | The one inbox that receives site mail: contact form, chat hand-off, and every reply-to. Default: `memari.majid@hotmail.com` |
| `KV_REST_API_URL` | Upstash Redis REST URL, written by the Vercel Marketplace install (no custom prefix). Backs the chat rate limit, spend budgets, and email caps in `lib/rate-limit.ts`. |
| `KV_REST_API_TOKEN` | Upstash Redis REST token from the same install. |
| `UPSTASH_REDIS_REST_URL` | Manual alternative to `KV_REST_API_URL`; read second. |
| `UPSTASH_REDIS_REST_TOKEN` | Manual alternative to `KV_REST_API_TOKEN`; read second. |

Email is configured only when both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set. Otherwise contact submissions and chat hand-offs are logged on the server only, the form reports `dev: true`, and Dr. MJ tells the visitor the email was not sent. Without an Upstash pair the chat counters live in per-instance memory, which is fine for local dev and not a real quota in production.

### Chat agent (`/api/chat`)

Dr. MJ is a consulting agent, not a chat window. The route (`app/api/chat/route.ts`) streams Claude Opus 5 by default through the AI Gateway with four server tools defined once in `lib/chat-tools.ts`:

| Tool | What it does | Approval |
| ---- | ------------ | -------- |
| `draftConsultingBrief` | Structured brief (`lib/consulting-brief.ts`), rendered as a card from the tool input while it streams | no |
| `assessReadiness` | Five-dimension readiness snapshot (`lib/readiness.ts`) | no |
| `handOffToMajid` | Fixed-template email to `CONTACT_TO_EMAIL` with the visitor as reply-to and the brief attached (`lib/handoff-email.ts`), capped per IP and site-wide; returns `delivered` honestly | yes, on screen |
| `offerOfficeHours` | Shows the university office-hours booking link for UVU students and academic contacts | no |

Money and size knobs live in `lib/chat-limits.ts`: 20 requests per IP per minute, a per-IP daily spend allowance, a site-wide soft budget (beyond it replies route to Claude Sonnet 5 and the reply is marked `budgetFallback`) and a hard budget (beyond it the chat closes politely for the day). Spend is reserved before the model runs and settled against actual usage in `onFinish` (`onAbort` only tops up). Prices for the four picker models and the cost math are in `lib/chat-models.ts`; every reply carries metadata (`lib/chat-metadata.ts`) with model, time to first token, total time, tokens, and cost, and the route logs one `chat.usage` JSON line per request. The system prompt passes through `lib/plain-punctuation.ts` so the interpolated bio text carries no em dashes.

### Owner checklist (production)

1. Vercel → Project → **AI Gateway**: enabled, and `AI_CHAT_MODEL=anthropic/claude-opus-5` set for Production.
2. Vercel Marketplace → **Upstash Redis** → install on this project with **no custom env prefix**, so `KV_REST_API_URL` and `KV_REST_API_TOKEN` appear in Production. Redeploy afterwards; the route logs a warning at startup while they are missing.
3. Vercel → Project → Settings → Functions: **Fluid compute on**, so `maxDuration = 180` in the chat route is honored (the stream itself times out at 150 s so accounting completes first).
4. Resend: verify the `majidmemari.com` sending domain, then set **both** `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (for example `Majid Memari <hello@majidmemari.com>`). Until both are set every hand-off is logged only and Dr. MJ says so.
5. `CONTACT_TO_EMAIL` points at the inbox Majid actually reads (default `memari.majid@hotmail.com`); it is the To and the reply-to for all site mail.
6. Send yourself one hand-off from the live chat, approve it on screen, and confirm it arrives with the brief attached and reply-to set to the visitor address you typed.
7. Trip the limits once on purpose: 21 quick messages should return the "sending messages pretty fast" reply, and `chat.refused` lines should appear in the logs when a budget is exceeded.
8. Confirm the gateway usage mapping in production: in one `chat.usage` log line for an Opus reply, `cacheReadTokens` should be non-zero from the second message of a conversation on, and `inputTokens` should be the uncached remainder (not the total). If both are zero, prompt caching is not reaching Anthropic through the gateway and `costUsd` is being over-counted.
9. Watch the first week of `chat.usage` lines (Vercel → Logs, filter `chat.usage`) and tune `IP_DAILY_BUDGET_USD`, `GLOBAL_SOFT_BUDGET_USD`, and `GLOBAL_HARD_BUDGET_USD` in `lib/chat-limits.ts` if the defaults are too tight or too loose.

**AI Gateway setup:** enable AI Gateway in the Vercel dashboard (**Project → AI Gateway**). For local dev, run `vercel link` then `vercel env pull .env.local` — this provisions a short-lived `VERCEL_OIDC_TOKEN` (~24 h). The floating chatbot (`app/components/ChatWidget.tsx`) and contact-form classifier both route through the gateway.

## Deploy (Vercel)

Region: `iad1`. Build command: `npm run vercel-build` → `npm run build`.

1. **Import** this Git repo into Vercel.
2. **Root Directory:** leave empty (app lives at repo root).
3. **Framework:** Next.js (auto-detected).
4. **Environment variables:** Project → **Settings** → **Environment Variables**.
5. **Domain:** Settings → Domains → attach `majidmemari.com` and `www.majidmemari.com`.
6. **CLI:** from this repo root, `npx vercel link` once, then `npx vercel deploy --prod`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — ESLint

## Credits

Template adapted from [`memari-majid/nexus-website`](https://github.com/memari-majid/nexus-website).
