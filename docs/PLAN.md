# Plan — majidmemari.com

**Last updated:** 2026-09-13  
**Repo:** https://github.com/memari-majid/majidmemari  
**This is the only living plan.** Do not add competing plan files.

Restore and keep the personal site live after the Vercel project was deleted. Keep Majid’s public bio aligned with `lib/majid.ts` (same facts file as `nexus-website`).

| Track | Status | Notes |
|---|---|---|
| **Vercel project** | Recreated | `majidmemari` on team `memari-majids-projects`, GitHub `memari-majid/majidmemari` |
| **Domain** | Re-attach | `majidmemari.com` (Vercel registrar) + `www` |
| **Copy** | Synced 2026-08-27 | Public bio is Academia · Industry · Community. Homepage leads with **active flagship projects and named collaborators**, not Scholar counts (list stays on `/publications`). Hero stats: see **Hero stats** track (`lib/majid.ts` `heroStats`). Partners strip (`#partners`): State (Herbert Institute, Utah Office of Data Privacy, DHHS) · Universities (UVU home + School of Education / AI-ClassSims; One-U RAI public/policy; GridEye collaboration) · Silicon Slopes (community) · Industry (Clarion AI Partners consulting on LLM/agent workflows; **NVIDIA Certified Instructor Directory** listing — instructional certification, not a client). No invented client counts. **2026 AI Utah 100 honoree** (no category). NVIDIA DLI listing: `https://www.nvidia.com/en-eu/training/instructor-directory/bio/?instructorId=003Vv00000J9hZLIAZ`. **Never put catalog numbers on public pages.** Featured teaching: **AI Entrepreneurship: Build and Launch AI-Powered Businesses** (title + tagline). Students discover a real problem, build no-code AI, and launch a working AI-powered business — any industry they choose. Mentors / Demo Day with [Baugh Entrepreneurship Institute](https://www.uvu.edu/entrepreneurship/). Do not invent partner names, enrollment, or a launched Nexus entrepreneurship SKU. AI-ClassSims / AI-STER stay research projects, not the course theme. |
| **Hero stats** | Done 2026-08-28 | `#top` H1: **Majid Memari** / **AI Scientist & Solution Architect** / Applied AI at UVU / AI Entrepreneurship and research that ships. Grid: **11** Years applied AI & CS; **PhD** in Gen AI (diploma is CS, SIU 2023 — public label only); **374** Scholar citations; **AI Utah 100** Honoree, 2026 (links to [aiutah.org/ai-utah-100](https://www.aiutah.org/ai-utah-100/)). No winner / #1 / category. **Faculty / UVU dropped** as cell 4. Same `heroStats` on `nexus-website`. |
| **Design** | Sleek pass 2026-08-27 | Quiet zinc system: matching partner marks (no lone Silicon Slopes PNG), pill CTAs (`btn-primary` / `btn-secondary`), static gradient text, cards without lift/glow. |
| **Env / AI** | Restore | Public URLs, Resend, AI Gateway models — no secrets in git |
| **SEO / Google** | Keywords pass 2026-08-28 · market pass 2026-09-13 | Titles/JSON-LD match **Majid Memari**, **AI Scientist**, **AI Solution Architect**, **PhD in Gen AI**, **Applied AI**, **AI Entrepreneurship**, **AI Utah 100 honoree**. UVU is supporting. Canonical **www**. Sitemap/robots kept. **Majid must still** verify Search Console + submit sitemap and add Scholar/ORCID/ResearchGate/LinkedIn/UVU directory → majidmemari.com. **2026-09-13 market pass:** client-work copy, titles, descriptions and `Person.makesOffer.areaServed` now say the **United States**, and every page title uses a colon instead of an em-dash. |
| **Publications** | Synced 2026-08-25 | Counts and selected list from [Google Scholar](https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en) (20+ unique works). Do not invent citation counts. New 2026 item: Capability Ladder (arXiv:2608.07779) |
| **Phone / voice AI** | On Nexus, not here | Public `(801) 810-9152` is Google Voice. AI engine is `nexus-website` `/api/voice` (GV → hidden Twilio → Vercel). |

---

## Sources of truth (do not invent)

- Identity / bio: `Teaching/uvu_courses/template/instructor_profile.py`
- Tenure facts: `Teaching/uvu_courses/portfolio/tenure/data/`
- Courses this term: `Teaching/uvu_courses/template/course_config.py` (`CURRENT_SEMESTER`)
- Site constants: `lib/site.ts`

Integrity rules from the instructor profile: do not invent degrees, grants, employers, or metrics. Stanford / Johns Hopkins are Penn collaborations, not employers. Silicon Slopes is community, not a job. NVIDIA DLI is instructional certification. Public bio stays in **Academia / Industry / Community**. AI Utah 100 (2026): say **honoree**; do not invent a winner, rank, or category.

Industry client work (consulting, workshops, team training) stays in the Industry paragraph — do not mix Herbert / DHHS / AI Utah 100 into Industry, or Clarion / Nexus / Potentia into Academia.

---

## Fall 2026 teaching (public site)

**Never mention catalog numbers on public pages.** People do not know those codes. Internal TypeScript keys (`cs4720r`, `fall2026Courses`) may stay.

Public display names only (offerings where `instructor: majid` and `teaching_this_term: True`):

- Fundamentals of Programming (online)
- Causal Inference (online)
- Machine Learning (online, MS-AAI)
- **AI Entrepreneurship: Build and Launch AI-Powered Businesses** (in-person). Featured as title + tagline. Students discover a real problem, build no-code AI, and launch a working AI-powered business — end to end, any industry they choose. Capabilities first, then Lean Startup; mentors / Demo Day with UVU’s Baugh Entrepreneurship Institute. Do not invent partner names or enrollment. Do not frame the course as EdTech / K-12.

Do **not** list instructor-TBD graduate shells or the canceled special-topics offering.

### LinkedIn (paste; this machine cannot edit the profile)

**About / UVU experience bullet:** Designed and teach AI Entrepreneurship: Build and Launch AI-Powered Businesses at UVU. Students discover a real problem, build no-code AI, and launch a working AI-powered business — end to end, in any industry they choose.

**Optional post:** At UVU I designed and teach AI Entrepreneurship: Build and Launch AI-Powered Businesses. Students discover a real problem, build no-code AI, and launch a working business — any industry they choose. Mentors and Demo Day with UVU’s Baugh Entrepreneurship Institute. Fall 2026, in person. More: https://www.majidmemari.com/teaching

---

## SEO (organic search)

**Intent this site owns:** branded **Majid Memari**; **AI Scientist** / **AI Solution Architect**; **PhD in Gen AI** (diploma is CS, SIU 2023 — public label only); **Applied AI**; **AI Entrepreneurship / Build and Launch AI-Powered Businesses**; **2026 AI Utah 100 honoree** (no category). UVU is supporting, not the lead keyword. Nexus is the *company* result — do not clone its consulting pitch here.

**SEO keywords (on-page + metadata, no stuffing):** Majid Memari · AI Scientist · AI Solution Architect · PhD in Gen AI / generative AI · Applied AI · AI Entrepreneurship · Utah Valley University (supporting) · AI Utah 100 honoree 2026 · 11 years applied AI · 374 Scholar citations (sourced snapshot only).

**Market framing (owner rule, 2026-09-13).** Utah is the home base, not the market boundary. Client-facing copy says he works with teams **across the United States**, on site at your offices or online: hero, page titles, meta descriptions, keywords, `Person.makesOffer.areaServed`, the FAQ, and the chat prompt geography. `SITE.serviceArea` in `lib/site.ts` is the single source for the market string. Never write “Utah-based”, “serving Utah”, or any state, region or travel-radius limit, and never ask a visitor whether they are in Utah before helping.

These Utah references are **facts that build trust, not market limits**, and stay exactly as they are: Utah Valley University employment and teaching; the Gary R. Herbert Institute for Public Policy, the Utah Office of Data Privacy and Utah DHHS collaborations; the University of Utah One-U Responsible AI work; GridEye with PacifiCorp; Silicon Slopes community involvement; the 2026 AI Utah 100 honoree line; and the Orem, UT address with its `PostalAddress` schema.

**Shipped (2026-08-27)**

- Unique title/description per URL (`/`, `/about`, `/teaching`, `/publications`, `/contact`)
- Person + WebSite JSON-LD (no fake SearchAction). Course JSON-LD for AI Entrepreneurship **without catalog codes**. FAQPage from on-page FAQs. ScholarlyArticle list on `/publications`
- `sitemap.xml` covers all indexable pages; `robots.txt` allows `/`, disallows `/api/`, `host` = `https://www.majidmemari.com`
- Apex `majidmemari.com` already 308s to **www** (keep `NEXT_PUBLIC_SITE_URL=https://www.majidmemari.com`)
- Homepage links to `/teaching`, `/publications`, `/about`; headings use “AI Entrepreneurship” / “applied AI”
- LinkedIn paste (above) stays the off-site teaching copy — no course codes

**Planned — Majid must click (this machine cannot finish)**

1. [Google Search Console](https://search.google.com/search-console) → add URL-prefix property `https://www.majidmemari.com` → verify (HTML file or DNS) → Sitemaps → submit `https://www.majidmemari.com/sitemap.xml` → URL Inspection → Request indexing for `/`, `/about`, `/teaching`, `/publications`, `/contact`
2. **Google Scholar** → profile edit → Homepage → `https://www.majidmemari.com`
3. **LinkedIn** → Contact info / Website → `https://www.majidmemari.com` (and Featured). Paste the About / experience bullet above
4. **ORCID** → Websites → `https://www.majidmemari.com`
5. **ResearchGate** → Website → `https://www.majidmemari.com`
6. **UVU directory** — replace or add website (today it is Book With Me / tinyurl). Use `https://www.majidmemari.com`
7. **NVIDIA instructor directory** — if the listing is editable, add the personal site
8. **GitHub** profile website — already pointed here; keep it

Do **not** buy links, spam directories, or invent reviews. Do not create a fake Google Business Profile for a personal faculty site. No Knowledge Panel request until those profile links exist.

Do not expect same-day ranking. After those links exist, recrawl usually takes days to a few weeks.

---

## Phone / voice assistant

The published business line **(801) 810-9152** is **Google Voice** on **nexusaisolution.net**, not this personal site. Incoming-call AI lives in `nexus-website` (`/api/voice`): Google Voice forwards to a hidden Twilio number, which POSTs TwiML webhooks to Vercel. The UVU office phone is not an AI answering line. See `nexus-website/docs/PLAN.md`.

---

## Next

1. Keep production on `iad1` (`vercel.json`).
2. After copy or env changes: `npx vercel deploy --prod` from this repo, or push `main`.
3. Enable **AI Gateway** on the new Vercel project if the floating chat or contact classifier 503s.
4. Commit local site updates when ready so GitHub-triggered deploys match production.
