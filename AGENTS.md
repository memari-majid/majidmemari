# AGENTS: how to update majidmemari.com

Instructions for AI assistants working in this repo. **Read this before editing copy, names, the
chat prompt, the assistant surface, or anything under `evals/`.**

| | |
|---|---|
| **Live** | https://www.majidmemari.com |
| **What it is** | Majid Memari's personal site: bio, teaching, publications, mentorship, contact, and the AI Consultant agent |
| **Sibling repo** | `../nexus-website` (nexusaisolution.net). Its [`AGENTS.md`](../nexus-website/AGENTS.md) is the long form of the shared rules; sections 9.1, 9.2, 9.3 and 10 are quoted here because they bind this repo too |
| **Status and detail** | [`README.md`](./README.md), including the "Known divergences" list at the end |

Two rules to read before anything else: this repo has **no test runner**, so a change that needs a
test belongs in the company repo's `lib/*.test.ts` and the code here is written to the same shape;
and **do not commit, push, or deploy** unless the owner asks.

---

## Hard policies (do not break)

### 1. Naming (owner override, 2026-09-13, do not revert)

The assistant is the **"AI Consultant"**.

Inside the chat surface only (the system prompt in `lib/assistant.ts`, tool descriptions and hints,
card copy, the emails the agent sends, and the inline demo "What it does" tab where it describes the
agent) the founder is called **"Dr. Memari"**. This is deliberate. It is not a typo, and it is not a
leftover to be normalized away.

Everywhere else, in website copy, metadata, JSON-LD, headings and alt text, he is
**"Majid Memari, PhD"** (`SITE.fullName`, `FOUNDER_SITE_NAME`).

- Names live in `lib/chat-persona.ts` and nowhere else. Do not hardcode the assistant name or
  either founder name in a component, a prompt, or a doc.
- **Never "Dr. Majid Memari", and never "Ph.D." with periods.** The written form is **PhD**, in
  page copy, headings, alt text, metadata and JSON-LD description strings. The one exception is
  structured data that schema.org consumers read literally: the `honorificSuffix` field in
  `lib/seo.ts` stays `"Ph.D."`, and so does `honorificPrefix`. Do not normalize those two fields.
- **Never rename by blanket substitution.** The tool keys `handOffToMajid` and `emailMajidNote`,
  the module `lib/majid.ts`, and the domain majidmemari.com all contain the name and must not
  change.
- The `alternateName` list in `lib/seo.ts` legitimately carries "Dr. Majid Memari" and
  "Majid (MJ) Memari" as names people search for. That entry is structured data about him, not
  site copy, and it stays.
- Widget badge must not repeat the word "Consultant": it is `Majid's AI` here and `Nexus AI` on
  nexusaisolution.net.

Same rule, company side: `../nexus-website/AGENTS.md` 9.1.

### 2. Parity with the company site (owner rule, 2026-09-13)

This site runs the same agent, the same component split, the same inline demo and an evaluations
panel built from the same three scripts as nexusaisolution.net, **worded in the first person** and
never leading with the company. The panels are not the same panel: the artifacts behind them have
different shapes on purpose, see the bullet below.

- `lib/chat-persona.ts` exports the **same names in the same order** in both repos, so the two
  files diff by eye. The block marked SHARED NAMES is the contract; only values differ (the badge,
  the tagline). Everything under SITE-LOCAL is this site's own, and the compatibility aliases at
  the bottom exist only until their last caller is converted. Add a name to one repo and add it to
  the other in the same position.
- Limiter contracts are **not** ported by eye. `lib/rate-limit.ts` here and there must agree on
  behaviour, not on wording: a reservation is taken before the model runs, settled against actual
  usage, and a cancelled or abandoned run **settles upward only**. It is never refunded below the
  reserved estimate, because a refund on abandon is how real gateway spend escapes both the eval
  sub-budget and the hard cap.
- Known, sanctioned differences in the tool set: `emailWorkshopInfo` is NVIDIA-catalog specific
  and exists only on the company site; `offerOfficeHours` is UVU specific and exists only here.
  Ten tools each, nine of them shared.
