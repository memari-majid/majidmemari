# Majid Memari — Personal Site

Personal website for **Dr. Majid Memari** — AI engineer, educator, and NVIDIA Ambassador.

Live at [majidmemari.com](https://majidmemari.com)

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript 5.8
- [Vercel AI SDK](https://sdk.vercel.ai/) + OpenAI (chat widget + contact-form classifier)
- [Resend](https://resend.com) for outbound email (optional)
- Deployed on [Vercel](https://vercel.com) in `iad1`

## Sections

- **About** — bio, photo, headline stats
- **Work** — projects, agentic workflows, "Try my AI" apps, market pulse, collaboration highlights
- **Teaching** — NVIDIA DLI workshops + EdTech entrepreneurship course
- **Mentorship** — student interns and how to apply
- **Contact** — form (with AI inquiry classification) + FAQ

## Theme & layout

- **Dark/light:** `next-themes` with Tailwind v4 class-based `dark:` (toggle in the nav). Default theme is dark.
- **Floating chat widget:** AI assistant grounded in Dr. Memari's work — answers questions about projects, workshops, mentorship, and how to get in touch.
- **Mobile:** safe-area aware, full-screen chat on small viewports, horizontal scroll for the workflow diagram.

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
| `OPENAI_API_KEY` | Required for the floating chat assistant (`/api/chat`) and contact-form classification. |
| `OPENAI_MODEL` | Optional. Default: `gpt-5.4-mini` |
| `CONTACT_CLASSIFY_MODEL` | Optional. Model for inquiry classification + auto-reply. Default: `gpt-4o-mini` |
| `RESEND_API_KEY` | Optional. If set, contact form + chat lead form send email via [Resend](https://resend.com). |
| `RESEND_FROM_EMAIL` | Verified sender in Resend (e.g. `Majid Memari <hello@majidmemari.com>`). |
| `CONTACT_TO_EMAIL` | Inbox for inquiries. Default: `memari.majid@hotmail.com` |

Without `RESEND_API_KEY`, contact submissions are logged on the server only — configure Resend for production email delivery.

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
