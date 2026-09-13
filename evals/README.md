# Evaluations for the AI Consultant

Three scripts, all run against the real system prompt through Vercel AI
Gateway. Two of them write an artifact the site reads, so the page never
depends on running anything.

A score only exists if someone measured it. Nobody edits a number in
`results/` by hand.

One row of the published table is one generation. The bake-off keeps the
replies it measured, the judge scores those replies rather than fresh ones,
and the page joins a score to a row only when the two artifacts agree on the
run they came from. A score from one sample beside a cost and a latency from
another reads as a single measurement and is not one.

One row is also one judge. Each reply is scored by a model that did not write
it, chosen per reply, so the published table names a judge in every row rather
than one judge for the table.

## Setup

```bash
vercel env pull .env.local            # once; provides AI_GATEWAY_API_KEY
set -a; source .env.local; set +a
```

`tsx` is not a dependency of this repo on purpose, so these scripts need
network access to run (`npx tsx`) and never run during a build. The artifacts
are checked in for exactly that reason.

## The scenario

One prospect, defined once in `lib/evals.ts`: a 40-person logistics company
whose ops team gets wrong answers about its own SOPs, then the real question,
build RAG over the SOPs or fine-tune. Two turns.

## The prompt

Every script renders the prompt with `renderedPrompt()` from `lib/assistant.ts`,
which is `assistantSystem({ emailEnabled: false })`: exactly what production
sends, because production has no email provider configured. Rendering it any
other way would publish a `promptHash` that matches nothing the site runs.

## bakeoff.ts: what each model costs and how fast it is

```bash
npx tsx evals/bakeoff.ts --json \
  anthropic/claude-opus-5 anthropic/claude-sonnet-5 openai/gpt-5.6-sol google/gemini-3.8-flash
```

Plays both turns on each model and records time to first token, total latency,
tokens, and cost. Prices come from `CHAT_MODELS` in `lib/chat-models.ts`, the
same table behind the picker and the page, so the three cannot drift.

**A row it could not measure is never published.** A provider can end a stream
in an error after billing real tokens, and it says so in `finish_reason`, not
in the HTTP status, which was 200 long before. So `completeOrFail` retries a
model once, and if the stream still ends in anything but a clean stop or a
length cutoff, or still carries no text, the whole run stops and names the
model that failed. Nothing is written. A human then decides whether to rerun
without that model and say on the page that it is missing. A published table
that cannot tell a bad answer from no answer is worse than no table.

Writes two files.

`results/bakeoff-latest.json` is the metrics record the page reads, and it
carries **no transcripts**: a reply is not a fact about a model that survives
a version bump, and the page has no business importing model output.

`results/bakeoff-transcripts.json` is the replies those metrics were measured
on, for `judge.ts`. The page never imports it.

Both files are stamped with the same `generatedAt`, `gitSha` and `promptHash`,
so a pair that does not belong together is visible rather than silently wrong.
`gitSha` comes from `VERCEL_GIT_COMMIT_SHA` or `git rev-parse HEAD`, and the
script exits rather than guessing: a number nobody can trace to a commit is
not a result.

## judge.ts: how good the replies are

```bash
npx tsx evals/judge.ts --json
```

Reads `results/bakeoff-transcripts.json` and scores each model's final reply
from 1 to 5 on the five rubric criteria in `lib/evals.ts`: consults before it
sells, specific and honest, sounds like a person, grounded, moves forward. It
generates no reply of its own: the reply it scores is the one the published
cost and latency belong to.

With no model slugs it scores every model in the transcript. Pass slugs to
score a subset. It refuses to run when the transcript and
`results/bakeoff-latest.json` disagree about the run they came from, and warns
when the prompt has changed since the bake-off, because both cases would
publish a score against numbers it does not describe.