- This site has **no `/how-it-works` route**. The public teardown lives in the inline demo's
  "What it does" tab, which is this site's sanctioned teardown surface. If that route is ever
  ported from `../nexus-website/app/how-it-works/page.tsx`, add it to `INDEXABLE_PATHS` in
  `lib/seo.ts` in append-only position and link it from the widget toolbar and the demo header.
- **Eval-run contract, both repos.** A refusal that happens *before* any model call gives the
  visitor the run back; any run where a model was actually called keeps both the run count and the
  money. There is no refund path for a run that already spent.
- **Published eval artifacts have different shapes, on purpose.** The company site writes judge
  scores back into `evals/results/bakeoff-latest.json`; this site keeps `bakeoff-latest.json` and
  `judge-latest.json` separate and joins them at read time. Both are fed by the same three scripts,
  and converging the two shapes is a scheduled job, not a bug to fix in passing.
- **One reply, one judge, both repos (owner decision, 2026-09-13).** `evals/judge.ts` picks the
  judge **per row**, ruling out only the model that wrote that reply, so every reply is scored by a
  model that did not write it and a bake-off may race every model on the allowlist. Picking one
  judge for the whole table is the bug this replaced: it needed a model nobody had entered, so a
  four-model bake-off of four allowlisted models could not be scored at all. Because different rows
  now carry different judges, the pairing is published per row (here `judgeModel` and `judgeLabel`
  on each verdict in `judge-latest.json`, which is `schemaVersion` 2 and has **no top-level judge
  field**; on the company site the `judgeLine` note that names every pairing), the panel names the
  judge in the row rather than one judge under the table, and the reader drops any verdict whose
  judge is the model that wrote the reply. Do not reintroduce a single top-level judge name in
  either repo: a summary that can disagree with the rows is how "no model scored its own reply"
  stops being checkable.
- **A turn that delivers nothing is recovered, not left empty (owner decision, 2026-09-13, both
  repos).** Measured on this site that day: `google/gemini-3.8-flash` cannot answer a **second** turn
  against this site's system prompt. Through the OpenAI-compatible endpoint the bake-off uses it ended
  with `finish_reason: "error"` after 763 to 1,284 completion tokens, all of them reasoning, and zero
  characters of text, HTTP 200 throughout. Through the production path (`streamText` with one prior
  assistant turn in `messages`) it ended with `finishReason: "error"` after 422 output tokens, 358 of
  them reasoning and 64 text tokens that were never delivered, and zero characters received. Every
  attempt, at least eight. The first turn always works, and the same model, SDK and conversation
  against the company site's prompt returned a normal reply, so it is this prompt on this model.
  Bisecting puts it in the "YOUR TOOLS AND WHEN TO USE THEM" paragraph, where both halves and the
  `draftConsultingBrief` line each fail on their own, so it is not one phrase. **The root cause is
  the provider's and the fix is ours.** Two decisions follow, and they bind both repos.
  1. **`/api/chat` recovers the turn.** A turn that hands the visitor nothing at all, whether the
     stream ends in an error or ends clean with zero characters, is run once more on the fallback
     model. At most once; never when anything already reached the visitor (text, a tool card, an
     approval request or a data part, because an approval legitimately ends a turn with no text and
     retrying it would ask for the same send twice); and never on the model that just failed, so a
     failing fallback model ends in a sentence rather than a second call on the same model. The
     visitor is told, in one plain sentence inside the reply, which model returned an error and which
     model answered instead, and the metadata carries `errorFallback` beside the existing
     `budgetFallback` with `requestedModel` naming the model that failed. A retry that also delivers
     nothing ends in a plain apology and the contact line: **no path ends in an empty bubble.**
     **Both calls are charged.** The failed call really did burn tokens, so it tops up and is never
     settled downward, and the second call's cost is added on top of what the first already holds:
     the same rule `/api/evals/run` follows for an abandoned run, and the reason is the same, a
     refund here is spend the books cannot see. One `chat.usage` line per model call, same JSON
     shape, with `outcome` of `no-reply`, `recovered`, `finished` or `aborted` and an `attempt`
     number, so the owner can count how often it happens and on which model.
  2. **The published table says what is missing.** `evals/bakeoff.ts` retries a model once and then
     stops the whole run rather than writing a row it could not measure, so the published artifact
     can carry fewer rows than the picker offers; `bakeoff-latest.json` carries three on 2026-09-13.
     The Evaluations panel names the allowlisted models that are not in the table, says the bake-off
     refuses to publish a row it could not measure, and points at the chat fallback. The list is
     derived from the artifact, never hardcoded, so the note disappears by itself when a run races
     the whole allowlist again.

  **Do not reword the tools paragraph to work around this.** `renderedPrompt()` is hashed into
  `evals/results/bakeoff-latest.json` and a reworded prompt publishes a hash that describes nothing
  the site runs. **Do not drop Gemini 3.8 Flash from the allowlist**: it answers a first turn, it is
  the cheapest option, and it is a judge of rows in the published table. The fallback is the fix, and
  the picker's own note for that model says what was measured rather than implying every entry
  behaves the same.
