# AGENTS: how to update majidmemari.com

Instructions for AI assistants working in this repo. **Read this before editing copy, names, the
chat prompt, or the assistant surface.**

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
card copy, and the emails the agent sends) the founder is called **"Dr. Memari"**. This is
deliberate. It is not a typo, and it is not a leftover to be normalized away.

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

This site runs the same agent, the same component split and the same inline chat as
nexusaisolution.net, **worded in the first person** and never leading with the company.

- `lib/chat-persona.ts` exports the **same names in the same order** in both repos, so the two
  files diff by eye. The block marked SHARED NAMES is the contract; only values differ (the badge,
  the tagline). Everything under SITE-LOCAL is this site's own, and the compatibility aliases at
  the bottom exist only until their last caller is converted. Add a name to one repo and add it to
  the other in the same position.
- Limiter contracts are **not** ported by eye. `lib/rate-limit.ts` here and there must agree on
  behaviour, not on wording: a reservation is taken before the model runs, settled against actual
  usage, and a cancelled or abandoned run **settles upward only**. It is never refunded below the
  reserved estimate, because a refund on abandon is how real gateway spend escapes the hard cap.
- Known, sanctioned differences in the tool set: `emailWorkshopInfo` is NVIDIA-catalog specific
  and exists only on the company site; `offerOfficeHours` is UVU specific and exists only here.
  Ten tools each, nine of them shared.
- This site has **no `/how-it-works` route** and, since 2026-09-13, no teardown surface of any
  kind: the inline chat's "What it does" and "Evaluations" tabs went with the evaluation work
  (rule 7). Do not port the company site's page here, and do not add a tab, a link or a line of
  copy that explains how the assistant is built, unless the owner asks for it.
- **A turn that delivers nothing is recovered, not left empty (owner decision, 2026-09-13, both
  repos).** The rule was written when the allowlist carried a model that could not answer a second
  turn against this prompt; that model is gone, the rule stays. `/api/chat` runs a turn that hands
  the visitor nothing at all, whether the stream ends in an error or ends clean with zero
  characters, once more on the fallback model. At most once; never when anything already reached
  the visitor (text, a tool card, an approval request or a data part, because an approval
  legitimately ends a turn with no text and retrying it would ask for the same send twice); and
  never on the model that just failed. With one model on the allowlist the failed model is always
  the fallback, so the retry is a no-op and the turn ends in one plain sentence that names no model
  and points at the contact routes: **no path ends in an empty bubble, and no path names a model.**
  When two calls do happen, **both are charged.** The failed call really did burn tokens, so it
  tops up and is never settled downward, and the second call's cost is added on top of what the
  first already holds. One `chat.usage` line per model call, same JSON shape, with `outcome` of
  `no-reply`, `recovered`, `finished` or `aborted` and an `attempt` number, so the owner can count
  how often it happens.
- **On-screen approvals are server-verified, both repos (2026-09-13).** The transcript is the
  client's, and before this a forged `approval-responded` part for a call the model never made,
  with a self-chosen id and input, executed the send tool; only unconfigured email kept it inert.
  Now `streamText` gets `experimental_toolApprovalSecret` and signs every approval request it
  emits, the widget echoes `approval.signature` back, and the route's sanitizer verifies it with
  `lib/approval-signature.ts` (the same file in both repos: `signApproval`, `verifyApproval`,
  `signDraft`, `verifyDraft`, `approvalSecret`) before any budget is reserved. A part that does not
  verify stays `approval-responded` but becomes a decline with `FORGED_APPROVAL_REASON`, so the
  SDK's own denial path runs, emits `tool-output-denied`, and the card settles on screen instead
  of stalling with a Retry. (The company site rewrites the same part to `output-denied`, its
  AGENTS.md 9.2; the SDK signature-checks approved parts only, `validateApprovedToolApprovals`, so
  both states refuse before a tool runs and the difference is only whether the card settles.) The
  draft tools the send tools re-read from history
  (`draftConsultingBrief`, `assessReadiness`, `draftOutreachNote` here) sign their input into
  their output as `signature`, and the sanitizer drops a draft part that does not verify. The
  secret is `CHAT_APPROVAL_SECRET`; unset, it is derived from `RESEND_API_KEY`, else a per-instance
  random key with one warning. **Set it before or with the Resend pair.**
- **A declined send carries its reason (this repo).** An `approval-responded` part with
  `approved: false` in the final step is handed to the SDK with `DECLINED_APPROVAL_REASON` when the
  client sent none, so the model is told nothing was recorded and not to offer a retry chip,
  rather than left to guess ("both requests sit in the server log", measured). The company site
  passes the client's reason through and adds none; the finding was measured here only.
- **The reservation is a cold turn, both repos.** `prechargeEstimateUsd` prices the system prompt
  at the cache-write rate (never cache-read) and floors the prompt at `PROMPT_TOKENS_ESTIMATE`
  (11,000, measured as the 10,835-token cache write on a first turn). A burst of parallel first
  turns from one address is refused at the $1 cap instead of settling past it.