**The judge is picked per reply, not per run.** For each row the script calls
`pickJudgeModel()` from `lib/chat-limits.ts` with only that row's model, so the
cheapest allowlisted model that did not write the reply scores it and **no
model scores its own reply**. In practice Gemini 3.8 Flash scores the other
three and Claude Sonnet 5 scores Gemini's row. Picking one judge for the whole
table needed a model nobody had entered, so a bake-off of all four allowlisted
models could not be scored at all; per-row picking is what fixed that, and the
cost of it is that "the judge" is no longer a single thing. Every verdict
records the model that wrote the reply and the model that scored it. The judge
never learns which model wrote a reply.

`generateObject` is deprecated in this SDK version, so this uses `generateText`
with `Output.object`, with no tools attached and a timeout, and guards
`NoOutputGeneratedError`.

A reply with no eligible judge, no text, or no usable verdict is left unscored
and the run says so; if nothing at all was scored the script writes nothing and
exits non-zero, because a file of empty Score cells published as a scored run
is worse than no file.

Writes `results/judge-latest.json` at `schemaVersion` 2, stamped with the
`gitSha`, `promptHash` and `generatedAt` of the bake-off it scored so the page
can check the join. There is no top-level `judgeModel` field: with the judge
picked per row, a single one would be a summary that can disagree with the
rows. The pairing lives on each verdict as `judgeModel` and `judgeLabel`, and
the page drops any verdict whose judge is the model that wrote the reply.

Every model on the allowlist can now be a contestant in the same bake-off. The
page still shows an unscored model as unscored rather than borrowing a number
from somewhere else.

**Being allowlisted is not a promise of a row.** The bake-off publishes only
the models it could measure, so the table can be shorter than the picker.
`results/bakeoff-latest.json` carries three rows as of 2026-09-13, not four:
`google/gemini-3.8-flash` ended its second turn of this conversation in a
provider error on every attempt that day, so the run was republished without
it. The Evaluations panel derives the missing list from the artifact and says
so on the page, and `/api/chat` recovers such a turn on the fallback model
rather than leaving a visitor with an empty reply. Do not fill the gap with a
number from an earlier run.

## tool-smoke.ts: do the tool schemas work on every model

```bash
npx tsx evals/tool-smoke.ts --json
```

Forces one call to each of the seven non-sending tools per picker model, with
the full ten-tool set attached, so every schema is sent to every provider. The
three sending tools are never forced and never execute. Run it after any
change to a tool's input schema: zod features such as `.email()` or regex
patterns compile to JSON Schema keywords some providers reject, which is why
email addresses are plain strings validated inside `execute`.

Writes `results/tool-smoke-latest.json`.

## What the site renders

`lib/evals.ts` reads `results/bakeoff-latest.json` and `results/judge-latest.json`,
validates both against their schemas, and joins them by model when they agree
on the scenario, the commit, the prompt hash and the bake-off timestamp. An
artifact with no runs means the page says no run has been published, and scores
that do not belong to the published run are dropped rather than rendered. Both
are the honest thing for it to say.

The table has a Scored by column, so which model scored which reply is visible
in the row itself, and the line under it names the date and every judge behind
a score that survived the join.

A live run started from the page is a different measurement: one turn, a much
smaller output cap, and its own budget. It is rendered in its own block and
never overwrites a published cell.

## Usage logs

Every `/api/chat` model call logs one `chat.usage` JSON line, every live run
logs one `evals.usage` line, and every contact form submission logs one
`contact.usage` line. Filter Vercel logs on any of them to chart what the
assistant costs. An `evals.usage` line carries `outcome`: a `finished` run
settles against real usage, an `abandoned` one keeps its estimate charged
because the models were called whether or not the visitor stayed.

A `chat.usage` line carries `outcome` and `attempt` too. One turn is usually
one line, `finished`; a turn that handed the visitor nothing logs `no-reply`
with the model that produced nothing and is retried once on the fallback
model, which logs a second line, `recovered` or another `no-reply`. Both calls
are charged. Filter on `no-reply` to see how often a model fails this way and
which one.