- **Mobile keyboard.** Both chat shells handle the on-screen keyboard with the flex-column,
  one-scroller layout, and deliberately not with `interactiveWidget`. Do not add that viewport flag.
- **Transcript scroller keyboard access, both repos.** `app/components/chat/ConversationView.tsx`
  in each repo gives the transcript scroller `tabIndex={0}`, `role="log"`, `aria-live="off"`, an
  `aria-label` built from `ASSISTANT_NAME`, and an inset focus ring, so a keyboard-only or
  switch-access visitor can scroll back through replies. `aria-live="off"` is load-bearing: the
  role carries an implicit polite live region and both frames already announce each finished reply,
  so dropping it reads a streamed reply out twice. Only the ring token differs, because the
  palettes do (`sky-500` here, `brand-500` there), and it is applied at the call site rather than
  folded into a shared class constant, because not every consumer of that constant is meant to
  become a tab stop.
- **Classifier pricing, one resolver, both repos (closed 2026-09-13).** The contact-form classifier
  resolves its rates once: explicit `CONTACT_CLASSIFY_RATES` from the environment, then the
  `CONTACT_CLASSIFY_RATES` table in `lib/chat-limits.ts`, then the picker's published price if the
  slug happens to be on the chat allowlist, then `UNPRICED_MODEL_RATES`. The reservation, the
  failure floor and the settle all read that one pair. Every exit path settles, and **three of them
  settle at the floor**: a failure, because a visitor who controls the message can choose to make
  the call fail, and a success whose usage comes back zero or unparsable, because `tokenBreakdown`
  reads an absent usage block as all zeros and `settle` reads a zero as "spend nothing" and hands
  the whole reservation back. A provider that stops reporting usage must not make every
  classification free and take the form back out of the cap it was just put inside. Same rule the
  chat route states as "a step with no reported usage is charged at the precharge estimate, never
  free". The pricing helpers carry the same export names in the same order in both
  `lib/chat-limits.ts` files, so they diff by eye, and their regression tests live in the company
  repo's `lib/chat-limits.test.ts` and `lib/inquiry.test.ts`.
- **A rate-limited or budget-refused submission is still delivered, both repos (owner rule,
  2026-09-13).** The cap belongs on the model call, not on the email: the email is the product and
  it costs no model money, so a refused submission skips the classifier, spends nothing, is logged
  with its outcome, and reaches the inbox with the fixed acknowledgment, answering `ok: true`. The
  contact route never answers 429, because answering 429 to a message that already arrived invites
  the visitor to send it again, and the choice is between dropping a real inquiry and delivering it
  unclassified. This is the opposite of the chat route, which does answer 429 and stop, and that is
  deliberate: a refused chat turn has nothing left to deliver. `ContactForm.tsx` reads that response
  the same way it reads any success, so the visitor sees "Message received", the fallback
  acknowledgment and "Routed as: General inquiry"; do not add a 429 branch to it.
- **The `contact.usage` line names the outcome, and both repos' lines read the same way.** Five
  values here: `classified`, `unmeasured` (a success the gateway did not measure, charged at the
  floor), `failed`, `refused` (with `refusedBy`) and `rate-limited`. The company site currently
  folds `unmeasured` into `classified` and tells the two apart by `costUsd`; splitting it is this
  site's addition and is worth porting rather than reverting, because a run of `unmeasured` lines
  is a provider that stopped reporting usage, not a cheap day.
