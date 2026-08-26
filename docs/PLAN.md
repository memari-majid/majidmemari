# Plan — majidmemari.com

**Last updated:** 2026-08-26  
**Repo:** https://github.com/memari-majid/majidmemari  
**This is the only living plan.** Do not add competing plan files.

Restore and keep the personal site live after the Vercel project was deleted. Keep Majid’s public bio aligned with `lib/majid.ts` (same facts file as `nexus-website`).

| Track | Status | Notes |
|---|---|---|
| **Vercel project** | Recreated | `majidmemari` on team `memari-majids-projects`, GitHub `memari-majid/majidmemari` |
| **Domain** | Re-attach | `majidmemari.com` (Vercel registrar) + `www` |
| **Copy** | Synced 2026-08-26 | Public bio is Academia · Industry · Community. Homepage leads with **active flagship projects and named collaborators**, not Scholar counts (list stays on `/publications`). Hero stats: 6 flagship projects, courses & DLI workshops, student researchers, Fall 2026 UVU courses. Partners strip (`#partners`): State (Herbert Institute, Utah Office of Data Privacy, DHHS) · Universities (UVU home + School of Education / AI-ClassSims; One-U RAI public/policy; GridEye collaboration) · Silicon Slopes (community) · Industry (Clarion AI Partners consulting on LLM/agent workflows). No invented client counts. **Selected for the 2026 AI Utah 100**. |
| **Env / AI** | Restore | Public URLs, Resend, AI Gateway models — no secrets in git |
| **SEO / Google** | Live 2026-08-25 | `/about`, `/teaching`, `/publications`, Person JSON-LD, sitemap. GitHub profile website + profile README point here. Ranking still depends on backlinks from Scholar / UVU / LinkedIn / ORCID / ResearchGate |
| **Publications** | Synced 2026-08-25 | Counts and selected list from [Google Scholar](https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en) (20+ unique works). Do not invent citation counts. New 2026 item: Capability Ladder (arXiv:2608.07779) |
| **Phone / voice AI** | On Nexus, not here | Public `(801) 810-9152` is Google Voice. AI engine is `nexus-website` `/api/voice` (GV → hidden Twilio → Vercel). |

---

## Sources of truth (do not invent)

- Identity / bio: `Teaching/uvu_courses/template/instructor_profile.py`
- Tenure facts: `Teaching/uvu_courses/portfolio/tenure/data/`
- Courses this term: `Teaching/uvu_courses/template/course_config.py` (`CURRENT_SEMESTER`)
- Site constants: `lib/site.ts`

Integrity rules from the instructor profile: do not invent degrees, grants, employers, or metrics. Stanford / Johns Hopkins are Penn collaborations, not employers. Silicon Slopes is community, not a job. NVIDIA DLI is instructional certification. Public bio stays in **Academia / Industry / Community**. AI Utah 100 (2026): say **selected for**; do not invent a winner category.

Industry client work (consulting, workshops, team training) stays in the Industry paragraph — do not mix Herbert / DHHS / AI Utah 100 into Industry, or Clarion / Nexus / Potentia into Academia.

---

## Fall 2026 teaching (public site)

List only offerings where `instructor: majid` and `teaching_this_term: True`:

- CS-1400 X03 — Fundamentals of Programming (online)
- CS-2700 X01 — Causal Inference (online)
- CS 6470 X01 / X02 — Machine Learning (online, MS-AAI)
- CS 4720R 601 — AI Business and Tech Solutions (in-person)

Do **not** list CS 6530 / CS 6620 (instructor TBD) or canceled CS 4390R Fall 2026.

---

## Google “Majid Memari” (what actually moves the needle)

The SERP is already owned by Google Scholar, UVU directory, LinkedIn, ResearchGate, ORCID, and GitHub. A new personal site will not outrank those until they **link to** `https://www.majidmemari.com`.

**Done from this machine**

- GitHub profile website/bio → `https://www.majidmemari.com`
- Site schema `sameAs` those ranking profiles (including ORCID `0000-0001-5654-4996`)
- Indexable `/about` and `/teaching` (hash `#about` is not a Google URL)

**You must add the website on the profiles that already rank (10 minutes)**

1. **Google Scholar** → profile edit → Homepage → `https://www.majidmemari.com`
2. **LinkedIn** → Contact info / Website → `https://www.majidmemari.com` (and Featured)
3. **ORCID** → Websites → `https://www.majidmemari.com`
4. **ResearchGate** → Website → `https://www.majidmemari.com`
5. **UVU directory** — the current link (`tinyurl.com/473xe4wu`) is Book With Me, not the personal site. Add `https://www.majidmemari.com` as the website
6. **Google Search Console** — verify `www.majidmemari.com` and Request Indexing for `/`, `/about`, `/teaching`

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