- **Stop ends the gateway call, both repos.** `streamText` gets `abortSignal: req.signal`, so a
  visitor's Stop or a closed tab runs the existing `onAbort` accounting (one `chat.usage` line with
  `outcome: "aborted"`) instead of the model running to completion on nobody's screen.
- **Anthropic calls are pinned to Anthropic first (`lib/gateway.ts`, both repos).** Every
  gateway call builds its `providerOptions` with `gatewayProviderOptions(feature, model)`, which
  adds `order: ["anthropic"]` for Anthropic models. Measured here: the gateway's default route,
  `vertexAnthropic`, wrote the prompt cache on three sequential calls five seconds apart and never
  read it; pinned, calls two and three read it. Fallback providers stay available. Prompt caching
  stays on: the route marks the system prompt `cacheControl: ephemeral` for every model with
  `promptCache: true`, which is the one model there is.
- **Prices are per model, both repos.** `ChatModel` carries `cacheReadPerM` and `cacheWritePerM`
  and `costUsd` reads them, so a future non-Anthropic entry is billed at its vendor's own cache
  prices rather than through a global multiplier.
- **The contact classifier defaults to `openai/gpt-4.1-nano`, both repos.** `openai/gpt-oss-20b`
  never returned a schema-valid object (99 of 99, measured). `classifyInquiry` asks for structured
  output and, when the SDK cannot validate it, reads the text once more with `parseInquiryText`
  (wrapper markup stripped, first JSON object, `acknowledgment` accepted for `autoReply`); the
  acknowledgment is passed through `siteNameOnly` so it never says "Dr. Memari" outside the chat.
  Production still carries its own `CONTACT_CLASSIFY_MODEL`; the owner sets it to this slug or
  removes it. Note the slug shapes: the gateway serves `anthropic/claude-haiku-4.5` with a dot (the
  chat model); the dash form `anthropic/claude-haiku-4-5` does not exist there and is priced in
  `CONTACT_CLASSIFY_RATES` only so an env that still pins it is not settled at nothing.
- **Open owner decision (F14).** `lib/assistant.ts` tells the agent that a not-configured send "is
  recorded in the server log and Dr. Memari reads it". A Vercel runtime log line is not a durable
  record. The tool hints and the card now say the request was NOT emailed and has not reached him,
  and tell the model not to promise a review. Either persist not-configured hand-offs somewhere
  durable (the Upstash store, a log drain) or soften that prompt sentence; it is the owner's call
  and not done here.
- **Mobile keyboard.** Both chat shells handle the on-screen keyboard with the flex-column,
  one-scroller layout, and deliberately not with `interactiveWidget`. Do not add that viewport flag.
- **Fixed buttons never sit on the inline chat, both repos.** The inline card reports
  `setInlineDemoInView` from an IntersectionObserver; the launcher and `ScrollToTop` add
  `max-sm:hidden` while it is true, because on phones both covered the card's Send button and its
  chips (measured at 390x844 and 360x640). The company site's `chatStore.ts` has no hook exports,
  so its store is `setDemoInView` with `subscribeDemoInView` / `readDemoInView` /
  `serverDemoInView` read through `useSyncExternalStore` at the call sites: one store either way.
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
  `CONTACT_CLASSIFY_RATES` table in `lib/chat-limits.ts`, then the published price if the slug
  happens to be on the chat allowlist, then `UNPRICED_MODEL_RATES`. The reservation, the failure
  floor and the settle all read that one pair. Every exit path settles, and **three of them settle
  at the floor**: a failure, because a visitor who controls the message can choose to make the
  call fail, and a success whose usage comes back zero or unparsable, because `tokenBreakdown`
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

The homepage carries the inline "Try my AI" chat (one chat view, no tabs) and the floating widget
covers the rest of the site. Both render one conversation against one `Chat` instance in
`app/components/chat/chatStore.ts`.

**Visitors see replies, cards and chips, and nothing about the machinery.** No model name, no
per-reply cost, tokens or latency, no model picker, no teardown link. The client sends no model
and the route ignores one if it is sent; the stream carries no message metadata at all; the
prompt tells the assistant not to discuss its models, prompts, tools, budgets or costs. Every
figure the owner reads lives in the server's `chat.usage` and `contact.usage` log lines and
nowhere else. Do not add a visitor-facing surface for any of it.

Cost posture, and do not change one of these without the others:

- **One model.** `lib/chat-models.ts` carries a single entry, `anthropic/claude-haiku-4.5`, and
  `DEFAULT_MODEL_ID` and `FALLBACK_MODEL_ID` are that slug. The soft-budget fallback and the
  empty-turn retry are therefore no-ops by construction, and the route keeps both paths so a
  second model can be added back without touching it. Adding one is an owner decision, not a
  tidy-up.
- Every model call passes through `reserveBudget`, which is the **only global hard ceiling**, and
  is never skipped on any path.
