# Majid Memari — Personal Site

Personal website for **Dr. Majid Memari** — AI engineer, educator, and NVIDIA Ambassador.

Live at [majidmemari.com](https://majidmemari.com)

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
- **Teaching** — Building AI Solutions, university courses, and NVIDIA DLI workshops
- **Mentorship** — student interns and how to apply
- **Contact** — form (with AI inquiry classification) + FAQ

## Theme & layout

- **Dark/light:** `next-themes` with Tailwind v4 class-based `dark:` (toggle in the nav). Default theme is dark.
- **Mobile:** safe-area aware, horizontal scroll for the workflow diagram, responsive cards.

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
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (SEO, sitemap, JSON-LD). Default: `https://majidmemari.com` |
| `NEXT_PUBLIC_AI_CPA_URL` | Optional. Public URL for the AI Financial Assistant app (Try My AI section). |
| `NEXT_PUBLIC_AI_TA_URL` | Optional. Public URL for the CS 4720R AI teaching assistant. |
| `AI_CHAT_MODEL` | Optional. Model slug for the floating site chatbot (`/api/chat`) via Vercel AI Gateway. Default: `openai/gpt-oss-20b` |
| `WORKSHOP_TA_MODEL` | Optional. Model slug for the workshop teaching assistant (`/api/workshop-chat`) via Vercel AI Gateway. Default: `anthropic/claude-haiku-4.5` |
| `WORKSHOP_TA_CODE` | Optional room code. Required in production so the lab helper is not a public chatbot. Unset locally allows chat. |
| `CONTACT_CLASSIFY_MODEL` | Optional. Model slug for contact-form inquiry classification + a personalized auto-reply via AI Gateway. Default: `openai/gpt-oss-20b` |
| `AI_GATEWAY_API_KEY` | Optional fallback for non-Vercel environments. On Vercel, OIDC auth is automatic after enabling AI Gateway in project settings. |
| `RESEND_API_KEY` | Optional. If set, contact form sends email via [Resend](https://resend.com). |
| `RESEND_FROM_EMAIL` | Verified sender in Resend (e.g. `Majid Memari <hello@majidmemari.com>`). |
| `CONTACT_TO_EMAIL` | Inbox for inquiries. Default: `memari.majid@hotmail.com` |

Without `RESEND_API_KEY`, contact submissions are logged on the server only — configure Resend for production email delivery.

**AI Gateway setup:** enable AI Gateway in the Vercel dashboard (**Project → AI Gateway**). For local dev, run `vercel link` then `vercel env pull .env.local` — this provisions a short-lived `VERCEL_OIDC_TOKEN` (~24 h). The floating chatbot (`app/components/ChatWidget.tsx`), the workshop teaching assistant (`/api/workshop-chat`), and the contact-form classifier all route through the gateway. Set `WORKSHOP_TA_CODE` in production so the lab helper is not a public chatbot; leave it unset locally to allow chat.

## Deploy (Vercel)

### Building AI Solutions

The complete independent course is served from this project at
[Building AI Solutions](https://www.majidmemari.com/teaching/ai-solutions/index.html)
and featured on both the homepage and `/teaching`. Its HTML, simulations, styles,
worksheets, and portable ZIP are tracked under `public/teaching/ai-solutions/`.
They are served directly and do not depend on the separate course deployment.
The short `/teaching/ai-solutions` address redirects to the explicit HTML entry
so relative assets work with Next.js's existing trailing-slash rules.

To refresh the course, build and check its maintained source first, then run:

```sh
node scripts/sync-ai-course.mjs ../uvu_courses/courses/cs4720R/site/dist
npm run build
```

The sync accepts public output only, rejects hidden files and symlinks, and
records file hashes in `content/ai-solutions-release.json`. Commit the refreshed
public files and manifest with any integration changes. No private teaching
guides, partner records, Canvas records, or course source directory is deployed.
Keep the course ZIP's relative links intact so downloaded copies remain portable.

Learner notes live in browser storage. Notes on the separate course hostname do
not transfer automatically to the personal domain; students can use the course's
existing backup and restore controls to move their work. Hosting requires no new
database, accounts, environment variables, or AI service calls.

### Personal site deployment

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