- Anything else that diverges gets written down in the "Known divergences" section of
  `README.md`, with the reason. An undocumented divergence reads as an omission.

Same rule, company side: `../nexus-website/AGENTS.md` 9.2.

### 3. Assistant surface and cost posture (do not change one half)

The homepage carries the inline "Try my AI" demo (tabs: Chat, What it does, Evaluations) and the
floating widget covers the rest of the site. Both render one conversation against one `Chat`
instance in `app/components/chat/chatStore.ts`.

Cost posture, and do not change one of these without the others:

- The demo opens on the **cheaper model** (`chatStore.ts` seeds the fallback model); the picker
  still offers all four.
- Every model call passes through `reserveBudget`, which is the **only global hard ceiling**, and
  is never skipped on any path.
- Live evaluation runs draw on the `GLOBAL_EVAL_USD_PER_DAY` sub-budget and the per-IP daily run
  count in `lib/chat-limits.ts`, held by `reserveEvalRun` **before** the first contestant call, and
  counted whether or not the visitor stays to see the result.
- **A visitor may stop a run; stopping ends the stream and the accounting, and never returns the
  money.** Both panels carry one two-state button rather than a disabled one, so nobody watches a
  control they cannot press while models spend. The legs already in flight still land and still
  raise the charge with the run's running total, never lower it, and the judge leg is not started
  on a stopped run. Same sentence, company side: `../nexus-website/AGENTS.md` 9.3.
- With no shared counter store (Upstash), the live run refuses, says so, and spends nothing. That
  is the safe default, not a bug to fix.
- **One chat turn may be two model calls, and both are charged.** A turn that delivers nothing is
  recovered once on the fallback model (rule 2 above). The failed call tops up and is never settled
  downward, exactly as an abandoned eval run does, and the reply says which model answered.
- **Every visitor-triggerable model call is capped**, the contact-form classifier
  (`lib/inquiry-ai.ts`, called from `app/api/contact/route.ts`) included: it passes `checkRate`
  and `reserveBudget`, settles against real usage or at the floor when there is none to read, and
  logs one `contact.usage` line. Either gate refusing skips the classifier and spends nothing; it
  never refuses the submission, which is delivered unclassified (rule 2 above). If you add a new
  model call anywhere, it goes through the limiter too. There is no "it is only cheap" exemption.

Same rule, company side: `../nexus-website/AGENTS.md` 9.3.

### 4. Market geography (owner rule, 2026-09-13)

**Utah is the home base, not the market boundary.** The market is the **United States**
(`SITE.serviceArea`). Consulting and training are delivered in person at the client offices
anywhere in the US, or online.

- Never write a line that reads as a Utah-only service area, and never ask a visitor whether they
  are in Utah before helping them.
- **Keep the factual Utah references**, they are credentials and real work: the Orem UT address,
  Utah Valley University teaching, University of Utah One-U Responsible AI, the GridEye and
  PacifiCorp collaboration, Utah public-sector work, the 2026 AI Utah 100 honoree line, Silicon
  Slopes involvement.

Same rule, company side: `../nexus-website/AGENTS.md` 10.

### 5. Copy voice

- **First person.** This is his own site. It never leads with the company, and the assistant says
  it is an AI agent rather than him.
- **No em dashes or en dashes** in anything a visitor or the model can read: pages, prompt, tool
  descriptions, card copy, emails. `lib/plain-punctuation.ts` enforces it for the interpolated bio
  text in the prompt; the rest is on you. Sweep for U+2014 and U+2013 before shipping.
- **No trailing periods in headlines.**
- **Never imply NVIDIA endorsement.** DLI Certified Instructor is a credential, not a partnership.
- Do not invent grants, awards, citation counts, partners, or a $1M USHE award. GridEye is a
  proposal in development.

### 6. UVU, and what only this site may say

The company site omits current UVU employment (conflict of interest). **This site is where that
detail belongs**: the faculty role, the Fall 2026 courses, the office-hours booking link behind
`offerOfficeHours`, and the academic contact path. Do not copy it back to nexusaisolution.net, and
do not publish UVU catalog numbers or course codes here.