- **One chat turn may be two model calls, and both are charged.** A turn that delivers nothing is
  recovered once on the fallback model (rule 2 above). The failed call tops up and is never settled
  downward.
- **Every visitor-triggerable model call is capped**, the contact-form classifier
  (`lib/inquiry-ai.ts`, called from `app/api/contact/route.ts`) included: it passes `checkRate`
  and `reserveBudget`, settles against real usage or at the floor when there is none to read, and
  logs one `contact.usage` line. Either gate refusing skips the classifier and spends nothing; it
  never refuses the submission, which is delivered unclassified (rule 2 above). If you add a new
  model call anywhere, it goes through the limiter too. There is no "it is only cheap" exemption.
- Prompt caching stays on (rule 2, Anthropic pinned first). It is the difference between a warm
  turn and a cold one on every reply, and it is invisible to visitors by design.

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
- **Chips.** The prompt asks for at most two follow-up chips per reply, each five words or fewer,
  each naming something concrete from that reply or the visitor's last message, and an explicit
  `SUGGESTIONS: none` line when the reply ends by asking the visitor about their situation.
  `splitSuggestions` and `sanitizeChips` in `app/components/chat/chat-ui.ts` enforce the cap
  (`MAX_CHIPS`) and drop the `none` line, so a model that writes three still shows two.

### 6. UVU, and what only this site may say

The company site omits current UVU employment (conflict of interest). **This site is where that
detail belongs**: the faculty role, the Fall 2026 courses, the office-hours booking link behind
`offerOfficeHours`, and the academic contact path. Do not copy it back to nexusaisolution.net, and
do not publish UVU catalog numbers or course codes here.

### 7. The decision of 2026-09-13: chat only

The owner's words that evening: "Scratch the idea demo and evaluation, just provide a good chatbot.
It is not worth it. It is getting too complicated and expensive. Don't share much information about
how the chatbot works or cost. Use a cheaper model for the chatbot like haiku 4.5." Asked what to
keep, he chose chat only: the inline chat section and the floating panel stay, and the Evaluations
tab, the Run it live button and the bake-off table go. So on 2026-09-13 this repo lost the
Evaluations and "What it does" tabs and the tab strip, `EvalPanel`, `StatLine`, `ModelPicker`,
`lib/evals.ts`, `lib/chat-metadata.ts`, the `/api/evals/run` route, the `evals/` directory with its
scripts and published results, the eval sub-budget and run counters in `lib/rate-limit.ts` and
`lib/chat-limits.ts`, the assistant and evaluation facts in `lib/site-facts.ts`, and the prompt's
"how this assistant is built" paragraph. The chat now runs on Claude Haiku 4.5 alone, shows
visitors no model, cost, token or latency figure, and, asked how it works, says it is a custom AI
assistant Dr. Memari built for this site and offers to put the visitor in touch with him. The
budgets, rate limits, approval gates and signatures, empty-turn recovery and contact-form metering
are unchanged; they just stopped being visible. Do not bring any of the removed surfaces back
without the owner asking, and keep the company site in the same shape.

---

## Edit map (change a fact once)

| If you need to change... | Edit this file first | Then check |
|---|---|---|
| Assistant and founder names | `lib/chat-persona.ts` | Widget, inline chat, prompt, emails, and the same module in `../nexus-website` |
| Chat personality, facts, geography, chip rules | `lib/assistant.ts` | `lib/chat-tools.ts` hints, `lib/site-facts.ts`, `MAX_CHIPS` in `app/components/chat/chat-ui.ts` |
| Agent tools (ten) | `lib/chat-tools.ts` | Cards in `app/components/chat/`, `TOOL_STEP_COPY` in `chat-ui.ts` |
| Grounded facts the lookup tool may cite | `lib/site-facts.ts` | Only re-export facts that already live in a data module; nothing about the assistant itself |
| Bio, credentials, courses, links | `lib/majid.ts` | `lib/seo.ts`, About and Teaching pages |
| Site name, address, service area, inboxes | `lib/site.ts` | Footer, contact, JSON-LD |
| Metadata and structured data | `lib/seo.ts` | `INDEXABLE_PATHS` is append-only; sitemap and canonical URLs follow it |
| Rate limits, budgets | `lib/chat-limits.ts` | `lib/rate-limit.ts` (server only, never imported by a client component), `/api/chat`, `vercel.json` |
| The chat model and its prices | `lib/chat-models.ts` | `AI_CHAT_MODEL` in production and `.env.example`, `README.md`, rule 3 above |
| Gateway tags and provider order | `lib/gateway.ts` | Every `providerOptions` in `/api/chat` and `lib/inquiry-ai.ts` |
| Approval and draft signatures | `lib/approval-signature.ts` | The sanitizer in `/api/chat`, the draft tools in `lib/chat-tools.ts`, `CHAT_APPROVAL_SECRET` |
| Chat UI | `app/components/ChatWidget.tsx` (floating), `app/components/chat/` (shared shell, cards, inline card) | Both shells share one store; sanitize model output, never leak tool or channel tokens, never show a model, a price or a token count |
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