### 7. Evaluations

`evals/` holds the scripts and the checked-in artifacts the Evaluations tab renders.

- **A score exists only if someone measured it.** Never hand-edit a number, a rubric score, a
  `promptHash`, or a `gitSha` into `evals/results/*.json`. Regenerate with the script.
- A field nobody measured is `null`, and the page says so rather than showing a number.
- **No model scores its own reply, and the judge is picked per reply** (rule 2 above). A row nobody
  could score renders as "not scored" in both the Score and the Scored by column; if nothing at all
  was scored, `evals/judge.ts` writes no file and exits non-zero.
- The bake-off renders the prompt with `emailEnabled: false` to match production, or the published
  `promptHash` describes a prompt the site never sends. Republish after any prompt change.
- **The published table may carry fewer rows than the picker offers.** `evals/bakeoff.ts` retries a
  model once and then stops the whole run rather than writing a row it could not measure, and a row
  of zeros priced and timed like any other is worse than no row. When a run is published without a
  model, the panel names it and says why (rule 2 above). Do not fill the gap from an older run.
- A published row and a live run are different measurements (two turns at 2,000 output tokens
  versus one turn at 600). They render in separate blocks, with their shapes labelled, and a live
  number never overwrites a published cell.
- Running a script costs real money. Do not run `evals/bakeoff.ts`, `evals/judge.ts` or
  `evals/tool-smoke.ts` unless the owner asks for that run.

---

## Edit map (change a fact once)

| If you need to change... | Edit this file first | Then check |
|---|---|---|
| Assistant and founder names | `lib/chat-persona.ts` | Widget, inline demo, prompt, emails, and the same module in `../nexus-website` |
| Chat personality, facts, geography | `lib/assistant.ts` | `lib/chat-tools.ts` hints, `lib/site-facts.ts` |
| Agent tools (ten) | `lib/chat-tools.ts` | Cards in `app/components/chat/`, `chat-ui.ts` copy, `evals/tool-smoke.ts` |
| Grounded facts the lookup tool may cite | `lib/site-facts.ts` | Only re-export facts that already live in a data module or a published artifact |
| Bio, credentials, courses, links | `lib/majid.ts` | `lib/seo.ts`, About and Teaching pages |
| Site name, address, service area, inboxes | `lib/site.ts` | Footer, contact, JSON-LD |
| Metadata and structured data | `lib/seo.ts` | `INDEXABLE_PATHS` is append-only; sitemap and canonical URLs follow it |
| Rate limits, budgets, eval caps | `lib/chat-limits.ts` | `lib/rate-limit.ts` (server only, never imported by a client component), `/api/chat`, `/api/evals/run`, `vercel.json` |
| Model list, prices, default model | `lib/chat-models.ts` | Picker, per-reply cost, `evals/bakeoff.ts` |
| Inline demo default model | `app/components/chat/chatStore.ts` | Section copy on the homepage, rule 3 above |
| Chat UI | `app/components/ChatWidget.tsx` (floating), `app/components/chat/` (shared shell, cards, demo) | Both shells share one store; sanitize model output, never leak tool or channel tokens |
| Published eval results | `evals/results/*.json` | Regenerate with the script, never by hand; `lib/evals.ts` parses, `EvalPanel` renders |
| Email templates | `lib/email.ts`, `lib/brief-email.ts`, `lib/handoff-email.ts`, `lib/note-email.ts` | Fixed templates only, scrubbed fields, `CONTACT_TO_EMAIL` as reply-to |
| Prompt punctuation | `lib/plain-punctuation.ts` | Every rendered prompt passes through it |

**Do not** hardcode a name, a course title, or an NVIDIA claim in a component. Read it from the
modules above.

---

## Before you hand work back

```bash
cd /home/majid/Downloads/Sites/majidmemari
./node_modules/.bin/tsc --noEmit && npm run lint
```

There is no test runner here by design. If a change needs a regression test, put it in
`../nexus-website/lib/*.test.ts` against the shared contract and keep this repo's code in the same
shape so the two diff by eye. `npm run build` and any deploy are the owner's call.
